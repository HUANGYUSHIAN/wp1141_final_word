import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 完全跳过 OAuth callback 路由（NextAuth 需要直接处理，不能有任何拦截）
  // 这是最优先的检查，确保 callback 路由完全不被 middleware 处理
  if (pathname.startsWith("/api/auth/callback/")) {
    return NextResponse.next();
  }

  // Allow access to API routes (不需要认证检查)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 如果访问登录页面或編輯頁面，允许访问
  if (pathname === "/login" || pathname === "/edit") {
    return NextResponse.next();
  }

  // 使用 NextAuth 的 getToken 获取 token
  // 明确指定 cookie 名称（生产环境使用 __Secure-*）
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });

  console.log("[Middleware] pathname:", pathname, "hasToken:", !!token, "token.userId:", token?.userId);

  // 其他页面需要登录
  // 检查 token 是否存在且有 userId
  if (token && token.userId) {
    console.log("[Middleware] User authenticated, allowing access");
    return NextResponse.next();
  }

  // 特殊处理：如果是从 OAuth callback 重定向来的请求，允许通过
  // 检查 referer 是否包含 callback（OAuth 回调后，cookie 可能还没完全设置好）
  const referer = request.headers.get("referer");
  if (referer && referer.includes("/api/auth/callback/")) {
    console.log("[Middleware] Request from OAuth callback, allowing access (cookie may not be set yet)");
    return NextResponse.next();
  }

  // 如果没有 token 或没有 userId，重定向到登录页
  console.log("[Middleware] User not authenticated, redirecting to /login");
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes - must be excluded)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

