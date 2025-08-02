import { clerk } from "@clerk/testing/playwright";
import { type Page } from "@playwright/test";
import { db } from "@test/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { assertDefined } from "@/utils/assert";

const clerkTestUsers = [
  { id: "user_2zuMrlelXX1TQAWzbvUneOC4E0p", email: "hi1+clerk_test@example.com" },
  { id: "user_2zuMxk2OStweY48GDfSBoQRWzRd", email: "hi2+clerk_test@example.com" },
  { id: "user_2zuN0qPZE3v8sufPmwNbuaS8ljM", email: "hi3+clerk_test@example.com" },
  { id: "user_2zuN4JKnNO1PEliefgL9WnRfhaa", email: "hi4+clerk_test@example.com" },
];
let clerkTestUser: (typeof clerkTestUsers)[number] | undefined;

export const clearClerkUser = async () => {
  if (clerkTestUser) await db.update(users).set({ clerkId: null }).where(eq(users.clerkId, clerkTestUser.id));
  clerkTestUser = undefined;
};

export const setClerkUser = async (id: bigint) => {
  await clearClerkUser();
  for (const user of clerkTestUsers) {
    try {
      await db.update(users).set({ clerkId: user.id }).where(eq(users.id, id));
      clerkTestUser = user;
      break;
    } catch {}
  }
  return assertDefined(clerkTestUser);
};

export const login = async (page: Page, user: typeof users.$inferSelect) => {
  await page.goto("/login");

  const clerkUser = await setClerkUser(user.id);
  await clerk.signIn({ page, signInParams: { strategy: "email_code", identifier: clerkUser.email } });
  await page.waitForURL(/^(?!.*\/login$).*/u);
};
