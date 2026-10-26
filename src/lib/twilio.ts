export interface SendWhatsAppOptions {
  to?: string;
  body: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  status: "SENT" | "SIMULATED_SENT" | "FAILED";
  sid?: string;
  error?: string;
}

/**
 * Send WhatsApp notification via Twilio API or simulate if test mode / unconfigured
 */
export async function sendWhatsAppAlert(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const toNumber = options.to || process.env.FARMER_WHATSAPP_TO || "whatsapp:+8801700000000";

  // Check if Twilio credentials are placeholder / test
  const isSimulated =
    !accountSid ||
    !authToken ||
    accountSid.includes("your-") ||
    accountSid.trim().length === 0;

  if (isSimulated) {
    console.log("[Twilio WhatsApp (Simulated)] Message dispatched to", toNumber, ":", options.body.slice(0, 80));
    return {
      success: true,
      status: "SIMULATED_SENT",
      sid: `SM_simulated_${Date.now()}`,
    };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("From", fromNumber);
    formData.append("To", toNumber);
    formData.append("Body", options.body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
      console.warn("[Twilio WhatsApp] API returned non-OK status:", res.status, errText);
      return {
        success: false,
        status: "FAILED",
        error: `HTTP ${res.status}: ${errText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      status: "SENT",
      sid: data.sid,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[Twilio WhatsApp] Dispatch failed:", message);
    return {
      success: false,
      status: "FAILED",
      error: message,
    };
  }
}
