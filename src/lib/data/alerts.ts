import "server-only";
import { prisma } from "@/lib/prisma";
import type { AlertSeverity } from "@prisma/client";

export interface GetAlertsOptions {
  unreadOnly?: boolean;
  fieldId?: string;
  limit?: number;
}

export interface CreateAlertInput {
  fieldId: string;
  decisionId?: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  messageBn?: string | null;
  source: string;
  whatsappStatus?: string | null;
}

/**
 * Retrieve alerts filtered by unreadOnly or fieldId
 */
export async function getAlerts(options?: GetAlertsOptions) {
  const { unreadOnly = false, fieldId, limit = 50 } = options || {};

  return prisma.alert.findMany({
    where: {
      ...(unreadOnly ? { read: false } : {}),
      ...(fieldId ? { fieldId } : {}),
    },
    include: {
      field: {
        select: { id: true, name: true, crop: true },
      },
      decision: {
        select: { id: true, action: true, status: true, reasoning: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Mark an alert as read or unread
 */
export async function markAlertRead(id: string, read = true) {
  return prisma.alert.update({
    where: { id },
    data: { read },
    include: {
      field: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Create a new farm alert
 */
export async function createAlert(input: CreateAlertInput) {
  return prisma.alert.create({
    data: {
      fieldId: input.fieldId,
      decisionId: input.decisionId ?? null,
      severity: input.severity,
      title: input.title,
      message: input.message,
      messageBn: input.messageBn ?? null,
      source: input.source,
      read: false,
      whatsappStatus: input.whatsappStatus ?? "PENDING",
    },
    include: {
      field: {
        select: { id: true, name: true },
      },
    },
  });
}
