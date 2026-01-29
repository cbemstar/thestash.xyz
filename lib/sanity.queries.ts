import { groq } from "next-sanity";

export const allResourcesQuery = groq`
  *[_type == "resource"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    "url": coalesce(url, ""),
    description,
    category,
    tags,
    featured,
    createdAt,
    "icon": icon{
      ...,
      asset->
    }
  }
`;

export const featuredResourcesQuery = groq`
  *[_type == "resource" && featured == true] | order(coalesce(createdAt, _createdAt) desc)[0...12] {
    _id,
    title,
    "url": coalesce(url, ""),
    description,
    category,
    tags,
    featured,
    createdAt,
    "icon": icon{
      ...,
      asset->
    }
  }
`;

