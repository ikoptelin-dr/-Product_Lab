import { isPlaceholder } from "@/config/site.config";

/** Показывает значение; плейсхолдер [[ЗАПОЛНИТЬ…]] подсвечивается пунктиром (видно только при незаполненном контенте). */
export function Ph({ value, className = "" }: { value: string; className?: string }) {
  if (!isPlaceholder(value)) return <span className={className}>{value}</span>;
  return <span className={`dev-placeholder ${className}`}>{value}</span>;
}

/** Ссылка, которая превращается в текст, если адрес не заполнен. */
export function SafeLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  if (isPlaceholder(href)) return <span className={`dev-placeholder ${className}`} title={href}>{children}</span>;
  const external = /^https?:/.test(href);
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}
