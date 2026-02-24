"use client";

type ArticleSourcedImageValue = {
  _type?: "sourcedImage";
  _key?: string;
  imageUrl?: string;
  alt?: string;
  caption?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
};

interface ArticleSourcedImageProps {
  value?: ArticleSourcedImageValue;
}

export function ArticleSourcedImage({ value }: ArticleSourcedImageProps) {
  const imageUrl = value?.imageUrl?.trim();
  if (!imageUrl) return null;

  const alt = value?.alt?.trim() || value?.caption?.trim() || "Referenced visual";
  const caption = value?.caption?.trim();
  const sourceLabel = value?.sourceLabel?.trim();
  const sourceUrl = value?.sourceUrl?.trim();
  const width = Number.isFinite(value?.width) && (value?.width ?? 0) > 0 ? value?.width : 1600;
  const height =
    Number.isFinite(value?.height) && (value?.height ?? 0) > 0 ? value?.height : 900;

  return (
    <figure className="my-8 not-prose">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
        <img
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full"
        />
      </div>
      {(caption || sourceLabel) && (
        <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {caption ? <span>{caption} </span> : null}
          {sourceLabel ? (
            <span>
              Source:{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {sourceLabel}
                </a>
              ) : (
                sourceLabel
              )}
            </span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}
