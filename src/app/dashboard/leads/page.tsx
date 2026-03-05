import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BulkIntake } from "@/components/BulkIntake";
import { LeadsTable } from "@/components/LeadsTable";

export default async function LeadsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-zinc-400 mt-1">Bulk discover. Tagged by country and industry.</p>
      </div>
      <BulkIntake />
      <LeadsTable />
    </div>
  );
}
