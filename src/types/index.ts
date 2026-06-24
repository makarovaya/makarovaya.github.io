export type Role = "employee" | "manager" | "analytics";
export type ReviewStatus = "draft" | "submitted" | "completed";
export type Rating = "" | "below" | "meets" | "above" | "no_info";
export type PerformanceCategory = "" | "A" | "B" | "C" | "D";
export type CompetencyBlock = "result" | "technology" | "team" | "leadership";
export type DevelopmentTrack = "" | "expert" | "career_growth" | "mentor" | "leadership" | "retention_key_expert" | "successor";
export type ManagementSituation = "" | "no_reports" | "manages_specialists" | "manages_line_managers" | "manages_middle_managers";
export type ManagementSkillLevel = "level_1" | "level_2" | "level_3";
export type EmployeeDevelopmentDirection = "" | "expertise" | "leadership";
export type ManagerMainTrack = "" | "expert" | "management";

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
  applicableTo: "all" | "managers";
};

export type SkillMappedToCompetency = {
  id: string;
  blockId: CompetencyBlock;
  blockTitle: string;
  competencyId: string;
  competencyTitle: string;
  competencyShortDescription?: string;
  level: ManagementSkillLevel;
  title: string;
  employeeHint: string;
  managerHint: string;
  fullDescription?: string;
};

export type SelfReview = {
  employeeId: string;
  status: "draft" | "submitted";
  accomplishments: string[];
  hardStrengths: string[];
  hardDevelopment: string[];
  managementSituation: ManagementSituation;
  softStrengths: string[];
  softGrowthAreas: string[];
  preferredDevelopmentDirection: EmployeeDevelopmentDirection;
  interestedInMentoring: boolean;
  employeeComment: string;
  corporateStrengths: string[];
  corporateDevelopment: string[];
  developmentFocus: string;
  notes: string;
};

export type ManagerReview = {
  employeeId: string;
  status: "draft" | "completed";
  category: PerformanceCategory;
  hardRating: Rating;
  resultRating: Rating;
  technologyRating: Rating;
  teamRating: Rating;
  leadershipRating: Rating;
  hardStrengths: string[];
  hardDevelopment: string[];
  corporateStrengths: string[];
  corporateDevelopment: string[];
  softManagementSituation: ManagementSituation;
  strengthsText: string;
  developmentText: string;
  categoryRationale: string;
  agreedFocus: string;
  developmentTrack: DevelopmentTrack;
  mainTrack: ManagerMainTrack;
  mentorTrack: boolean;
  retentionTrack: boolean;
  successorTrack: boolean;
  targetPosition: string;
  successorPosition: string;
  trackComment: string;
  managerComment: string;
  finalComment: string;
};
