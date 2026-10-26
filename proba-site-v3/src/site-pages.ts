// Все страницы сайта для сборки: главная, направления, «Как мы работаем» и раздел «Документы».
import { renderDoc } from "./layout";
import { home } from "./pages/home";
import { SERVICE_PAGES } from "./pages/services";
import { renderAll } from "./regulatory/render";

export function renderSite() {
  const reg = renderAll();
  const top = [home, ...SERVICE_PAGES].map((d) => ({ path: d.path, slug: d.path.replace(/\.html$/, ""), title: d.title, html: renderDoc(d) }));
  return { files: [...top, ...reg.files], facts: reg.facts, warnings: reg.warnings, sources: reg.sources };
}
