"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "proba_cookie_consent";
type Choice = "accepted" | "declined" | null;

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Баннер согласия. Яндекс Метрика подключается только после «Принять» и только если задан NEXT_PUBLIC_YM_ID. */
export function CookieBanner({ ymId }: { ymId: string }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readChoice());
    setReady(true);
  }, []);

  const decide = (c: Exclude<Choice, null>) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* без storage — выбор действует до перезагрузки */
    }
    setChoice(c);
  };

  return (
    <>
      {ymId && choice === "accepted" && (
        <Script id="ym" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${Number(ymId)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
        `}</Script>
      )}
      {ready && ymId && choice === null && (
        <div
          role="region"
          aria-label="Cookie"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl border border-line-dark bg-graphite/95 p-5 text-[0.85rem] text-ivory shadow-2xl backdrop-blur sm:inset-x-6"
        >
          <p className="leading-relaxed text-ivory/85">
            Мы используем cookie и Яндекс Метрику для анализа посещаемости.{" "}
            <a href="/privacy" className="underline decoration-gold underline-offset-4">Подробнее</a>
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => decide("accepted")} className="min-h-11 bg-gold px-5 text-ink">Принять</button>
            <button type="button" onClick={() => decide("declined")} className="min-h-11 border border-line-dark px-5">Отклонить</button>
          </div>
        </div>
      )}
    </>
  );
}
