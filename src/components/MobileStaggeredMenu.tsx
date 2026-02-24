"use client";

import { useCallback, useEffect } from "react";
import { StaggeredMenu } from "@/components/StaggeredMenu";

export type MobileStaggeredMenuItem = { title: string; url: string };

type MobileStaggeredMenuProps = {
  items: MobileStaggeredMenuItem[];
};

export function MobileStaggeredMenu({ items }: MobileStaggeredMenuProps) {
  const staggeredItems = items.map(({ title, url }) => ({
    label: title,
    link: url,
    ariaLabel: title,
  }));

  const onOpen = useCallback(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }, []);

  const onClose = useCallback(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  return (
    <StaggeredMenu
      position="right"
      items={staggeredItems}
      displaySocials={false}
      displayItemNumbering={true}
      className="app-nav-mobile-menu"
      menuButtonColor="var(--foreground)"
      openMenuButtonColor="var(--foreground)"
      accentColor="var(--primary)"
      changeMenuColorOnOpen={false}
      isFixed={false}
      closeOnClickAway={true}
      onMenuOpen={onOpen}
      onMenuClose={onClose}
    />
  );
}
