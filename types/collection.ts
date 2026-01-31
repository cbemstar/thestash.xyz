import type { Resource } from "./resource";

export interface Collection {
  _id: string;
  title: string;
  slug?: string;
  description: string;
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
