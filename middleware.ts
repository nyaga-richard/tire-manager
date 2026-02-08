import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware disabled - authentication is handled client-side by AuthProvider
export function middleware() {
  return;
}

export const config = {
  matcher: [],
};
