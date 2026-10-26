// Все страницы сайта для сборки: главная, направления, «Как мы работаем», раздел «Документы»,
// страницы подвала, цены, лид-магниты, блог и юридические документы.
import { renderDoc, type PageDoc } from "./layout";
import { renderBlog } from "./pages/blog";
import { COMPANY_PAGES } from "./pages/company";
import { home } from "./pages/home";
import { renderLegal, type LegalHtml } from "./pages/legal";
import { SERVICE_PAGES } from "./pages/services";
import { TOOL_PAGES } from "./pages/tools";
import { collected, renderAll } from "./regulatory/render";

export function renderSite(legal: LegalHtml) {
  // renderAll() сбрасывает список фактов — новые страницы с метками f(…) рендерятся после него
  const reg = renderAll();
  const docs: PageDoc[] = [home, ...SERVICE_PAGES, ...COMPANY_PAGES, ...TOOL_PAGES(), ...renderBlog(), ...renderLegal(legal)];
  // slug главной — "home": "index" занят хабом раздела «Документы» (иначе его факты дублировались под главной в REGULATORY_VERIFY.md)
  const top = docs.map((d) => ({ path: d.path, slug: d.path === "index.html" ? "home" : d.path.replace(/\.html$/, ""), title: d.title, html: renderDoc(d) }));
  const { facts, warnings } = collected();
  return { files: [...top, ...reg.files], facts, warnings, sources: reg.sources };
}
