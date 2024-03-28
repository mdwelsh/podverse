-- This migration adds RLS policies for the Subscriptions table.

CREATE POLICY "Allow insert by any authed user" ON "public"."Subscriptions" WITH CHECK (("public"."requesting_user_id"() <> '' :: "text"));

CREATE POLICY "Allow access by owner" ON "public"."Subscriptions" USING (("public"."requesting_user_id"() = "user"));