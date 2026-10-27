import { prisma } from "@/lib/prisma";

export interface SendWhatsAppOptions {
  to?: string;
  body: string;
  alertId?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  status: "sent" | "failed" | "skipped";
  sid?: string;
  error?: string;
  alertUpdated?: boolean;
}

/**
 * Standardizes phone numbers to Twilio's required 'whatsapp:+...' E.164 format
 */
export function formatWhatsAppNumber(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  // If starts with +, prefix whatsapp:
  if (trimmed.startsWith("+")) return `whatsapp:${trimmed}`;
  // If starts with 00, replace with +
  if (trimmed.startsWith("00")) return `whatsapp:+${trimmed.slice(2)}`;
  // Default Bangladesh country code if local 017... format
  if (trimmed.startsWith("01")) return `whatsapp:+88${trimmed}`;
  return `whatsapp:+${trimmed}`;
}

export interface WhatsAppAlertPayload {
  fieldName: string;
  problem: string;
  decision: string;
  newTimeIso?: string | null;
  dashboardUrl?: string;
}

/**
 * Generates concise, structured WhatsApp alert message for farmers:
 * Short, field name, problem, decision, new time, and dashboard link.
 */
export function formatFarmerWhatsAppMessage({
  fieldName,
  problem,
  decision,
  newTimeIso,
  dashboardUrl,
}: WhatsAppAlertPayload): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.APP_URL ? process.env.APP_URL.replace("host.docker.internal", "localhost") : "http://localhost:3000");

  const link = dashboardUrl || `${appUrl}/alerts`;

  let timeLine = "";
  if (newTimeIso) {
    try {
      const d = new Date(newTimeIso);
      const formatted = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      timeLine = `\n⏰ New Time: ${formatted}`;
    } catch {
      timeLine = `\n⏰ New Time: ${newTimeIso}`;
    }
  }

  return [
    `🌾 [Agri-Koushol]`,
    `📍 Field: ${fieldName}`,
    `⚠️ Problem: ${problem}`,
    `🤖 Decision: ${decision}${timeLine}`,
    `🔗 Dashboard: ${link}`,
  ].join("\n");
}

/**
 * Dispatches a WhatsApp notification via Twilio REST API using Basic Auth.
 * Never throws an unhandled error if Twilio is down or credentials are unconfigured.
 * Updates Alert.whatsappStatus (sent, failed, skipped) when alertId is provided.
 */
export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const rawTo = options.to || process.env.FARMER_WHATSAPP_TO || "whatsapp:+8801700000000";

  const fromNumber = formatWhatsAppNumber(rawFrom);
  const toNumber = formatWhatsAppNumber(rawTo);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Determine if Twilio credentials are valid or simulated/unconfigured
  const hasCredentials =
    Boolean(accountSid && authToken) &&
    !accountSid?.includes("your-") &&
    accountSid!.trim().length > 0 &&
    accountSid!.startsWith("AC");

  let result: SendWhatsAppResult;

  if (!hasCredentials) {
    console.log(
      `[Notify: WhatsApp Simulated] Twilio simulated dispatcher active. Destination: ${toNumber}. Text: "${options.body.replace(/\n/g, " ")}"`
    );
    result = {
      success: true,
      status: "sent",
      sid: `SM_simulated_${Date.now()}`,
    };
  } else {
    try {
      const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append("From", fromNumber);
      formData.append("To", toNumber);
      formData.append("Body", options.body);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Notify: WhatsApp Failed] Twilio API HTTP ${res.status}: ${errText}`);
        result = {
          success: false,
          status: "failed",
          error: `HTTP ${res.status}: ${errText}`,
        };
      } else {
        const data = await res.json();
        console.log(`[Notify: WhatsApp Sent] Message SID: ${data.sid} to ${toNumber}`);
        result = {
          success: true,
          status: "sent",
          sid: data.sid,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Notify: WhatsApp Down] Twilio request failed gracefully: ${message}`);
      result = {
        success: false,
        status: "failed",
        error: message,
      };
    }
  }

  // Update Alert.whatsappStatus in database if alertId is provided
  if (options.alertId) {
    try {
      await prisma.alert.update({
        where: { id: options.alertId },
        data: { whatsappStatus: result.status },
      });
      result.alertUpdated = true;
    } catch (dbErr) {
      console.warn(`[Notify] Could not update alert ${options.alertId} whatsappStatus:`, dbErr);
    }
  }

  return result;
}
