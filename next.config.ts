import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // ふりがな生成(kuromoji)は辞書ファイルを fs で読むため、バンドルせずに node_modules から読み込む
  serverExternalPackages: ["kuromoji"],
  // サムネイル画像のアップロード用(画像は管理画面で縮小してから送り、サーバー側でも 1.5MB までに制限する)
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  // 管理画面の保存処理でふりがなを作るので、その関数にだけ辞書(約17MB)を含める
  outputFileTracingIncludes: {
    "/admin/**": ["./node_modules/kuromoji/dict/**"],
  },
};

export default nextConfig;
