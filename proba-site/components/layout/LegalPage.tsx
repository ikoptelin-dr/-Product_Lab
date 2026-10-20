import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/config/site.config";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line-dark bg-ink">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center px-4 sm:px-6">
          <Link href="/" className="text-ivory"><Logo /></Link>
        </div>
      </header>
      <main id="main" className="bg-paper text-ink">
        <article className="mx-auto max-w-[720px] px-4 py-16 sm:px-6 md:py-24 [&_h2]:display [&_h2]:mt-12 [&_h2]:text-2xl [&_li]:mt-1 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
          {!siteConfig.legalReviewed && (
            <p role="note" className="!mt-0 mb-10 border border-risk/40 bg-risk/10 px-4 py-3 text-[0.9rem] text-risk">
              Черновик. Текст должен быть проверен юристом перед публикацией.
            </p>
          )}
          <h1 className="display text-[clamp(2.2rem,5vw,3.2rem)] leading-tight">{title}</h1>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
