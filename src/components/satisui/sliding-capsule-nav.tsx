'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface NavTabLink {
  title: string;
  url: string;
  icon?: React.ReactNode;
}

export interface NavTabDropdown {
  title: string;
  items: { title: string; url: string }[];
}

export type NavTab = NavTabLink | NavTabDropdown;

function isDropdownTab(tab: NavTab): tab is NavTabDropdown {
  return 'items' in tab && Array.isArray((tab as NavTabDropdown).items);
}

function getTabId(tab: NavTab): string {
  if (isDropdownTab(tab)) return `dropdown:${tab.title}`;
  return tab.url;
}

function isTabActive(tab: NavTab, pathname: string | null): boolean {
  if (!pathname) return false;
  if (isDropdownTab(tab)) {
    return tab.items.some((item) => pathname === item.url || pathname.startsWith(item.url + '/'));
  }
  return pathname === tab.url || (tab.url !== '/' && pathname.startsWith(tab.url));
}

/** Best matching tab for pathname: longest url match for links, or dropdown if any item matches. */
function getActiveTabId(tabs: NavTab[], pathname: string | null): string | null {
  if (!pathname) return null;
  let best: { id: string; score: number } | null = null;
  for (const tab of tabs) {
    if (isDropdownTab(tab)) {
      const matched = tab.items.find(
        (item) => pathname === item.url || pathname.startsWith(item.url + '/')
      );
      if (matched) {
        const score = matched.url.length;
        if (!best || score > best.score) best = { id: getTabId(tab), score };
      }
    } else {
      if (pathname === tab.url || (tab.url !== '/' && pathname.startsWith(tab.url))) {
        const score = tab.url.length;
        if (!best || score > best.score) best = { id: tab.url, score };
      }
    }
  }
  return best?.id ?? null;
}

interface SlidingCapsuleNavProps {
  tabs: NavTab[];
  className?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  layoutId?: string;
  currentTab?: string;
  onChange?: (url: string) => void;
}

export const SlidingCapsuleNav = ({
  tabs,
  className,
  activeTabClassName,
  tabClassName,
  layoutId = 'capsule-nav',
  currentTab,
  onChange,
}: SlidingCapsuleNavProps) => {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);
  const [clickedTab, setClickedTab] = React.useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const activeTabId = React.useMemo(() => {
    if (currentTab) return currentTab;
    return getActiveTabId(tabs, pathname);
  }, [pathname, tabs, currentTab]);

  React.useEffect(() => {
    setClickedTab(null);
  }, [activeTabId]);

  React.useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    setClickedTab(url);
    if (onChange) {
      e.preventDefault();
      onChange(url);
    }
  };

  const sharedTabClasses = cn(
    'relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200',
    'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    tabClassName
  );

  return (
    <nav
      className={cn(
        'relative flex items-center gap-1 rounded-full border bg-background p-1 shadow-sm',
        className
      )}
      onMouseLeave={() => setHoveredTab(null)}
    >
      {tabs.map((tab) => {
        const tabId = getTabId(tab);
        const isActive = activeTabId === tabId;
        const isHovered = hoveredTab === tabId;
        const isClicked = clickedTab === tabId;
        const shouldShowGhost =
          isHovered ||
          (!hoveredTab && isClicked) ||
          (!hoveredTab && !clickedTab && isActive);

        const contentColor = isActive
          ? 'text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground';

        if (isDropdownTab(tab)) {
          return (
            <DropdownMenu key={tabId} open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(sharedTabClasses, contentColor)}
                  onMouseEnter={() => setHoveredTab(tabId)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId={`${layoutId}-active`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      className={cn(
                        'absolute inset-0 z-10 rounded-full bg-primary shadow-md',
                        activeTabClassName
                      )}
                    />
                  )}
                  {shouldShowGhost && (
                    <motion.div
                      layoutId={`${layoutId}-ghost`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 z-0 rounded-full bg-muted/80"
                    />
                  )}
                  <span className="relative z-20 flex items-center gap-2">
                    {tab.title}
                    <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {tab.items.map((item) => (
                  <DropdownMenuItem key={item.url} asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        pathname === item.url || pathname?.startsWith(item.url + '/')
                          ? 'bg-accent font-medium'
                          : ''
                      )}
                      aria-current={
                        pathname === item.url || pathname?.startsWith(item.url + '/')
                          ? 'page'
                          : undefined
                      }
                    >
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Link
            key={tab.url}
            href={tab.url}
            onClick={(e) => handleLinkClick(e, tab.url)}
            onMouseEnter={() => setHoveredTab(tab.url)}
            className={cn(sharedTabClasses, contentColor)}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutId}-active`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                className={cn(
                  'absolute inset-0 z-10 rounded-full bg-primary shadow-md',
                  activeTabClassName
                )}
              />
            )}
            {shouldShowGhost && (
              <motion.div
                layoutId={`${layoutId}-ghost`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                className="absolute inset-0 z-0 rounded-full bg-muted/80"
              />
            )}
            <span className="relative z-20 flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:block">{tab.title}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
