"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { Spinner } from "@/components/kibo-ui/spinner";
import { AppNav } from "@/components/AppNav";
import { cn } from "@/lib/utils";

const API_ENDPOINT = "/api/submit";

type Status = "idle" | "loading" | "success" | "error";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          category: category || undefined,
          tags: tags.length ? tags : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Thanks! Your submission is under review.");
      setUrl("");
      setTitle("");
      setDescription("");
      setCategory("");
      setTagsInput("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Submit a resource
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suggest a tool, site, or resource. We review each submission for quality and safety before
          publishing.
        </p>
      </div>

      {isSuccess ? (
        <div
          className="rounded-lg border border-border bg-card p-6 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-foreground">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can{" "}
            <Link href="/submit" className="text-foreground underline underline-offset-2 hover:text-primary">
              submit another
            </Link>{" "}
            or{" "}
            <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary">
              go back home
            </Link>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="submit-url">URL</FieldLabel>
              <FieldDescription id="submit-url-desc">
                Full link to the resource (e.g. https://example.com)
              </FieldDescription>
              <Input
                id="submit-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
                aria-describedby="submit-url-desc"
                className="mt-1.5"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="submit-title">Title</FieldLabel>
              <FieldDescription id="submit-title-desc">2–120 characters</FieldDescription>
              <Input
                id="submit-title"
                type="text"
                placeholder="e.g. Figma"
                minLength={2}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                aria-describedby="submit-title-desc"
                className="mt-1.5"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="submit-description">Short description</FieldLabel>
              <FieldDescription id="submit-description-desc">10–260 characters</FieldDescription>
              <textarea
                id="submit-description"
                placeholder="One or two sentences describing the resource."
                minLength={10}
                maxLength={260}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isLoading}
                aria-describedby="submit-description-desc"
                rows={3}
                className={cn(
                  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 mt-1.5 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:opacity-50",
                  "aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="submit-category">Category</FieldLabel>
              <FieldDescription id="submit-category-desc">Pick the best fit</FieldDescription>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="submit-category"
                  className="mt-1.5 w-full"
                  aria-describedby="submit-category-desc"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="submit-tags">Tags (optional)</FieldLabel>
              <FieldDescription id="submit-tags-desc">
                Comma- or space-separated, e.g. design, api, open-source
              </FieldDescription>
              <Input
                id="submit-tags"
                type="text"
                placeholder="design, prototyping, ..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isLoading}
                aria-describedby="submit-tags-desc"
                className="mt-1.5"
              />
            </Field>
          </FieldGroup>

          {status === "error" && message && (
            <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isLoading || !category.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner className="size-4" />
                  Submitting…
                </>
              ) : (
                "Submit for review"
              )}
            </Button>
            <Link
              href="/"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}
