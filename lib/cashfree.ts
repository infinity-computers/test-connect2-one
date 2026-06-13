import crypto from "crypto";

const CASHFREE_API_VERSION = "2025-01-01";

type CashfreeMode = "sandbox" | "production";

type CreateCashfreeOrderInput = {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl?: string;
  note?: string;
};

type CashfreeOrderResponse = {
  order_id?: string;
  payment_session_id?: string;
  order_status?: string;
  cf_order_id?: string;
};

function getCashfreeMode(): CashfreeMode {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function getCashfreeBaseUrl(): string {
  return getCashfreeMode() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export function getCashfreeCheckoutMode(): CashfreeMode {
  return getCashfreeMode();
}

export function getRequiredCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error("Cashfree configuration is missing");
  }

  return { appId, secretKey };
}

export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  const { secretKey } = getRequiredCashfreeConfig();
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(timestamp + rawBody)
    .digest("base64");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function createCashfreeOrder(input: CreateCashfreeOrderInput): Promise<CashfreeOrderResponse> {
  const { appId, secretKey } = getRequiredCashfreeConfig();

  const res = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerPhone.replace(/\D/g, "") || input.orderId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: input.returnUrl,
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
      },
      order_note: input.note,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Failed to create Cashfree order");
  }

  return data as CashfreeOrderResponse;
}
