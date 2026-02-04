import type { ResourceCategory } from "@/types/resource";

export const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "design-tools", label: "Design Tools" },
  { value: "development-tools", label: "Development Tools" },
  { value: "ui-ux-resources", label: "UI/UX Resources" },
  { value: "inspiration", label: "Inspiration" },
  { value: "ai-tools", label: "AI Tools" },
  { value: "productivity", label: "Productivity" },
  { value: "learning-resources", label: "Learning Resources" },
  { value: "webflow", label: "Webflow" },
  { value: "shadcn", label: "Shadcn" },
  { value: "coding", label: "Coding" },
  { value: "github", label: "GitHub" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "languages", label: "Languages" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export function getCategoryLabel(value: ResourceCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
