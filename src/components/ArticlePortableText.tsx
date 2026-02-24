"use client";

import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { TypedObject } from "@portabletext/types";
import { ArticleInfographic } from "./ArticleInfographic";
import { ArticleSourcedImage } from "./ArticleSourcedImage";
import { buildHeadingIdByBlockKey } from "@/lib/article-structure";

interface HeadingValue {
  _key?: string;
  children?: Array<{
    _type?: string;
    text?: string;
  }>;
}

function fallbackHeadingId(value: HeadingValue | undefined): string {
  const fromValue =
    Array.isArray(value?.children)
      ? value.children
          .filter((child) => child?._type === "span" && typeof child.text === "string")
          .map((child) => child.text ?? "")
          .join(" ")
      : "";
  const text =
    (fromValue || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  return text;
}

function createArticleComponents(
  headingIdByBlockKey: Record<string, string>
): PortableTextComponents {
  return {
    types: {
      infographic: ArticleInfographic,
      sourcedImage: ArticleSourcedImage,
    },
    marks: {
      link: ({ children, value }) => {
        const href = value?.href ?? "#";
        const isInternal = href.startsWith("/");
        if (isInternal) {
          return (
            <Link
              href={href}
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              {children}
            </Link>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            {children}
          </a>
        );
      },
    },
    block: {
      h1: ({ children }) => (
        <h1 className="font-display mt-10 mb-3 text-2xl font-bold text-foreground first:mt-0">
          {children}
        </h1>
      ),
      h2: ({ children, value }) => {
        const blockValue = value as HeadingValue | undefined;
        const id = blockValue?._key
          ? headingIdByBlockKey[blockValue._key]
          : undefined;
        return (
          <h2
            id={id || fallbackHeadingId(blockValue)}
            className="font-display mt-10 mb-3 scroll-mt-28 border-b border-border pb-2 text-xl font-semibold text-foreground"
          >
            {children}
          </h2>
        );
      },
      h3: ({ children, value }) => {
        const blockValue = value as HeadingValue | undefined;
        const id = blockValue?._key
          ? headingIdByBlockKey[blockValue._key]
          : undefined;
        return (
          <h3
            id={id || fallbackHeadingId(blockValue)}
            className="font-display mt-6 mb-2 scroll-mt-28 text-lg font-semibold text-foreground"
          >
            {children}
          </h3>
        );
      },
      h4: ({ children, value }) => {
        const blockValue = value as HeadingValue | undefined;
        const id = blockValue?._key
          ? headingIdByBlockKey[blockValue._key]
          : undefined;
        return (
          <h4
            id={id || fallbackHeadingId(blockValue)}
            className="font-display mt-4 mb-2 scroll-mt-28 text-base font-semibold text-foreground"
          >
            {children}
          </h4>
        );
      },
      normal: ({ children }) => (
        <p className="mb-4 leading-relaxed text-foreground">{children}</p>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-foreground">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-2 pl-6 text-foreground">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
      number: ({ children }) => <li className="leading-relaxed">{children}</li>,
    },
  };
}

interface ArticlePortableTextProps {
  value: TypedObject | TypedObject[];
  headingIdByBlockKey?: Record<string, string>;
}

export function ArticlePortableText({
  value,
  headingIdByBlockKey,
}: ArticlePortableTextProps) {
  const resolvedHeadingMap =
    headingIdByBlockKey ?? buildHeadingIdByBlockKey(value);
  return (
    <PortableText
      value={value}
      components={createArticleComponents(resolvedHeadingMap)}
    />
  );
}
