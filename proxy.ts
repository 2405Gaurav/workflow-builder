import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes that require the user to be signed in
const isProtectedRoute = createRouteMatcher(['/workflow(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // If the user tries to access a protected route without being logged in, redirect them
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher:[
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};