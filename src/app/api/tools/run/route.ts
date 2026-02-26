import { NextRequest, NextResponse } from "next/server";
import { getToolBySlug, type ToolInputSource } from "@/lib/tools-catalog";
import { type ToolOutputLength, type ToolTone } from "@/lib/tools-engine";
import {
  extractUploadedFileText,
  runConverterTool,
} from "@/lib/server/tool-converter";
import { runNonConverterTool } from "@/lib/server/tool-runtime";

export const runtime = "nodejs";

function toSource(value: FormDataEntryValue | null): ToolInputSource {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "url" || normalized === "file" || normalized === "text") {
    return normalized;
  }
  return "text";
}

function toTone(value: FormDataEntryValue | null): ToolTone {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "direct" || normalized === "balanced" || normalized === "friendly") {
    return normalized;
  }
  return "balanced";
}

function toOutputLength(value: FormDataEntryValue | null): ToolOutputLength {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "short" || normalized === "standard" || normalized === "detailed") {
    return normalized;
  }
  return "standard";
}

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
  }

  const slug = toStringValue(formData.get("slug")).trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing tool slug." }, { status: 400 });
  }

  const tool = getToolBySlug(slug);
  if (!tool) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 404 });
  }

  const source = toSource(formData.get("source"));
  const primaryInput = toStringValue(formData.get("primaryInput"));
  const secondaryInput = toStringValue(formData.get("secondaryInput"));
  const tone = toTone(formData.get("tone"));
  const outputLength = toOutputLength(formData.get("outputLength"));
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;

  try {
    if (tool.kind === "converter") {
      const result = await runConverterTool({
        tool,
        source,
        primaryInput,
        secondaryInput,
        file,
      });
      return NextResponse.json(result);
    }

    const nonConverterWarnings: string[] = [];
    let resolvedPrimaryInput = primaryInput;
    if (source === "file" && file && !resolvedPrimaryInput.trim() && tool.kind !== "chat") {
      const extracted = await extractUploadedFileText(file);
      resolvedPrimaryInput = extracted.text;
      nonConverterWarnings.push(...extracted.warnings);
    }

    const result = await runNonConverterTool({
      tool,
      source,
      primaryInput: resolvedPrimaryInput,
      secondaryInput,
      tone,
      outputLength,
      file,
    });

    return NextResponse.json({
      output: result.output,
      warnings: [...nonConverterWarnings, ...result.warnings],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
