export type Role = "employee" | "manager" | "analytics";
export type ReviewStatus = "draft" | "submitted" | "completed";
export type Rating = "" | "below" | "meets" | "above" | "no_info" | "not_applicable";
export type PerformanceCategory = "" | "A" | "B" | "C" | "D";
export type CompetencyBlock = "result" | "technology" | "team" | "leadership";
export type CompetencyRatingMap = Record<string, Rating>;

export type Employee = {
  id: string;
  fullName: string;
  position: string;
  department: string;
  grade?: string;
  isManager: boolean;
  managerId?: string;
  performanceCategory?: "A" | "B" | "C" | "D";
  avatarInitials: string;
};

export type Skill = {
  id: string;
  title: string;
  category: "analytics" | "project" | "communication" | "digital" | "professional" | "management";
  source: "dictionary" | "custom";
};

export type Competency = {
  id: string;
  block: CompetencyBlock;
  title: string;
  description: string;
  indicators: string[];
  applicableTo: "all" | "leadership";
};

export type SelfReview = {
  employeeId: string;
  status: "draft" | "submitted";
  accomplishments: string[];
  hardStrengths: string[];
  hardDevelopment: string[];
  competencyRatings: CompetencyRatingMap;
  leadershipNotApplicable: boolean;
  corporateStrengths: string[];
  corporateDevelopment: string[];
  developmentFocus: string;
  notes: string;
};

export type ManagerReview = {
  employeeId: string;
  status: "draft" | "completed";
  category: PerformanceCategory;
  competencyRatings: CompetencyRatingMap;
  hardStrengths: string[];
  hardDevelopment: string[];
  corporateStrengths: string[];
  corporateDevelopment: string[];
  strengthsText: string;
  developmentText: string;
  categoryRationale: string;
  agreedFocus: string;
  finalComment: string;
};
