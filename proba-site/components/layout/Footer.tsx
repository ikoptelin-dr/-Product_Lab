import Link from "next/link";
import { Emblem, Wordmark } from "@/components/brand/Logo";
import { Ph } from "@/components/ui/Ph";
import { footer } from "@/content/site";
import { siteConfig } from "@/config/site.config";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line-dark bg-ink text-smoke">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-14 text-[0.82rem] sm:px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-4 text-ivory">
          <Emblem size={48} />
          <Wordmark />
        </div>
        <div className="space-y-2 md:text-right">
          <p>
            © Proba Lab, {year}. <Ph value={siteConfig.legalEntityName} />, ИНН <Ph value={siteConfig.inn} />, {siteConfig.ogrnLabel}{" "}
            <Ph value={siteConfig.ogrn} />.
          </p>
          <nav aria-label="Правовая информация">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
              <li><Link href="/privacy" className="hover:text-ivory">Политика обработки персональных данных</Link></li>
              <li><Link href="/consent" className="hover:text-ivory">Согласие на обработку персональных данных</Link></li>
              <li><Link href="/legal" className="hover:text-ivory">Реквизиты</Link></li>
            </ul>
          </nav>
          <p>{footer.notOffer}</p>
          <p>{footer.place}</p>
        </div>
      </div>
    </footer>
  );
}
