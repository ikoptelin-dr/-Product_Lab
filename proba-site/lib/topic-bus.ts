"use client";

import type { TOPICS } from "@/lib/lead-schema";

export const TOPIC_EVENT = "proba:topic";

/** Выбирает тему в форме и прокручивает к ней. */
export function chooseTopic(topic: (typeof TOPICS)[number]) {
  window.dispatchEvent(new CustomEvent(TOPIC_EVENT, { detail: topic }));
  const el = document.getElementById("contact");
  if (el) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}
