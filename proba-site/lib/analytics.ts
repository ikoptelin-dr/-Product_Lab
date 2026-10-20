"use client";

export type Goal = "cta_hero_click" | "cta_offer_click" | "service_select" | "lead_submit" | "lead_error" | "litmus_check";

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void;
  }
}

export function reachGoal(goal: Goal) {
  const id = Number(process.env.NEXT_PUBLIC_YM_ID);
  if (!id || typeof window === "undefined" || typeof window.ym !== "function") return;
  try {
    window.ym(id, "reachGoal", goal);
  } catch {
    /* аналитика не должна ломать интерфейс */
  }
}
