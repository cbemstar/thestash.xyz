import { groq } from "next-sanity";

/** Minimal fields for llms-full.txt (title + slug only). */
export const resourcesTitlesSlugsQuery = groq`
  *[_type == "resource"] | order(title asc) {
    title,
    "slug": coalesce(slug.current, slug)
  }
`;

export const allResourcesQuery = groq`
  *[_type == "resource"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    body,
    sources,
    "alternatives": alternatives[]->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category
    },
    bestFor,
    notFor,
    pricingNotes,
    lastReviewedAt,
    contentTier,
    refreshCadenceDays,
    factCheckStatus,
    changeLog,
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
    "createdAt": coalesce(createdAt, _createdAt),
    "icon": icon{
      ...,
      asset->
    }
  }
`;

/** Lightweight fields for high-traffic listing + recommender ISR pages. */
export const allResourcesLiteQuery = groq`
  *[_type == "resource"] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    "slug": coalesce(slug.current, slug),
    "url": coalesce(url, ""),
    description,
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
    "createdAt": coalesce(createdAt, _createdAt),
    "icon": icon{
      asset
    }
  }
`;

/** Tag index for filter/taxonomy pages without pulling long-form resource content. */
export const allResourceTagsQuery = groq`
  *[_type == "resource"]{
    tags
  }
`;

/** Resource type index for /type pages and faceted navigation. */
export const allResourceTypesQuery = groq`
  *[_type == "resource"]{
    resourceType
  }
`;

/** Lightweight alternatives-hub summary rows for /alternatives index generation. */
export const alternativeResourceSummariesQuery = groq`
  *[_type == "resource" && count(alternatives) > 0] | order(coalesce(lastReviewedAt, createdAt, _createdAt) desc) {
    title,
    "slug": coalesce(slug.current, slug),
    "sourcesCount": count(sources),
    "bestForCount": count(bestFor),
    "notForCount": count(notFor),
    "alternativesCount": count(alternatives),
    lastReviewedAt
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
    "alternatives": alternatives[]->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category
    },
    bestFor,
    notFor,
    pricingNotes,
    lastReviewedAt,
    contentTier,
    refreshCadenceDays,
    factCheckStatus,
    changeLog,
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
    "createdAt": coalesce(createdAt, _createdAt),
    "icon": icon{
      ...,
      asset->
    }
  }
`;

/** Resource with alternatives for /alternatives/[slug] pages. */
export const resourceAlternativesBySlugQuery = groq`
  *[_type == "resource" && slug == $slug][0] {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    body,
    sources,
    "alternatives": alternatives[]->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      body,
      sources,
      category,
      bestFor,
      notFor,
      pricingNotes,
      lastReviewedAt,
      contentTier
    },
    bestFor,
    notFor,
    pricingNotes,
    lastReviewedAt,
    contentTier,
    refreshCadenceDays,
    factCheckStatus,
    changeLog,
    category,
    resourceType,
    tags,
    "createdAt": coalesce(createdAt, _createdAt),
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
    "resourceCount": count(resources),
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
      "createdAt": coalesce(createdAt, _createdAt),
      "icon": icon{
        ...,
        asset->
      }
    },
    featured,
    createdAt
  }
`;

/** Resources created since a given ISO date (for weekly digest / latest page). */
export const recentResourcesQuery = groq`
  *[_type == "resource" && (coalesce(createdAt, _createdAt) >= $since)] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    "url": coalesce(url, ""),
    description,
    category,
    resourceType,
    tags,
    "createdAt": coalesce(createdAt, _createdAt),
    "icon": icon{ ..., asset-> }
  }
`;

/** Total number of resources in the directory (for stats). */
export const totalResourceCountQuery = groq`count(*[_type == "resource"])`;

/** Total number of collections (for footer stats). */
export const totalCollectionCountQuery = groq`count(*[_type == "collection"])`;

/** Resource counts by category for collection cards (directory-wide totals). */
export const resourceCountsByCategoryQuery = groq`{
  "design-tools": count(*[_type == "resource" && category == "design-tools"]),
  "development-tools": count(*[_type == "resource" && category == "development-tools"]),
  "ai-tools": count(*[_type == "resource" && category == "ai-tools"]),
  "learning-resources": count(*[_type == "resource" && category == "learning-resources"]),
  "productivity": count(*[_type == "resource" && category == "productivity"]),
  "ui-ux-resources": count(*[_type == "resource" && category == "ui-ux-resources"]),
  "inspiration": count(*[_type == "resource" && category == "inspiration"]),
  "webflow": count(*[_type == "resource" && category == "webflow"]),
  "shadcn": count(*[_type == "resource" && category == "shadcn"]),
  "coding": count(*[_type == "resource" && category == "coding"]),
  "github": count(*[_type == "resource" && category == "github"]),
  "html": count(*[_type == "resource" && category == "html"]),
  "css": count(*[_type == "resource" && category == "css"]),
  "javascript": count(*[_type == "resource" && category == "javascript"]),
  "languages": count(*[_type == "resource" && category == "languages"]),
  "miscellaneous": count(*[_type == "resource" && category == "miscellaneous"])
}`;

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
    "createdAt": coalesce(createdAt, _createdAt),
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
    "resourceCount": count(resources),
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

export const allComparisonSlugsQuery = groq`
  *[_type == "comparison" && defined(slug)] | order(coalesce(lastReviewedAt, createdAt, _createdAt) desc) {
    slug
  }
`;

export const allComparisonsQuery = groq`
  *[_type == "comparison"] | order(coalesce(lastReviewedAt, createdAt, _createdAt) desc) {
    _id,
    title,
    slug,
    summary,
    winnerByUseCase,
    criteriaTable,
    migrationChecklist,
    faq,
    sources,
    lastReviewedAt,
    createdAt,
    "leftResource": leftResource->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      bestFor,
      notFor,
      pricingNotes,
      lastReviewedAt
    },
    "rightResource": rightResource->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      bestFor,
      notFor,
      pricingNotes,
      lastReviewedAt
    }
  }
`;

export const comparisonBySlugQuery = groq`
  *[_type == "comparison" && slug == $slug][0] {
    _id,
    title,
    slug,
    summary,
    winnerByUseCase,
    criteriaTable,
    migrationChecklist,
    faq,
    sources,
    lastReviewedAt,
    createdAt,
    "leftResource": leftResource->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      bestFor,
      notFor,
      pricingNotes,
      lastReviewedAt
    },
    "rightResource": rightResource->{
      _id,
      title,
      slug,
      "url": coalesce(url, ""),
      description,
      category,
      bestFor,
      notFor,
      pricingNotes,
      lastReviewedAt
    }
  }
`;

export const allArticlesQuery = groq`
  *[_type == "article"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    primaryKeyword,
    intentStage,
    contentTier,
    lastReviewedAt,
    excerpt,
    body,
    tags,
    "primaryResource": primaryResource->{
      _id,
      title,
      slug
    },
    relatedResources[]->{
      _id,
      title,
      slug
    },
    sources,
    author,
    publishedAt,
    "heroImage": heroImage{
      ...,
      asset->
    }
  }
`;

export const articleBySlugQuery = groq`
  *[_type == "article" && slug == $slug][0] {
    _id,
    title,
    slug,
    primaryKeyword,
    intentStage,
    contentTier,
    lastReviewedAt,
    excerpt,
    body,
    tags,
    "primaryResource": primaryResource->{
      _id,
      title,
      slug
    },
    relatedResources[]->{
      _id,
      title,
      slug
    },
    sources,
    author,
    publishedAt,
    "heroImage": heroImage{
      ...,
      asset->
    }
  }
`;
