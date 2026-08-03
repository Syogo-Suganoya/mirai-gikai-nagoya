"use client";

import Switch from "./components/switch";
import { useFurigana } from "./furigana-context";

export default function FuriganaToggle() {
  const { show, toggle } = useFurigana();
  return <Switch checked={show} onChange={toggle} label="ふりがな" />;
}
