/**
 * Cookie preferences and Google consent mode (gtag) integration.
 * Maps UI categories to Google's consent types per
 * https://support.google.com/analytics/answer/13802165 and
 * https://developers.google.com/tag-platform/security/concepts/consent-mode
 */

export const COOKIE_PREFS_KEY = "thestash-cookie-prefs";
const LEGACY_CONSENT_KEY = "thestash-consent";
const GA_USER_ID_KEY = "thestash-ga-user-id";

export type CookiePrefs = {
  /** Always true; required for site to work. Maps to security_storage. */
  strictlyNecessary: true;
  /** Language, preferences. Maps to functionality_storage. */
  functionality: boolean;
  /** Analytics (e.g. GA4). Maps to analytics_storage; when granted, enables user-ID collection. */
  tracking: boolean;
  /** Personalized ads. Maps to ad_storage, ad_user_data, ad_personalization. */
  targeting: boolean;
};

export const DEFAULT_PREFS_ALL: CookiePrefs = {
  strictlyNecessary: true,
  functionality: true,
  tracking: true,
  targeting: true,
};

export const DEFAULT_PREFS_REJECT_ADS: CookiePrefs = {
  strictlyNecessary: true,
  functionality: true,
  tracking: true,
  targeting: false,
};

function generateGaUserId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "anon_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
}

function getOrCreateGaUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(GA_USER_ID_KEY);
    if (!id) {
      id = generateGaUserId();
      localStorage.setItem(GA_USER_ID_KEY, id);
    }
    return id;
  } catch {
    return generateGaUserId();
  }
}

/**
 * Map our cookie prefs to gtag consent state and optional GA4 user_id.
 * Call after user saves preferences or on load when we have stored prefs.
 */
export function applyConsentToGtag(prefs: CookiePrefs, gaMeasurementId?: string): void {
  if (typeof window === "undefined" || typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag !== "function") {
    return;
  }
  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
  const granted = "granted" as const;
  const denied = "denied" as const;

  gtag("consent", "update", {
    ad_storage: prefs.targeting ? granted : denied,
    ad_user_data: prefs.targeting ? granted : denied,
    ad_personalization: prefs.targeting ? granted : denied,
    analytics_storage: prefs.tracking ? granted : denied,
    functionality_storage: prefs.functionality ? granted : denied,
    security_storage: granted,
    personalization_storage: prefs.functionality ? granted : denied,
  });

  // When tracking is granted, set GA4 user_id so we can identify users across sessions
  // (user-ID collection in GA4). Uses a persistent anonymous ID when no login exists.
  if (gaMeasurementId && prefs.tracking) {
    const userId = getOrCreateGaUserId();
    if (userId) {
      gtag("config", gaMeasurementId, { user_id: userId });
    }
  }
}

/**
 * Read stored cookie preferences. Migrates legacy thestash-consent (accept/reject) if present.
 */
export function getStoredPrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as CookiePrefs).strictlyNecessary === true &&
        typeof (parsed as CookiePrefs).functionality === "boolean" &&
        typeof (parsed as CookiePrefs).tracking === "boolean" &&
        typeof (parsed as CookiePrefs).targeting === "boolean"
      ) {
        return parsed as CookiePrefs;
      }
    }
    // Migrate legacy key
    const legacy = localStorage.getItem(LEGACY_CONSENT_KEY);
    if (legacy === "accept" || legacy === "reject") {
      const migrated: CookiePrefs = legacy === "accept" ? DEFAULT_PREFS_ALL : DEFAULT_PREFS_REJECT_ADS;
      localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist cookie preferences and apply to gtag. Call after user saves in banner or settings page.
 */
export function saveCookiePrefs(prefs: CookiePrefs, gaMeasurementId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
    applyConsentToGtag(prefs, gaMeasurementId);
  } catch {
    applyConsentToGtag(prefs, gaMeasurementId);
  }
}

/**
 * Clear stored preferences (for "Show cookie banner again"). Does not update gtag.
 */
export function clearCookiePrefs(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COOKIE_PREFS_KEY);
  } catch {
    // ignore
  }
}
