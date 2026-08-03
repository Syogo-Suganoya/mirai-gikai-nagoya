// サムネイル比較用の自作SVGイラスト(予算・お金カテゴリ)。
export default function BudgetIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="予算のイメージイラスト"
    >
      <rect width="400" height="160" fill="#fef3c7" />
      <circle cx="340" cy="30" r="40" fill="#fde68a" opacity="0.6" />
      <circle cx="40" cy="140" r="50" fill="#fde68a" opacity="0.5" />

      {/* 棒グラフ */}
      <rect x="240" y="90" width="24" height="50" rx="3" fill="#f59e0b" />
      <rect x="272" y="70" width="24" height="70" rx="3" fill="#d97706" />
      <rect x="304" y="50" width="24" height="90" rx="3" fill="#f59e0b" />

      {/* コインの重なり */}
      <ellipse cx="110" cy="115" rx="46" ry="14" fill="#d97706" />
      <ellipse cx="110" cy="105" rx="46" ry="14" fill="#f59e0b" />
      <ellipse cx="110" cy="95" rx="46" ry="14" fill="#fbbf24" />
      <text
        x="110"
        y="101"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="#92400e"
      >
        ¥
      </text>
    </svg>
  );
}
