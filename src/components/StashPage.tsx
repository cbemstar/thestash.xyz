import { StashPageClient } from "./StashPageClient";
import type { Resource } from "@/types/resource";
import type { Collection } from "@/types/collection";

interface StashPageProps {
  resources: Resource[];
  collections: Collection[];
}

export function StashPage({ resources, collections }: StashPageProps) {
  // Server component wrapper – keeps heavy client logic isolated in StashPageClient
  // so less JS is sent to the browser on initial load.
  return <StashPageClient resources={resources} collections={collections} />;
}
