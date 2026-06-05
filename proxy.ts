import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// protecetd routes - user needs to be signed in to acess these
// dashboard and workflow are both locked behind auth
const isProtectedRoute = createRouteMatcher(['/workflow(.*)', '/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // redirect to sign-in if user trys to hit a protectd route w/o being loged in
  // clerk handles the redirect automaticaly which is nice
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


// The alternative is using Clerk webhooks — Clerk fires a user.created event to your server the moment someone signs up,
//  and you store them in your DB immediately. This is the more robust approach,
//  especially if you need to store user-level data (preferences, plan type, etc.) before they do anything.