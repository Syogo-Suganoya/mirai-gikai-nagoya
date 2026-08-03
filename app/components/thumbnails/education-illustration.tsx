// 教育・生涯学習カテゴリの自作SVGイラスト。
export default function EducationIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="教育のイメージイラスト"
    >
      <rect width="400" height="160" fill="#dbeafe" />
      <circle cx="40" cy="30" r="40" fill="#bfdbfe" opacity="0.7" />
      <circle cx="360" cy="130" r="46" fill="#bfdbfe" opacity="0.6" />

      {/* 本の重なり */}
      <rect x="90" y="100" width="120" height="16" rx="3" fill="#1d4ed8" />
      <rect x="100" y="82" width="100" height="16" rx="3" fill="#3b82f6" />
      <rect x="110" y="64" width="80" height="16" rx="3" fill="#60a5fa" />

      {/* 電球(ひらめき) */}
      <circle cx="300" cy="75" r="30" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="3" />
      <rect x="288" y="100" width="24" height="10" rx="2" fill="#1d4ed8" />
      <path
        d="M292 70l8 10 8-10"
        stroke="#1e3a8a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
