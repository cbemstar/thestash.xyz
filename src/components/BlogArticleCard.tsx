import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import { Pill } from "@/components/kibo-ui/pill";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { Article } from "@/types/article";
import { urlFor } from "@/lib/sanity.image";
import { cn } from "@/lib/utils";

interface BlogArticleCardProps {
  article: Article;
  variant?: "default" | "featured";
  priority?: boolean;
}

export function BlogArticleCard({
  article,
  variant = "default",
  priority = false,
}: BlogArticleCardProps) {
  const slug =
    article.slug && typeof article.slug === "string" ? article.slug : "";
  if (!slug) return null;

  const href = `/blog/${slug}`;
  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isFeatured = variant === "featured";
  const heroUrl = article.heroImage
    ? urlFor(article.heroImage)
        .width(isFeatured ? 800 : 400)
        .height(isFeatured ? 340 : 225)
        .url()
    : null;

  return (
    <Link href={href} className="block h-full group">
      <Card
        className={cn(
          "h-full overflow-hidden transition-all duration-200",
          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          isFeatured && "border-primary/20"
        )}
      >
        {heroUrl && (
          <div
            className={cn(
              "relative w-full overflow-hidden bg-muted",
              isFeatured ? "aspect-[21/9]" : "aspect-[16/9]"
            )}
          >
            <Image
              src={heroUrl}
              alt={`${article.title} cover image`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes={isFeatured ? "800px" : "400px"}
              priority={priority}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-hidden
            />
          </div>
        )}
        <CardHeader className={cn("pb-2", !heroUrl && "pt-6")}>
          {dateLabel && (
            <time
              dateTime={article.publishedAt ?? undefined}
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              {dateLabel}
            </time>
          )}
          <CardTitle
            className={cn(
              "leading-tight transition-colors group-hover:text-primary line-clamp-2",
              isFeatured ? "text-xl sm:text-2xl" : "text-base"
            )}
          >
            {article.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 min-h-0">
          {article.excerpt ? (
            <CardDescription
              className={cn(
                "text-muted-foreground min-h-[5.5rem]",
                isFeatured
                  ? "text-sm sm:text-base line-clamp-4"
                  : "text-sm line-clamp-4"
              )}
            >
              {article.excerpt}
            </CardDescription>
          ) : (
            <div className="min-h-[5.5rem]" aria-hidden />
          )}
        </CardContent>
        <CardFooter className="flex flex-col flex-nowrap items-start justify-center gap-2 pt-4">
          {article.tags?.length ? (
            <div className="flex flex-wrap w-fit gap-2 items-start">
              {article.tags.slice(0, 3).map((tag) => (
                <Pill
                  key={tag}
                  variant="secondary"
                  className="text-xs font-medium"
                >
                  {tag}
                </Pill>
              ))}
            </div>
          ) : (
            <span />
          )}
          <span
            className="inline-flex items-center gap-1 pl-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors"
            aria-hidden
          >
            Read
            <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
