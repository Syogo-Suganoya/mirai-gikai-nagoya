// 労働・働く人を守るカテゴリの自作SVGイラスト。
export default function LaborIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="働く人のイメージイラスト"
    >
      <rect width="400" height="160" fill="#ffedd5" />
      <circle cx="350" cy="30" r="40" fill="#fed7aa" opacity="0.7" />
      <circle cx="30" cy="130" r="46" fill="#fed7aa" opacity="0.6" />

      {/* 盾(守る) */}
      <path
        d="M200 30 L250 48 V88 C250 115 228 132 200 142 C172 132 150 115 150 88 V48 Z"
        fill="#f97316"
      />
      <path
        d="M182 88 L196 102 L222 72"
        stroke="#ffffff"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 働く人のアイコン */}
      <circle cx="95" cy="80" r="12" fill="#9a3412" />
      <path d="M95 94c-14 0-22 10-22 26h44c0-16-8-26-22-26z" fill="#c2410c" />
      <circle cx="305" cy="80" r="12" fill="#9a3412" />
      <path d="M305 94c-14 0-22 10-22 26h44c0-16-8-26-22-26z" fill="#c2410c" />
    </svg>
  );
}
