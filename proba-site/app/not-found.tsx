import Link from "next/link";
import { Emblem } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[100svh] flex-col items-center justify-center bg-ink px-4 text-center text-ivory">
      <Emblem size={96} />
      <p className="kicker mt-8 text-gold-soft">404</p>
      <h1 className="display mt-4 text-4xl">Этой страницы нет</h1>
      <Link href="/" className="mt-10 border border-gold/70 px-6 py-3 text-[0.8rem] tracking-[0.14em] uppercase hover:bg-gold hover:text-ink">
        На главную
      </Link>
    </main>
  );
}
