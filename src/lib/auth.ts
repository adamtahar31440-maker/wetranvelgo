import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";

// currentUser() throws instead of returning null when the session's Clerk
// user was deleted (e.g. an admin removed the account, or a browser still
// holds a stale session cookie) but the request still carries a session
// token. Treat that the same as "not signed in" instead of crashing the page.
export async function safeCurrentUser() {
  try {
    return await clerkCurrentUser();
  } catch {
    return null;
  }
}
