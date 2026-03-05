import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-400 mt-1">Branding, billing, and team (Phase 2).</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-400">
        Placeholder: firm name, logo URL, Stripe subscription, invite members.
      </div>
    </div>
  );
}
