"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";

export function ThemeSwitcherNav({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const value = (theme ?? "system") as "light" | "dark" | "system";
  return (
    <ThemeSwitcher
      value={value}
      onChange={(v) => setTheme(v)}
      className={className}
    />
  );
}
