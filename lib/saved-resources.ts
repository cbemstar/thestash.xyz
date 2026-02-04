const STORAGE_KEY = "thestash-saved";

export function getSavedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSaved(slug: string): boolean {
  return getSavedSlugs().includes(slug);
}

export function saveResource(slug: string): void {
  const slugs = getSavedSlugs();
  if (slugs.includes(slug)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs, slug]));
  window.dispatchEvent(new Event("thestash-saved-change"));
}

export function unsaveResource(slug: string): void {
  const slugs = getSavedSlugs().filter((s) => s !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event("thestash-saved-change"));
}

export function toggleSaved(slug: string): boolean {
  const slugs = getSavedSlugs();
  const included = slugs.includes(slug);
  if (included) {
    unsaveResource(slug);
    return false;
  }
  saveResource(slug);
  return true;
}
