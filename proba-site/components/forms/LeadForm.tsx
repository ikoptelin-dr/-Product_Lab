"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { contact } from "@/content/site";
import { reachGoal } from "@/lib/analytics";
import { CATEGORIES, leadSchema, TOPICS } from "@/lib/lead-schema";
import { TOPIC_EVENT } from "@/lib/topic-bus";

type Topic = (typeof TOPICS)[number];
type Status = "idle" | "sending" | "success" | "error";
type Errors = Partial<Record<string, string>>;

const FIELD_ORDER = ["name", "company", "position", "email", "contact", "topic", "category", "productUrl", "message", "consent"];
const UTM_KEY = "proba_utm";

function readUtm(): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : undefined;
  } catch {
    return undefined;
  }
}

function storeUtm() {
  try {
    if (sessionStorage.getItem(UTM_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    params.forEach((v, k) => {
      if (k.startsWith("utm_")) utm[k] = v.slice(0, 200);
    });
    if (document.referrer) utm.referrer = document.referrer.slice(0, 200);
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    /* storage недоступен — атрибуция не критична */
  }
}

const inputCls =
  "mt-2 w-full border border-ink/20 bg-ivory px-4 py-3 text-[1rem] text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none aria-[invalid=true]:border-risk";

export function LeadForm({ contactEmail, captchaKey }: { contactEmail?: string; captchaKey?: string }) {
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const startedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    storeUtm();
    const fromUrl = new URLSearchParams(window.location.search).get("topic");
    const match = TOPICS.find((t) => t === fromUrl);
    if (match) setTopic(match);
    const onTopic = (e: Event) => {
      const t = (e as CustomEvent<string>).detail;
      const found = TOPICS.find((x) => x === t);
      if (found) setTopic(found);
    };
    window.addEventListener(TOPIC_EVENT, onTopic);
    return () => window.removeEventListener(TOPIC_EVENT, onTopic);
  }, []);

  const focusFirstError = (errs: Errors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      position: String(fd.get("position") ?? ""),
      email: String(fd.get("email") ?? ""),
      contact: String(fd.get("contact") ?? ""),
      topic: String(fd.get("topic") ?? ""),
      category: String(fd.get("category") ?? ""),
      productUrl: String(fd.get("productUrl") ?? ""),
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
    };
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      setStatus("error");
      setMessage(contact.errorValidation);
      focusFirstError(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          website: String(fd.get("website") ?? ""),
          startedAt: startedAt.current,
          captchaToken: String(fd.get("smart-token") ?? "") || undefined,
          utm: readUtm(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Errors };
      if (res.ok && body.ok) {
        setStatus("success");
        setMessage(contact.success);
        reachGoal("lead_submit");
        formRef.current?.reset();
        setTopic(TOPICS[0]);
        return;
      }
      reachGoal("lead_error");
      setStatus("error");
      if (res.status === 400 && body.errors) {
        setErrors(body.errors);
        setMessage(contact.errorValidation);
        focusFirstError(body.errors);
      } else if (res.status === 429) {
        setMessage(contact.errorRate);
      } else {
        setMessage(`${contact.errorGeneric}${contactEmail ? `: ${contactEmail}` : "."}`);
      }
    } catch {
      reachGoal("lead_error");
      setStatus("error");
      setMessage(`${contact.errorGeneric}${contactEmail ? `: ${contactEmail}` : "."}`);
    }
  }

  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1.5 text-[0.82rem] text-risk">
        {errors[name]}
      </p>
    ) : null;
  const aria = (name: string) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" aria-describedby="form-status">
      <div>
        <label htmlFor="name" className="text-[0.85rem] font-medium">Имя *</label>
        <input id="name" name="name" autoComplete="name" required className={inputCls} {...aria("name")} />
        {err("name")}
      </div>
      <div>
        <label htmlFor="company" className="text-[0.85rem] font-medium">Компания *</label>
        <input id="company" name="company" autoComplete="organization" required className={inputCls} {...aria("company")} />
        {err("company")}
      </div>
      <div>
        <label htmlFor="position" className="text-[0.85rem] font-medium">Должность</label>
        <input id="position" name="position" autoComplete="organization-title" className={inputCls} {...aria("position")} />
        {err("position")}
      </div>
      <div>
        <label htmlFor="email" className="text-[0.85rem] font-medium">Email *</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className={inputCls} {...aria("email")} />
        {err("email")}
      </div>
      <div>
        <label htmlFor="contact" className="text-[0.85rem] font-medium">Телефон или Telegram</label>
        <input id="contact" name="contact" autoComplete="tel" className={inputCls} {...aria("contact")} />
        {err("contact")}
      </div>
      <div>
        <label htmlFor="topic" className="text-[0.85rem] font-medium">Что нужно *</label>
        <select id="topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className={inputCls} {...aria("topic")}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {err("topic")}
      </div>
      <div>
        <label htmlFor="category" className="text-[0.85rem] font-medium">Категория продукта</label>
        <select id="category" name="category" defaultValue="" className={inputCls} {...aria("category")}>
          <option value="">Не выбрано</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {err("category")}
      </div>
      <div>
        <label htmlFor="productUrl" className="text-[0.85rem] font-medium">Ссылка на продукт</label>
        <input id="productUrl" name="productUrl" type="url" inputMode="url" placeholder="https://" className={inputCls} {...aria("productUrl")} />
        {err("productUrl")}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="text-[0.85rem] font-medium">Комментарий</label>
        <textarea id="message" name="message" rows={4} maxLength={2000} className={`${inputCls} resize-y`} {...aria("message")} />
        {err("message")}
      </div>

      {/* honeypot: скрыт от людей и скринридеров */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Сайт</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {captchaKey && (
        <div className="sm:col-span-2">
          <Script src="https://smartcaptcha.yandexcloud.net/captcha.js" strategy="lazyOnload" />
          <div className="smart-captcha" data-sitekey={captchaKey} />
        </div>
      )}

      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#0b0b0b]" {...aria("consent")} />
          <label htmlFor="consent" className="text-[0.85rem] leading-relaxed text-ink/80">
            Я даю согласие на обработку персональных данных на условиях{" "}
            <a href="/consent" target="_blank" rel="noopener" className="underline decoration-gold underline-offset-4">Согласия</a>{" "}
            и ознакомлен(а) с{" "}
            <a href="/privacy" target="_blank" rel="noopener" className="underline decoration-gold underline-offset-4">Политикой обработки персональных данных</a> *
          </label>
        </div>
        {err("consent")}
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-12 bg-ink px-8 text-[0.8rem] tracking-[0.14em] text-ivory uppercase transition-colors hover:bg-gold hover:text-ink disabled:opacity-60"
        >
          {status === "sending" ? contact.sending : contact.submit}
        </button>
        <p
          id="form-status"
          role="status"
          aria-live="polite"
          className={`text-[0.92rem] ${status === "success" ? "text-ink" : status === "error" ? "text-risk" : ""}`}
        >
          {message}
        </p>
      </div>
    </form>
  );
}
