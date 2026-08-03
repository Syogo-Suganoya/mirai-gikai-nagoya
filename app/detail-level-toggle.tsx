"use client";

import Switch from "./components/switch";
import { useDetailLevel } from "./detail-level-context";

export default function DetailLevelToggle() {
  const { detailed, toggle } = useDetailLevel();
  return <Switch checked={detailed} onChange={toggle} label="もっと詳しく" />;
}
