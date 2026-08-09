export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!login|api/auth|api/v1/integrations|_next/static|_next/image|favicon.ico).*)"],
};