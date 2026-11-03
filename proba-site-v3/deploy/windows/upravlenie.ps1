# Управление сервером Proba Lab на Windows. Запускается из .bat-файлов в этой же папке.
#   ustanovka — разблокировать файлы, открыть порты 80/443, отключить сон, включить автозапуск (2 задачи планировщика), запустить
#   proverka  — проверить всё по шагам и показать, что не так
#   start / stop — запустить / остановить сайт
#   udalit    — остановить и убрать автозапуск и правила брандмауэра
# Задачи планировщика работают от SYSTEM и стартуют при включении компьютера, даже без входа в Windows.
param([string]$Action = "proverka")

$ErrorActionPreference = "Stop"
$Dir = Split-Path -Parent $PSCommandPath
$Tasks = @(
  @{ Name = "Proba - sajt";  File = "sluzhba-sajt.bat" },
  @{ Name = "Proba - caddy"; File = "sluzhba-caddy.bat" }
)
$Domain = "proba-lab.ru"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [!!] $t" -ForegroundColor Yellow }
function Bad($t)  { Write-Host "  [XX] $t" -ForegroundColor Red }
function Step($t) { Write-Host ""; Write-Host $t -ForegroundColor Cyan }
function Finish {
  Write-Host ""
  Read-Host "Нажмите Enter, чтобы закрыть окно" | Out-Null
  exit
}

# Всё делается с правами администратора: если их нет — перезапускаемся с запросом прав
$me = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $me.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  try {
    Start-Process powershell.exe -Verb RunAs -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"", $Action)
  } catch {
    Write-Host "Нужны права администратора: запустите файл ещё раз и в окне Windows нажмите «Да»." -ForegroundColor Yellow
    Read-Host "Нажмите Enter, чтобы закрыть окно" | Out-Null
  }
  exit
}

function Find-Node {
  # Сначала node.exe рядом с файлами (из zip-архива Node.js) или в распакованной папке node-v...
  $p = Join-Path $Dir "node.exe"
  if (Test-Path $p) { return $p }
  $d = Get-ChildItem -Path $Dir -Directory -Filter "node-*" -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName "node.exe") } | Select-Object -First 1
  if ($d) { return (Join-Path $d.FullName "node.exe") }
  $p = Join-Path $env:ProgramFiles "nodejs\node.exe"
  if (Test-Path $p) { return $p }
  $c = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  return $null
}
function Find-Caddy {
  $c = Get-ChildItem -Path $Dir -Filter "caddy*.exe" -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { return $c.FullName }
  return $null
}
function Read-Settings {
  $s = @{}
  $f = Join-Path $Dir "nastrojki.txt"
  if (Test-Path $f) {
    foreach ($line in Get-Content -Path $f -Encoding UTF8) {
      $l = $line.Trim()
      if ($l -eq "" -or $l.StartsWith("#")) { continue }
      $i = $l.IndexOf("=")
      if ($i -gt 0) { $s[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim().Trim('"').Trim("'") }
    }
  }
  return $s
}

function Stop-Site {
  foreach ($t in $Tasks) { Stop-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue }
  # Задача останавливает только cmd.exe, поэтому закрываем и node.exe / caddy.exe, запущенные из этой папки
  # (только эти программы: открытый Блокнот с nastrojki.txt не трогаем)
  $needle = $Dir.ToLower()
  $procs = Get-CimInstance Win32_Process | Where-Object {
    $cl = if ($_.CommandLine) { $_.CommandLine.ToLower() } else { "" }
    $cl.Contains($needle) -and $_.ProcessId -ne $PID -and (
      $_.Name -eq "node.exe" -or $_.Name -like "caddy*.exe" -or ($_.Name -eq "cmd.exe" -and $cl.Contains("sluzhba-")))
  }
  foreach ($p in ($procs | Sort-Object { if ($_.Name -eq "cmd.exe") { 0 } else { 1 } })) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Start-Site {
  foreach ($t in $Tasks) { Start-ScheduledTask -TaskName $t.Name }
}

function Install {
  Step "1. Проверяю, что всё на месте"
  if ($Dir.Contains(" ") -or ($Dir -match "[^\x00-\x7F]")) { Bad "Папка $Dir — в пути есть пробел или русские буквы. Перенесите папку в D:\proba (или C:\proba) и запустите снова."; Finish }
  $node = Find-Node
  if (-not $node) { Bad "Не найден Node.js. Установите его (шаг 2 инструкции) и запустите снова."; Finish }
  Ok "Node.js: $node"
  $caddy = Find-Caddy
  if (-not $caddy) { Bad "В папке $Dir нет файла caddy...exe. Скачайте Caddy (шаг 3 инструкции) и положите в эту папку."; Finish }
  Ok "Caddy: $caddy"
  if (-not (Test-Path (Join-Path $Dir "site\index.html"))) { Bad "Нет папки site с сайтом внутри $Dir."; Finish }
  Ok "Сайт: $Dir\site"

  Step "2. Снимаю отметку «скачано из интернета» с файлов"
  Get-ChildItem -Path $Dir -Recurse -File | Unblock-File -ErrorAction SilentlyContinue
  # Мусор от копирования через Mac (файлы ._имя) и отметка «скрытый» — убираем
  Get-ChildItem -Path $Dir -Recurse -Force -Filter "._*" -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  foreach ($item in @(Get-Item -Path $Dir -Force) + @(Get-ChildItem -Path $Dir -Recurse -Force -ErrorAction SilentlyContinue)) {
    if ($item.Attributes -band [IO.FileAttributes]::Hidden) { $item.Attributes = $item.Attributes -bxor [IO.FileAttributes]::Hidden }
  }
  Ok "Готово"

  Step "3. Открываю порты 80 и 443 в брандмауэре Windows"
  foreach ($port in 80, 443) {
    $name = "Proba - port $port"
    if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
      New-NetFirewallRule -DisplayName $name -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    }
    Ok "Порт $port открыт"
  }

  Step "4. Запрещаю компьютеру засыпать (при работе от сети)"
  powercfg /change standby-timeout-ac 0 | Out-Null
  powercfg /change hibernate-timeout-ac 0 | Out-Null
  Ok "Сон и гибернация отключены"

  Step "5. Включаю автозапуск сайта при включении компьютера"
  Stop-Site
  $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
  $trigger = New-ScheduledTaskTrigger -AtStartup
  foreach ($t in $Tasks) {
    $bat = Join-Path $Dir $t.File
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$bat`"" -WorkingDirectory $Dir
    Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Ok "Задача «$($t.Name)» создана"
  }

  Step "6. Запускаю сайт"
  Start-Site
  Start-Sleep -Seconds 5
  Ok "Запущено. Дальше — проверка."
  Check
}

function Check {
  Step "Проверка сервера Proba Lab (папка $Dir)"

  try {
    $net = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } | Select-Object -First 1
    if ($net) { Ok "Адрес этого компьютера в домашней сети: $($net.IPv4Address[0].IPAddress)   Адрес роутера: $($net.IPv4DefaultGateway[0].NextHop)" }
  } catch {}

  $node = Find-Node
  if ($node) {
    $v = (& $node --version) 2>$null
    if ($v -match "^v(\d+)" -and [int]$Matches[1] -ge 18) { Ok "Node.js установлен: $v" } else { Bad "Node.js слишком старый ($v): нужна версия 18 или новее (LTS с nodejs.org)" }
  } else { Bad "Node.js не установлен — шаг 2 инструкции" }

  $caddy = Find-Caddy
  if ($caddy) { Ok "Caddy на месте: $(Split-Path -Leaf $caddy)" } else { Bad "В папке нет caddy...exe — шаг 3 инструкции" }

  if (Test-Path (Join-Path $Dir "site\index.html")) { Ok "Папка site с сайтом на месте" } else { Bad "Нет папки site с сайтом" }

  $s = Read-Settings
  if ($s["SMTP_USER"] -and $s["SMTP_PASS"]) {
    $to = if ($s["MAIL_TO"]) { $s["MAIL_TO"] } else { $s["SMTP_USER"] }
    Ok "Почта настроена: заявки придут на $to (проверить отправку — 4-PROVERIT-POCHTU.bat)"
  } else { Warn "Почта не настроена (SMTP_USER и SMTP_PASS в nastrojki.txt)" }
  if ($s["TG_TOKEN"] -and $s["TG_CHAT"]) {
    try {
      $r = Invoke-RestMethod -Uri ("https://api.telegram.org/bot" + $s["TG_TOKEN"] + "/getMe") -TimeoutSec 15
      if ($r.ok) { Ok "Telegram-бот работает: @$($r.result.username)" } else { Bad "Telegram не принял токен — проверьте TG_TOKEN в nastrojki.txt" }
    } catch {
      $code = $null
      try { $code = [int]$_.Exception.Response.StatusCode } catch {}
      if ($code -eq 401 -or $code -eq 404) { Bad "Telegram не принял токен — проверьте TG_TOKEN в nastrojki.txt (без пробелов и кавычек)" }
      else { Bad "api.telegram.org не открывается с этого компьютера — похоже на блокировку Telegram у провайдера. Заявки сохраняются в папке zayavki" }
    }
  } else { Warn "Telegram не настроен (nastrojki.txt)" }

  foreach ($t in $Tasks) {
    $task = Get-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue
    if (-not $task) { Warn "Автозапуск «$($t.Name)» не включён — запустите 2-VKLYUCHIT-AVTOZAPUSK.bat" }
    elseif ($task.State -eq "Running") { Ok "«$($t.Name)» работает" }
    else { Bad "«$($t.Name)» не работает (состояние: $($task.State)) — смотрите файл в папке logs" }
  }

  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:8080/" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -eq 200) { Ok "Сайт открывается на этом компьютере: http://localhost:8080" }
  } catch { Bad "Сайт не отвечает на http://localhost:8080 — смотрите logs\sajt.log" }

  foreach ($port in 80, 443) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $c) { Bad "Порт $port никто не слушает — Caddy не запущен, смотрите logs\caddy.log" ; continue }
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -like "caddy*") { Ok "Порт $port слушает Caddy" }
    else { Bad "Порт $port занят другой программой: $($p.ProcessName). Её нужно отключить (часто это IIS или Skype)" }
  }

  $ip = $null
  try { $ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 15).ToString().Trim() } catch {}
  if ($ip) { Ok "Внешний IP этого подключения: $ip  (сравните с IP в настройках роутера — шаг 0 инструкции)" } else { Warn "Не удалось узнать внешний IP (нет интернета?)" }

  try {
    $dns = @(Resolve-DnsName -Name $Domain -Type A -Server 8.8.8.8 -DnsOnly -ErrorAction Stop | Where-Object { $_.Type -eq "A" } | ForEach-Object { $_.IPAddress })
    if ($dns.Count -eq 0) { Warn "У $Domain нет A-записи — шаг 9 инструкции" }
    elseif ($ip -and ($dns -contains $ip) -and $dns.Count -eq 1) { Ok "$Domain указывает на этот сервер ($ip)" }
    elseif ($ip -and ($dns -contains $ip)) { Warn "$Domain указывает на несколько адресов: $($dns -join ', '). Оставьте у регистратора только $ip" }
    else { Bad "$Domain указывает на $($dns -join ', '), а не на $ip — исправьте A-запись у регистратора (шаг 9)" }
  } catch { Warn "Не удалось проверить DNS для $Domain (домен ещё не настроен или нет интернета)" }

  # Сертификат HTTPS: что пишет Caddy в журнале
  $clog = Join-Path $Dir "logs\caddy.log"
  if (Test-Path $clog) {
    $tail = @(Get-Content -Path $clog -Tail 400 -Encoding UTF8 -ErrorAction SilentlyContinue)
    $okLine = $tail | Where-Object { $_ -match "certificate obtained successfully" -and $_ -match [regex]::Escape($Domain) } | Select-Object -Last 1
    $errLine = $tail | Where-Object { $_ -match '"level":"error"' -and ($_ -match "obtain|acme|challenge|certificate") } | Select-Object -Last 1
    $okIdx = if ($okLine) { [array]::LastIndexOf($tail, $okLine) } else { -1 }
    $errIdx = if ($errLine) { [array]::LastIndexOf($tail, $errLine) } else { -1 }
    if ($okIdx -ge 0 -and $okIdx -gt $errIdx) { Ok "HTTPS-сертификат для $Domain получен" }
    elseif ($errIdx -ge 0) {
      $e = $errLine
      if ($e -match "Timeout during connect|connection refused|Connection reset|firewall") { Bad "Сертификат не получен: из интернета не достучаться до сервера. Проверьте проброс портов 80 и 443 на роутере (шаг 8). Если всё верно — провайдер закрывает входящие порты, позвоните ему" }
      elseif ($e -match "NXDOMAIN|DNS problem|no valid A records|SERVFAIL") { Bad "Сертификат не получен: домен ещё не указывает на сервер (DNS не обновился). Подождите 1–2 часа (шаг 9)" }
      elseif ($e -match "rateLimited|too many") { Bad "Сертификат не получен: слишком много попыток. Подождите час — Caddy попробует сам" }
      elseif ($e -match "unauthorized|Invalid response|404") { Bad "Сертификат не получен: проверку прошёл другой сервер — вероятно, домен ещё указывает на старый адрес или порт 80 проброшен не на этот компьютер" }
      else { Bad "Сертификат не получен. Последняя ошибка Caddy — пришлите её:" ; Write-Host ("       " + $e.Substring(0, [Math]::Min(400, $e.Length))) }
      Write-Host "       После исправления запустите OSTANOVIT-SAJT.bat и ZAPUSTIT-SAJT.bat — Caddy сразу попробует снова."
    } else { Warn "Caddy ещё не пытался получить сертификат (подождите пару минут и запустите проверку снова)" }
  }

  Write-Host ""
  Write-Host "Главная проверка — с телефона через мобильный интернет (Wi-Fi выключить): откройте https://$Domain" -ForegroundColor Cyan
  Write-Host "Журналы: $Dir\logs   Заявки: $Dir\zayavki"
}

switch ($Action) {
  "ustanovka" { Install }
  "proverka"  { Check }
  "start"     { Start-Site; Start-Sleep -Seconds 5; Ok "Сайт запущен"; Check }
  "stop"      { Stop-Site; Ok "Сайт остановлен" }
  "udalit"    {
    Stop-Site
    foreach ($t in $Tasks) { Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false -ErrorAction SilentlyContinue }
    foreach ($port in 80, 443) { Remove-NetFirewallRule -DisplayName "Proba - port $port" -ErrorAction SilentlyContinue }
    Ok "Автозапуск и правила брандмауэра удалены. Файлы в папке не тронуты."
  }
  default { Bad "Неизвестная команда: $Action" }
}
Finish
