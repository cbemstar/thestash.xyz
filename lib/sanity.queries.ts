import { groq } from "next-sanity";

export const allResourcesQuery = groq`
  *[_type == "resource"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    body,
    sources,
    category,
    resourceType,
    tags,
    featured,
    industries,
    pricing,
    useCases,
    qualityScore,
    adoptionTier,
    recommenderBlurb,
    exampleSites,
    caseStudy,
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
    body,
    sources,
    category,
    resourceType,
    tags,
    featured,
    industries,
    pricing,
    useCases,
    qualityScore,
    adoptionTier,
    recommenderBlurb,
    exampleSites,
    caseStudy,
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
    resourceType,
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
    "coverImage": coverImage{
      ...,
      asset->
    },
    "resources": resources[]->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      resourceType,
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

/** Resources in a category, excluding one by _id. For "Similar resources" section. */
export const resourcesByCategoryQuery = groq`
  *[_type == "resource" && category == $category && _id != $excludeId] | order(coalesce(createdAt, _createdAt) desc)[0...$limit] {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    category,
    resourceType,
    tags,
    "icon": icon{ ..., asset-> }
  }
`;

/** Resources with a given resourceType (for /type/[slug] pages). */
export const resourcesByTypeQuery = groq`
  *[_type == "resource" && resourceType == $resourceType] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    category,
    resourceType,
    tags,
    featured,
    createdAt,
    "icon": icon{ ..., asset-> }
  }
`;

/** Collections that include the given resource (by _id). */
export const collectionsContainingResourceQuery = groq`
  *[_type == "collection" && references($resourceId)] {
    _id,
    title,
    slug
  }
`;

export const collectionBySlugQuery = groq`
  *[_type == "collection" && slug == $slug][0] {
    _id,
    title,
    slug,
    description,
    "coverImage": coverImage{
      ...,
      asset->
    },
    "resources": resources[]->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      resourceType,
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

