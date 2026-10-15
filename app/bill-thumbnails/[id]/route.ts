import { getCurrentAdmin } from "@/lib/auth/admin";
import { findThumbnail } from "@/lib/bills/thumbnails";
import { isDbConfigured } from "@/lib/db";

// アップロードしたサムネイル画像を返す。下書きの議案の画像は、ログイン中の管理者にだけ返す。
// URL の ?v=(画像の更新時刻)が変わると別の URL になるので、公開中の画像は長くキャッシュしてよい
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const image = await findThumbnail(id);
  if (!image) return new Response("Not found", { status: 404 });

  const published = image.publishStatus === "published";
  if (!published) {
    const admin = await getCurrentAdmin();
    if (!admin || admin.mustChangePassword) return new Response("Not found", { status: 404 });
  }

  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": !published
        ? "private, no-store"
        : versioned
          ? "public, max-age=31536000, immutable"
          : "public, max-age=60",
    },
  });
}
