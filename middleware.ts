import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Root → login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Login page
  if (pathname.startsWith("/login")) {
    if (token) {
      // Already logged in → redirect away
      return NextResponse.redirect(new URL("/inventory", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/inventory/:path*",
    "/suppliers/:path*",
    "/purchases/:path*",
  ],
};
