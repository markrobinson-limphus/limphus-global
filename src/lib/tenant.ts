import { prisma } from "@/lib/db";

export async function ensureTenantForUser(clerkUserId: string): Promise<string> {
  const existing = await prisma.tenantUser.findFirst({
    where: { clerkUserId },
    select: { tenantId: true },
  });
  if (existing) return existing.tenantId;

  const tenant = await prisma.tenant.create({
    data: {
      name: "My Workspace",
      clerkOrgId: null,
    },
  });
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      clerkUserId,
      role: "owner",
    },
  });
  return tenant.id;
}
