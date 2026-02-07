import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Allow auth routes and login page
  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/register" || pathname === '/api/bookings/auto-send-location') {
    return;
  }

  // Redirect to login if not authenticated (for page routes)
  if (!session && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", req.url);
    return Response.redirect(loginUrl);
  }

  // Protect all /api/** routes - require authentication
  if (pathname.startsWith("/api/")) {
    if (!session) {
      return Response.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }
  }

  // Protect /config/ - require MANAGER role
  if (pathname.startsWith("/config/")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      return Response.redirect(loginUrl);
    }

    const roles = (session.user as any)?.roles || [];

    if (!roles.includes("MANAGER")) {
      // Redirect to main page with error parameter
      const homeUrl = new URL("/", req.url);
      homeUrl.searchParams.set("error", "InsufficientPermissions");
      return Response.redirect(homeUrl);
    }
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
