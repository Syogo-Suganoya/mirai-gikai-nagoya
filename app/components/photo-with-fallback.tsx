"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 外部の写真が読み込めなかった場合(リンク切れ・ボット判定ページが返る等)に
// 代わりの内容(イラスト)を表示する。
// SSRされた<img>はハイドレーション前に読み込み失敗が確定していることがあり、
// その場合 onError が呼ばれないため、マウント時にも読み込み状態を確認する。
export default function PhotoWithFallback({
  src,
  fallback,
}: {
  src: string;
  fallback: ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}
