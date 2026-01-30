import type { Resource } from "./resource";

export interface Collection {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  resources: Resource[];
  featured?: boolean;
  createdAt?: string;
}
