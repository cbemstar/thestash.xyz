import type { ResourceReference } from "./resource";

export type ComparisonWinner = "left" | "right" | "tie";

export interface ComparisonUseCaseWinner {
  useCase: string;
  winner: ComparisonWinner;
  reason: string;
}

export interface ComparisonCriteriaRow {
  criterion: string;
  left: string;
  right: string;
  winner?: ComparisonWinner;
  notes?: string;
}

export interface ComparisonFaq {
  question: string;
  answer: string;
}

export interface Comparison {
  _id: string;
  title: string;
  slug?: string;
  summary: string;
  leftResource: ResourceReference | null;
  rightResource: ResourceReference | null;
  winnerByUseCase?: ComparisonUseCaseWinner[];
  criteriaTable?: ComparisonCriteriaRow[];
  migrationChecklist?: string[];
  faq?: ComparisonFaq[];
  sources?: { label: string; url: string }[];
  lastReviewedAt?: string | null;
  createdAt?: string;
}
