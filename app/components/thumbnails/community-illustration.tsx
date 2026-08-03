// 男女共同参画・地域施設カテゴリの自作SVGイラスト。
export default function CommunityIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="地域施設のイメージイラスト"
    >
      <rect width="400" height="160" fill="#d1fae5" />
      <circle cx="350" cy="30" r="40" fill="#a7f3d0" opacity="0.7" />
      <circle cx="30" cy="130" r="46" fill="#a7f3d0" opacity="0.6" />

      {/* 建物 */}
      <rect x="150" y="70" width="100" height="60" fill="#10b981" />
      <polygon points="140,70 200,35 260,70" fill="#047857" />
      <rect x="190" y="95" width="20" height="35" fill="#d1fae5" />
      <rect x="160" y="85" width="16" height="16" fill="#d1fae5" />
      <rect x="224" y="85" width="16" height="16" fill="#d1fae5" />

      {/* 人のアイコン(手をつなぐイメージ) */}
      <circle cx="90" cy="90" r="12" fill="#065f46" />
      <path d="M90 104c-14 0-22 10-22 26h44c0-16-8-26-22-26z" fill="#059669" />
      <circle cx="300" cy="90" r="12" fill="#065f46" />
      <path d="M300 104c-14 0-22 10-22 26h44c0-16-8-26-22-26z" fill="#059669" />
    </svg>
  );
}
