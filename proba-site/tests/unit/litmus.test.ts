import { describe, expect, it } from "vitest";
import { checkClaim } from "@/lib/litmus";

const ids = (s: string) => checkClaim(s).hits.map((h) => h.rule.id);

describe("checkClaim", () => {
  it("находит лечебное действие, болезнь и срок", () => {
    const r = checkClaim("Лечит гастрит за 7 дней");
    expect(r.score).toBe("high");
    expect(ids("Лечит гастрит за 7 дней")).toEqual(expect.arrayContaining(["cure", "disease", "speed"]));
  });
  it("находит гарантию и «клинически доказано»", () => {
    expect(ids("Клинически доказано: на 100% укрепляет иммунитет")).toEqual(expect.arrayContaining(["guarantee", "proof"]));
  });
  it("нейтральная формулировка — без маркеров", () => {
    expect(checkClaim("Источник цинка. Цинк способствует нормальной работе иммунной системы").score).toBe("clean");
  });
  it("сегменты собираются обратно в исходный текст", () => {
    const text = "Лучший комплекс, без побочных эффектов";
    expect(checkClaim(text).segments.map((s) => s.text).join("")).toBe(text);
  });
  it("не срабатывает на «от» внутри слова", () => {
    expect(ids("Работает отлично")).not.toContain("disease");
  });
});
