const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";

export const isRecaptchaConfigured = Boolean(RECAPTCHA_SITE_KEY);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForRecaptchaApi(timeoutMs = 10_000): Promise<NonNullable<Window["grecaptcha"]>> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const recaptcha = window.grecaptcha;
    if (recaptcha) {
      return recaptcha;
    }
    await sleep(100);
  }

  throw new Error("reCAPTCHA script did not load in time.");
}

export async function getRecaptchaToken(action: string): Promise<string> {
  if (!isRecaptchaConfigured) {
    throw new Error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured.");
  }

  const recaptcha = await waitForRecaptchaApi();

  await new Promise<void>((resolve) => {
    recaptcha.ready(() => resolve());
  });

  const token = await recaptcha.execute(RECAPTCHA_SITE_KEY, { action });
  if (!token) {
    throw new Error("reCAPTCHA returned an empty token.");
  }

  return token;
}
