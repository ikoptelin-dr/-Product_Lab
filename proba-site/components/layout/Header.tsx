"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { nav, hero } from "@/content/site";
import { chooseTopic } from "@/lib/topic-bus";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>("a,button");
    focusables?.[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && focusables && focusables.length) {
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "border-b border-line-dark bg-ink/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href="#top" className="text-ivory">
          <Logo />
        </a>
        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-9 text-[0.82rem] tracking-[0.08em] text-smoke">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="transition-colors hover:text-ivory">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => chooseTopic(hero.primary.topic)}
            className="hidden min-h-11 border border-gold/70 px-5 text-[0.78rem] tracking-[0.14em] text-gold-pale uppercase transition-colors hover:bg-gold hover:text-ink sm:inline-flex sm:items-center"
          >
            Пробник
          </button>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-ivory transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-6 bg-ivory transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="h-[calc(100dvh-72px)] overflow-y-auto bg-ink px-4 pt-6 pb-10 sm:px-6 lg:hidden"
        >
          <ul className="flex flex-col">
            {nav.map((n) => (
              <li key={n.href} className="border-b border-line-dark">
                <a href={n.href} onClick={() => setOpen(false)} className="display block py-5 text-3xl">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              chooseTopic(hero.primary.topic);
            }}
            className="mt-10 min-h-12 w-full bg-gold px-6 text-sm tracking-[0.14em] text-ink uppercase"
          >
            {hero.primary.label}
          </button>
        </div>
      )}
    </header>
  );
}
