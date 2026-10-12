import { type NextRequest, NextResponse } from "next/server";

// /admin 配下の入口チェック。ログインの Cookie がなければログイン画面へ送る。
// Cookie が本物で有効かは、画面(app/admin/(authed)/layout.tsx)と各 Server Action の
// requireAdmin() で DB と照合して確かめる(ここでは DB に問い合わせない)。
const SESSION_COOKIE = "admin_session";

export function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!isLoginPage && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
