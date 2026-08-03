// 組織改革・法人定款カテゴリの自作SVGイラスト。
export default function OrganizationIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      role="img"
      aria-label="組織・制度のイメージイラスト"
    >
      <rect width="400" height="160" fill="#ede9fe" />
      <circle cx="40" cy="130" r="42" fill="#ddd6fe" opacity="0.7" />
      <circle cx="360" cy="25" r="36" fill="#ddd6fe" opacity="0.6" />

      {/* 定款(書類)のアイコン */}
      <rect x="150" y="45" width="80" height="100" rx="6" fill="#ffffff" stroke="#7c3aed" strokeWidth="3" />
      <rect x="165" y="65" width="50" height="8" rx="2" fill="#a78bfa" />
      <rect x="165" y="82" width="50" height="8" rx="2" fill="#a78bfa" />
      <rect x="165" y="99" width="34" height="8" rx="2" fill="#a78bfa" />
      <circle cx="190" cy="122" r="10" fill="#7c3aed" opacity="0.8" />

      {/* 組織図の丸 */}
      <circle cx="270" cy="60" r="14" fill="#7c3aed" />
      <circle cx="300" cy="100" r="14" fill="#8b5cf6" />
      <circle cx="255" cy="105" r="14" fill="#8b5cf6" />
      <line x1="270" y1="60" x2="300" y2="100" stroke="#7c3aed" strokeWidth="3" />
      <line x1="270" y1="60" x2="255" y2="105" stroke="#7c3aed" strokeWidth="3" />
    </svg>
  );
}
