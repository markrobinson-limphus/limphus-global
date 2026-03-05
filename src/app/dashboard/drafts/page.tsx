import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DraftsTable } from "@/components/DraftsTable";
import { DraftsErrorBoundary } from "@/components/DraftsErrorBoundary";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Drafts — CEO Review</h1>
        <p className="text-zinc-400 mt-1">See calculated fine and DMARC; Approve & Send or Edit in Gmail.</p>
      </div>
      <DraftsErrorBoundary>
        <DraftsTable />
      </DraftsErrorBoundary>
    </div>
  );
}
