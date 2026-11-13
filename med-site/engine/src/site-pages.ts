// Страницы сайта Proba-Product Laboratory: тексты content/pages/*.md + юридические документы.
import { renderDoc, type PageDoc } from "./layout";
import { renderContent, type ContentPage } from "./pages/content";
import { renderLegal, type LegalHtml } from "./pages/legal";
import { collected, renderAll } from "./regulatory/render";

export const MOVED: Record<string, string> = {};

export function renderSite(legal: LegalHtml, content: ContentPage[]) {
  const reg = renderAll(); // только реестр источников; страницы раздела «Документы» на этот сайт не идут
  const docs: PageDoc[] = [...renderLegal(legal), ...content.map(renderContent)];
  const slugOf = (path: string) => (path === "index.html" ? "home" : path.replace(/\.html$/, ""));
  const files = docs.map((d) => ({ path: d.path, slug: slugOf(d.path), title: d.title, html: renderDoc(d) }));
  const { facts, warnings } = collected();
  const live = new Set(files.map((f) => f.slug));
  return { files, facts: facts.filter((x) => live.has(x.page)), warnings: warnings.filter((w) => live.has(w.split(":")[0].replace(/\.html$/, ""))), sources: reg.sources, moved: MOVED };
}
