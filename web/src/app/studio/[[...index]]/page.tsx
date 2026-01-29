"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity-config";

/** Embedded Sanity Studio for managing resources. Open /studio when the app is running. */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
