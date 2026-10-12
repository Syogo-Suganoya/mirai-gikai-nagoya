import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // ふりがな生成(kuromoji)は辞書ファイルを fs で読むため、バンドルせずに node_modules から読み込む
  serverExternalPackages: ["kuromoji"],
  // 管理画面の保存処理でふりがなを作るので、その関数にだけ辞書(約17MB)を含める
  outputFileTracingIncludes: {
    "/admin/**": ["./node_modules/kuromoji/dict/**"],
  },
};

export default nextConfig;
