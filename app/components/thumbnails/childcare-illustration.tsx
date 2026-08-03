// 子育て・保育関連カテゴリの自作SVGイラスト。
export default function ChildcareIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="子育てのイメージイラスト"
    >
      <rect width="400" height="160" fill="#ffe4e6" />
      <circle cx="350" cy="120" r="46" fill="#fecdd3" opacity="0.7" />
      <circle cx="30" cy="20" r="36" fill="#fecdd3" opacity="0.6" />

      {/* つみき */}
      <rect x="240" y="95" width="34" height="34" rx="5" fill="#fb7185" />
      <rect x="278" y="105" width="34" height="24" rx="5" fill="#e11d48" />
      <rect x="240" y="63" width="34" height="30" rx="5" fill="#fda4af" />

      {/* ほ乳びん */}
      <rect x="95" y="60" width="26" height="42" rx="8" fill="#ffffff" stroke="#e11d48" strokeWidth="3" />
      <rect x="101" y="46" width="14" height="16" rx="3" fill="#fda4af" />
      <rect x="98" y="40" width="20" height="8" rx="3" fill="#e11d48" />
      <rect x="99" y="78" width="20" height="18" rx="2" fill="#fecdd3" />

      {/* ハート */}
      <path
        d="M170 95c-10-12-28-6-28 8 0 14 20 24 28 30 8-6 28-16 28-30 0-14-18-20-28-8z"
        fill="#fb7185"
        opacity="0.9"
      />
    </svg>
  );
}
