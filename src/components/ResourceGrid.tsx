import { ResourceCard } from "./ResourceCard";
import type { Resource } from "@/types/resource";

interface ResourceGridProps {
  resources: Resource[];
}

export function ResourceGrid({ resources }: ResourceGridProps) {
  if (resources.length === 0) {
    return (
      <p className="py-12 text-center text-zinc-500" role="status">
        No resources match your filters. Try another category or search.
      </p>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Resource list"
    >
      {resources.map((resource) => (
        <li key={resource._id}>
          <ResourceCard resource={resource} />
        </li>
      ))}
    </ul>
  );
}
