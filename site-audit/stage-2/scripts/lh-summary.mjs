// Сводка 3 прогонов Lighthouse на страницу: медиана и разброс (min–max) LCP, CLS, TBT, performance.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const DIR = "/home/user/-Product_Lab/site-audit/stage-2/evidence/lighthouse/runs";
const files = readdirSync(DIR).filter((f) => f.endsWith(".report.json"));
const by = {};
for (const f of files) {
  const r = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  const page = r.finalDisplayedUrl.replace(/^https?:\/\/[^/]+\//, "");
  (by[page] ||= []).push({
    run: f.match(/run(\d)/)[1], perf: r.categories.performance.score * 100,
    a11y: r.categories.accessibility?.score * 100, bp: r.categories["best-practices"]?.score * 100, seo: r.categories.seo?.score * 100,
    lcp: r.audits["largest-contentful-paint"].numericValue, cls: r.audits["cumulative-layout-shift"].numericValue, tbt: r.audits["total-blocking-time"].numericValue,
    fcp: r.audits["first-contentful-paint"].numericValue, err: r.runtimeError?.code || "", warn: (r.runWarnings || []).join("; "),
    lcpEl: r.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 80) || "",
    seoFails: Object.values(r.audits).filter((a) => r.categories.seo.auditRefs.some((x) => x.id === a.id) && a.score === 0).map((a) => a.id).join(","),
    a11yFails: Object.values(r.audits).filter((a) => r.categories.accessibility.auditRefs.some((x) => x.id === a.id) && a.score === 0).map((a) => a.id).join(","),
    bpFails: Object.values(r.audits).filter((a) => r.categories["best-practices"].auditRefs.some((x) => x.id === a.id) && a.score === 0).map((a) => a.id).join(","),
    ver: r.lighthouseVersion, ua: r.environment.hostUserAgent, formFactor: r.configSettings.formFactor, throttling: r.configSettings.throttlingMethod,
  });
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const rows = [["page", "runs", "perf_median", "perf_min", "perf_max", "lcp_ms_median", "lcp_min", "lcp_max", "cls_median", "cls_min", "cls_max", "tbt_ms_median", "tbt_min", "tbt_max", "fcp_ms_median", "a11y", "best_practices", "seo", "seo_failed_audits", "a11y_failed_audits", "bp_failed_audits", "lcp_element", "errors"]];
for (const [p, rs] of Object.entries(by).sort()) {
  const v = (k) => rs.map((x) => x[k]);
  const r0 = (x) => Math.round(x);
  rows.push([p, rs.length, med(v("perf")), Math.min(...v("perf")), Math.max(...v("perf")), r0(med(v("lcp"))), r0(Math.min(...v("lcp"))), r0(Math.max(...v("lcp"))), med(v("cls")).toFixed(3), Math.min(...v("cls")).toFixed(3), Math.max(...v("cls")).toFixed(3), r0(med(v("tbt"))), r0(Math.min(...v("tbt"))), r0(Math.max(...v("tbt"))), r0(med(v("fcp"))), med(v("a11y")), med(v("bp")), med(v("seo")), [...new Set(v("seoFails"))].join("|"), [...new Set(v("a11yFails"))].join("|"), [...new Set(v("bpFails"))].join("|"), rs[0].lcpEl, v("err").filter(Boolean).join("|")]);
}
const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
writeFileSync("/home/user/-Product_Lab/site-audit/stage-2/evidence/lighthouse/summary.csv", csv + "\n");
const any = Object.values(by)[0][0];
writeFileSync("/home/user/-Product_Lab/site-audit/stage-2/evidence/lighthouse/settings.txt", `lighthouse ${any.ver}\nformFactor ${any.formFactor}\nthrottlingMethod ${any.throttling}\nUA ${any.ua}\nruns ${files.length}\n`);
console.log(csv);
