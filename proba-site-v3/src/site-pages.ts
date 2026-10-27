// Все страницы сайта для сборки: главная, направления, «Как мы работаем», раздел «Документы»,
// страницы подвала, цены, лид-магниты, блог, юридические документы и тексты волн 1–4 (proba-growth/content/pages).
// Тексты волн заменяют одноимённые страницы на шаблонах (registraciya-bad, haccp, deklaracii, tu, markirovka, laboratorii,
// главная, «О нас», «Как мы работаем»); старые адреса kalkulyator-sku, dokumenty/sanpin, blog/ekonomika-sku-marketplejs —
// переадресации (scripts/build.mjs).
import { renderDoc, type PageDoc } from "./layout";
import { renderBlog } from "./pages/blog";
import { COMPANY_PAGES } from "./pages/company";
import { renderContent, type ContentPage } from "./pages/content";
import { home } from "./pages/home";
import { renderLegal, type LegalHtml } from "./pages/legal";
import { SERVICE_PAGES } from "./pages/services";
import { TOOL_PAGES } from "./pages/tools";
import { collected, renderAll } from "./regulatory/render";

/** Старые адреса → новые (для переадресаций и 301 на сервере). */
export const MOVED: Record<string, string> = {
  "kalkulyator-sku.html": "analitika/kalkulyator-yunit-ekonomiki.html",
  "dokumenty/sanpin.html": "dokumenty/proverki-rospotrebnadzora.html",
  "blog/ekonomika-sku-marketplejs.html": "blog/yunit-ekonomika-prostymi-slovami.html",
  "dokumenty/kak-my-rabotaem.html": "kak-my-rabotaem.html",
};

export function renderSite(legal: LegalHtml, content: ContentPage[]) {
  // renderAll() сбрасывает список фактов — новые страницы с метками f(…) рендерятся после него
  const reg = renderAll();
  const docs: PageDoc[] = [home, ...SERVICE_PAGES, ...COMPANY_PAGES, ...TOOL_PAGES(), ...renderBlog(), ...renderLegal(legal)];
  const own = content.map(renderContent);
  const replaced = new Set([...own.map((d) => d.path), ...Object.keys(MOVED)]);
  const slugOf = (path: string) => (path === "index.html" ? "home" : path.replace(/\.html$/, ""));
  const top = docs.filter((d) => !replaced.has(d.path)).map((d) => ({ path: d.path, slug: slugOf(d.path), title: d.title, html: renderDoc(d) }));
  const regFiles = reg.files.filter((f) => !replaced.has(f.path));
  const mine = own.map((d) => ({ path: d.path, slug: slugOf(d.path), title: d.title, html: renderDoc(d) }));
  const files = [...top, ...regFiles, ...mine];
  const { facts, warnings } = collected();
  // Факты заменённых страниц-шаблонов в сверку не идут
  const live = new Set(files.map((f) => f.slug));
  return { files, facts: facts.filter((x) => live.has(x.page)), warnings, sources: reg.sources, moved: MOVED };
}
