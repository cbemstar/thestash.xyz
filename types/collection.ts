import type { Resource } from "./resource";

export interface Collection {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  /** Server-computed count from Sanity (use this over resources.length for accuracy). */
  resourceCount?: number;
  resources: Resource[];
  featured?: boolean;
  createdAt?: string;
  coverImage?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
}
