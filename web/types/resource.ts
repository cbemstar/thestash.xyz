export type ResourceCategory =
  | "design-tools"
  | "development-tools"
  | "ui-ux-resources"
  | "inspiration"
  | "ai-tools"
  | "productivity"
  | "learning-resources"
  | "miscellaneous";

export interface Resource {
  _id: string;
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  tags?: string[];
  featured?: boolean;
  createdAt?: string;
  icon?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
}

