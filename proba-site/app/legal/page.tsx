import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { Ph } from "@/components/ui/Ph";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = { title: "Реквизиты" };

export default function LegalInfoPage() {
  const rows: [string, string][] = [
    ["Наименование", siteConfig.legalEntityName],
    ["ИНН", siteConfig.inn],
    [siteConfig.ogrnLabel, siteConfig.ogrn],
    ["Email", siteConfig.contactEmail],
    ["Город", siteConfig.city],
  ];
  return (
    <LegalPage title="Реквизиты">
      <dl className="mt-10 divide-y divide-line border-y border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-4">
            <dt className="text-muted">{k}</dt>
            <dd><Ph value={v} /></dd>
          </div>
        ))}
      </dl>
    </LegalPage>
  );
}
