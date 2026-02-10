export type Article = {
  _id: string;
  title: string;
  slug?: string;
  excerpt: string;
  body: any; // Portable Text blocks array; rendered with @portable-text/react
  heroImage?: {
    asset?: {
      _ref?: string;
      url?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
  tags?: string[];
  relatedResources?: {
    _id: string;
    title: string;
    slug?: string;
  }[];
  sources?: {
    label: string;
    url: string;
  }[];
  author?: string;
  publishedAt?: string;
};

