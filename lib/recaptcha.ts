import "server-only";

const DEFAULT_MIN_SCORE = 0.7;
const RECAPTCHA_VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";

type VerifyRecaptchaInput = {
  token: string;
  expectedAction: string;
  remoteIp?: string;
};

export type VerifyRecaptchaResult = {
  ok: boolean;
  status: number;
  error?: string;
  score?: number;
  skipped?: boolean;
};

type RecaptchaSiteVerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
};

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, "");
}

function getAllowedHostnames(): Set<string> {
  const raw = process.env.RECAPTCHA_ALLOWED_HOSTNAMES?.trim() ?? "";
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map(normalizeHost)
      .filter(Boolean)
  );
}

function getMinScore(): number {
  const raw = Number(process.env.RECAPTCHA_MIN_SCORE);
  if (!Number.isFinite(raw)) {
    return DEFAULT_MIN_SCORE;
  }
  return Math.min(1, Math.max(0, raw));
}

export async function verifyRecaptchaToken(input: VerifyRecaptchaInput): Promise<VerifyRecaptchaResult> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim() ?? "";
  const isConfigured = Boolean(siteKey && secretKey);

  if (!isConfigured) {
    if (process.env.NODE_ENV !== "production") {
      return {
        ok: true,
        status: 200,
        score: 1,
        skipped: true,
      };
    }

    console.error("[reCAPTCHA] Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY or RECAPTCHA_SECRET_KEY in production.");
    return {
      ok: false,
      status: 503,
      error: "Verification is temporarily unavailable. Please try again.",
    };
  }

  const token = input.token.trim();
  if (!token) {
    return {
      ok: false,
      status: 400,
      error: "Please complete verification and try again.",
    };
  }

  const form = new URLSearchParams();
  form.set("secret", secretKey);
  form.set("response", token);
  if (input.remoteIp) {
    form.set("remoteip", input.remoteIp);
  }

  let response: Response;
  let data: RecaptchaSiteVerifyResponse;

  try {
    response = await fetch(RECAPTCHA_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });
    data = (await response.json().catch(() => ({}))) as RecaptchaSiteVerifyResponse;
  } catch (error) {
    console.error("[reCAPTCHA] Verification request failed:", error);
    return {
      ok: false,
      status: 502,
      error: "Verification failed. Please retry.",
    };
  }

  if (!response.ok) {
    console.error("[reCAPTCHA] Verification API error:", response.status, data["error-codes"]);
    return {
      ok: false,
      status: 502,
      error: "Verification failed. Please retry.",
    };
  }

  if (!data.success) {
    return {
      ok: false,
      status: 403,
      error: "Verification failed. Please retry.",
    };
  }

  if (data.action !== input.expectedAction) {
    return {
      ok: false,
      status: 403,
      error: "Verification failed. Please retry.",
    };
  }

  const allowedHostnames = getAllowedHostnames();
  const tokenHostname = data.hostname ? normalizeHost(data.hostname) : "";
  if (allowedHostnames.size > 0 && (!tokenHostname || !allowedHostnames.has(tokenHostname))) {
    return {
      ok: false,
      status: 403,
      error: "Verification failed. Please retry.",
    };
  }

  const score = typeof data.score === "number" ? data.score : 0;
  if (score < getMinScore()) {
    return {
      ok: false,
      status: 403,
      error: "Verification failed. Please retry.",
      score,
    };
  }

  return {
    ok: true,
    status: 200,
    score,
  };
}
