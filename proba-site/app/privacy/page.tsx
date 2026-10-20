import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { Ph } from "@/components/ui/Ph";
import { siteConfig } from "@/config/site.config";
import { enabledChannelNames } from "@/lib/notify";

export const metadata: Metadata = { title: "Политика обработки персональных данных" };

const channelLabels: Record<string, string> = {
  email: "почтовый сервис (SMTP-провайдер) для доставки заявок",
  telegram: "мессенджер Telegram (уведомления сотрудникам)",
  webhook: "CRM-система, подключённая через webhook",
  bitrix24: "CRM Bitrix24",
};

export default function PrivacyPage() {
  const channels = enabledChannelNames();
  return (
    <LegalPage title="Политика обработки персональных данных">
      <h2>1. Оператор</h2>
      <p>
        <Ph value={siteConfig.legalEntityName} />, ИНН <Ph value={siteConfig.inn} />, {siteConfig.ogrnLabel} <Ph value={siteConfig.ogrn} />.
        Контакт по вопросам персональных данных: <Ph value={siteConfig.contactEmail} />.
      </p>
      <h2>2. Цели обработки</h2>
      <ul>
        <li>ответ на заявку, отправленную через форму на сайте;</li>
        <li>подготовка и заключение договора об оказании услуг;</li>
        <li>анализ посещаемости сайта (только при согласии на cookie).</li>
      </ul>
      <h2>3. Какие данные обрабатываются</h2>
      <ul>
        <li>имя, компания, должность, email, телефон или Telegram;</li>
        <li>сведения о продукте и комментарий, указанные в заявке;</li>
        <li>технические данные: IP-адрес, данные cookie, сведения о браузере, метки UTM.</li>
      </ul>
      <h2>4. Правовые основания</h2>
      <p>Согласие субъекта персональных данных; действия по заключению договора по инициативе субъекта. <Ph value="[[ЗАПОЛНИТЬ: уточнить у юриста]]" /></p>
      <h2>5. Сроки хранения</h2>
      <p><Ph value="[[ЗАПОЛНИТЬ: срок хранения заявок]]" /></p>
      <h2>6. Передача третьим лицам</h2>
      {channels.length ? (
        <ul>{channels.map((c) => <li key={c}>{channelLabels[c] ?? c};</li>)}</ul>
      ) : (
        <p>Каналы передачи заявок не настроены.</p>
      )}
      <p>Яндекс Метрика — только при согласии на cookie.</p>
      <h2>7. Место хранения</h2>
      <p>Запись, систематизация, накопление и хранение персональных данных граждан РФ осуществляются с использованием баз данных, находящихся на территории Российской Федерации.</p>
      <h2>8. Права субъекта</h2>
      <p>Вы вправе получить сведения об обработке ваших данных, потребовать их уточнения, блокирования или уничтожения, а также отозвать согласие, направив запрос на <Ph value={siteConfig.contactEmail} />.</p>
      <h2>9. Cookie и аналитика</h2>
      <p>Сайт использует cookie, необходимые для работы, и — только с вашего согласия — Яндекс Метрику. Отказаться можно в баннере при первом посещении или очистив данные сайта в браузере.</p>
    </LegalPage>
  );
}
