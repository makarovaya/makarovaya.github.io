import { createEmptyManagerReview, createEmptySelfReview, initialManagerReviews, initialSelfReviews } from "../data/mockData";
import type { ManagerMainTrack, ManagerReview, Role, SelfReview } from "../types";

const keys = {
  self: "performanceReview.selfReviews",
  manager: "performanceReview.managerReviews",
  role: "performanceReview.currentRole",
  employee: "performanceReview.selectedEmployeeId",
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const mainTrackFromLegacy = (review: Partial<ManagerReview>): ManagerMainTrack => {
  if (review.mainTrack) return review.mainTrack;
  if (review.developmentTrack === "leadership" || review.developmentTrack === "career_growth") return "management";
  if (review.developmentTrack === "expert" || review.developmentTrack === "mentor" || review.developmentTrack === "retention_key_expert") return "expert";
  return "";
};

const normalizeSelfReview = (review: Partial<SelfReview>): SelfReview => {
  const employeeId = review.employeeId ?? "anna";
  const softStrengths = review.softStrengths ?? review.corporateStrengths ?? [];
  const softGrowthAreas = review.softGrowthAreas ?? review.corporateDevelopment ?? [];
  return {
    ...createEmptySelfReview(employeeId),
    ...review,
    employeeId,
    accomplishments: review.accomplishments ?? [],
    hardStrengths: review.hardStrengths ?? [],
    hardDevelopment: review.hardDevelopment ?? [],
    softStrengths,
    softGrowthAreas,
    corporateStrengths: review.corporateStrengths ?? softStrengths,
    corporateDevelopment: review.corporateDevelopment ?? softGrowthAreas,
    interestedInMentoring: !!review.interestedInMentoring,
    employeeComment: review.employeeComment ?? "",
  };
};

const normalizeManagerReview = (review: Partial<ManagerReview>): ManagerReview => {
  const employeeId = review.employeeId ?? "anna";
  return {
    ...createEmptyManagerReview(employeeId),
    ...review,
    employeeId,
    hardStrengths: review.hardStrengths ?? [],
    hardDevelopment: review.hardDevelopment ?? [],
    corporateStrengths: review.corporateStrengths ?? [],
    corporateDevelopment: review.corporateDevelopment ?? [],
    mainTrack: mainTrackFromLegacy(review),
    mentorTrack: !!review.mentorTrack || review.developmentTrack === "mentor",
    retentionTrack: !!review.retentionTrack || review.developmentTrack === "retention_key_expert",
    successorTrack: !!review.successorTrack || review.developmentTrack === "successor",
    successorPosition: review.successorPosition ?? review.targetPosition ?? "",
    managerComment: review.managerComment ?? "",
    finalComment: review.finalComment ?? "",
  };
};

export const loadState = () => ({
  selfReviews: read<Partial<SelfReview>[]>(keys.self, initialSelfReviews).map(normalizeSelfReview),
  managerReviews: read<Partial<ManagerReview>[]>(keys.manager, initialManagerReviews).map(normalizeManagerReview),
  role: read<Role>(keys.role, "employee"),
  selectedEmployeeId: read<string>(keys.employee, "anna"),
});

export const saveSelfReviews = (reviews: SelfReview[]) => localStorage.setItem(keys.self, JSON.stringify(reviews));
export const saveManagerReviews = (reviews: ManagerReview[]) => localStorage.setItem(keys.manager, JSON.stringify(reviews));
export const saveRole = (role: Role) => localStorage.setItem(keys.role, JSON.stringify(role));
export const saveSelectedEmployee = (id: string) => localStorage.setItem(keys.employee, JSON.stringify(id));
export const resetState = () => Object.values(keys).forEach((key) => localStorage.removeItem(key));
