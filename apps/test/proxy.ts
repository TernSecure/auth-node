import {
  ternSecureProxy,
  createRouteMatcher,
} from "@tern-secure-node/nextjs/server";

const publicPaths = createRouteMatcher([
  "/sign-in",
  "/sign-up",
  "/unauthorized",
  "/api/auth/(.*)",
]);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

export default ternSecureProxy(async (auth, request) => {
  if (!publicPaths(request)) {
    await auth.protect();
  }
});
