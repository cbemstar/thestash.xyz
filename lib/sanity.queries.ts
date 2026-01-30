import { groq } from "next-sanity";

export const allResourcesQuery = groq`
  *[_type == "resource"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
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

/** Single resource by slug (only when slug field is set in Sanity). */
export const resourceBySlugQuery = groq`
  *[_type == "resource" && slug == $slug][0] {
    _id,
    title,
    slug,
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

export const allCollectionsQuery = groq`
  *[_type == "collection"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    description,
    "resources": resources[]->{
      _id,
      title,
      slug,
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
    },
    featured,
    createdAt
  }
`;

export const collectionBySlugQuery = groq`
  *[_type == "collection" && slug == $slug][0] {
    _id,
    title,
    slug,
    description,
    "resources": resources[]->{
      _id,
      title,
      slug,
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
    },
    featured,
    createdAt
  }
`;

