import type { ResourceType } from "@/types/resource";

export const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "app", label: "App" },
  { value: "website", label: "Website" },
  { value: "utility", label: "Utility" },
  { value: "library", label: "Library" },
  { value: "directory", label: "Directory" },
  { value: "article", label: "Article" },
  { value: "tool", label: "Tool" },
  { value: "component", label: "Component" },
  { value: "snippet", label: "Snippet" },
  { value: "course", label: "Course" },
  { value: "framework", label: "Framework" },
  { value: "other", label: "Other" },
];

export function getResourceTypeLabel(value: ResourceType | string | null | undefined): string {
  if (!value) return "";
  return RESOURCE_TYPES.find((t) => t.value === value)?.label ?? value;
}
