import { prisma } from "@/lib/db";

export type ActionType =
  | "FOUND_LEADS"
  | "AUDIT_BATCH"
  | "EMAIL_BATCH"
  | "EMAIL_SENT"
  | "RESEND_SENT"
  | "REPLY"
  | "OTHER";

export async function logAction(
  tenantId: string,
  actionType: ActionType | string,
  message: string,
  metadata?: Record<string, unknown>,
  leadId?: string | null
) {
  await prisma.actionLog.create({
    data: {
      tenantId,
      leadId: leadId ?? undefined,
      actionType,
      message,
      metadata: metadata ?? undefined,
    },
  });
}
