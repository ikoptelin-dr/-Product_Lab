import Image from "next/image";

/**
 * Логотип основателя. Эмблема — растровый ассет из /public/brand/emblem.png (вырезан из исходника).
 * Для идеальной чёткости замените на векторный /public/brand/emblem.svg и поменяйте src.
 */
export function Emblem({ size = 40, className = "", priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/emblem.png"
      alt=""
      width={size}
      height={Math.round(size * (252 / 264))}
      priority={priority}
      className={className}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`display tracking-[0.12em] ${compact ? "text-[1.35rem]" : "text-[2rem]"}`}>PROBA</span>
      <span className="mt-1 flex items-center gap-2 text-[0.52rem] tracking-[0.38em] text-smoke">
        <span aria-hidden="true" className="h-px w-3 bg-gold" />
        PRODUCT LAB
        <span aria-hidden="true" className="h-px w-3 bg-gold" />
      </span>
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <Emblem size={38} priority />
      <Wordmark compact />
      <span className="sr-only">Proba Lab — на главную</span>
    </span>
  );
}
