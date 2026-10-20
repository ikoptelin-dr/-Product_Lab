import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("главная грузится без ошибок консоли, H1 виден", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Докажите, что продукт работает");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("нет горизонтального скролла на 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("якорная навигация и мобильное меню", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    const toggle = page.getByRole("button", { name: "Открыть меню" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Меню" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await toggle.click();
    await menu.getByRole("link", { name: "FAQ" }).click();
  } else {
    await page.getByRole("navigation", { name: "Основная навигация" }).getByRole("link", { name: "FAQ" }).click();
  }
  await expect(page).toHaveURL(/#faq$/);
  await expect(page.locator("#faq-title")).toBeInViewport();
});

test("ноты переключаются, включая клавиатуру", async ({ page }) => {
  await page.goto("/");
  const top = page.getByRole("tab", { name: /Верхние ноты/ });
  await top.click();
  await expect(top).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Матрица из 20–40 формулировок");
  await top.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Ноты сердца/ })).toHaveAttribute("aria-selected", "true");
});

test("мюйетка подсвечивает риск", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Лечит гастрит за 7 дней" }).click();
  await expect(page.getByText("Высокий риск")).toBeVisible();
  await expect(page.getByText("Лечебное действие")).toBeVisible();
});

test("кнопка услуги предвыбирает тему в форме", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Выбрать.*Доказательное досье/ }).click();
  await expect(page.getByLabel("Что нужно *")).toHaveValue("Доказательное досье");
});

test("пустая форма: ошибки и фокус на первом поле", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText("Укажите имя")).toBeVisible();
  await expect(page.getByLabel("Имя *")).toBeFocused();
  await expect(page.getByLabel("Имя *")).toHaveAttribute("aria-invalid", "true");
});

async function fill(page: import("@playwright/test").Page) {
  await page.getByLabel("Имя *").fill("Анна");
  await page.getByLabel("Компания *").fill("ООО Тест");
  await page.getByLabel("Email *").fill("anna@example.com");
  await page.locator("#consent").check();
}

test("успешная отправка", async ({ page }) => {
  await page.route("/api/lead", (r) => r.fulfill({ status: 200, json: { ok: true } }));
  await page.goto("/#contact");
  await fill(page);
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Заявка получена" })).toBeVisible();
});

test("ошибка сервера", async ({ page }) => {
  await page.route("/api/lead", (r) => r.fulfill({ status: 500, json: { ok: false, error: "internal" } }));
  await page.goto("/#contact");
  await fill(page);
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Не удалось отправить" })).toBeVisible();
});

test("FAQ раскрывается с клавиатуры", async ({ page }) => {
  await page.goto("/");
  const summary = page.locator("#faq summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#faq details").first()).toHaveAttribute("open", "");
});

test("правовые страницы открываются", async ({ page }) => {
  for (const [path, title] of [["/privacy", "Политика"], ["/consent", "Согласие"], ["/legal", "Реквизиты"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
  }
});

test("API: невалидная заявка → 400, honeypot → 200", async ({ request }) => {
  const bad = await request.post("/api/lead", { data: { name: "" } });
  expect(bad.status()).toBe(400);
  const bot = await request.post("/api/lead", { data: { website: "x" } });
  expect(bot.status()).toBe(200);
});
