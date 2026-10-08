// 産業振興・イノベーションカテゴリの自作SVGイラスト。
export default function IndustryIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="産業のイメージイラスト"
    >
      <rect width="400" height="160" fill="#cffafe" />
      <circle cx="40" cy="30" r="40" fill="#a5f3fc" opacity="0.7" />
      <circle cx="360" cy="130" r="46" fill="#a5f3fc" opacity="0.6" />

      {/* 歯車 */}
      <circle cx="140" cy="85" r="34" fill="#06b6d4" />
      <circle cx="140" cy="85" r="14" fill="#cffafe" />
      <rect x="133" y="40" width="14" height="14" rx="2" fill="#06b6d4" />
      <rect x="133" y="116" width="14" height="14" rx="2" fill="#06b6d4" />
      <rect x="95" y="78" width="14" height="14" rx="2" fill="#06b6d4" />
      <rect x="171" y="78" width="14" height="14" rx="2" fill="#06b6d4" />

      {/* 上向きの矢印(成長) */}
      <path
        d="M230 120 L270 80 L295 100 L330 60"
        stroke="#0e7490"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="318,52 340,50 336,72" fill="#0e7490" />
    </svg>
  );
}
