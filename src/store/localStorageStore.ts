import { initialManagerReviews, initialSelfReviews } from "../data/mockData";
import type { ManagerReview, Role, SelfReview } from "../types";

const keys = {
  self: "performanceReview.v2.selfReviews",
  manager: "performanceReview.v2.managerReviews",
  role: "performanceReview.v2.currentRole",
  employee: "performanceReview.v2.selectedEmployeeId",
  teamReviewMode: "performanceReview.v2.teamReviewMode",
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

export const loadState = () => ({
  selfReviews: read<SelfReview[]>(keys.self, initialSelfReviews),
  managerReviews: read<ManagerReview[]>(keys.manager, initialManagerReviews),
  role: read<Role>(keys.role, "employee"),
  selectedEmployeeId: read<string>(keys.employee, "anna"),
  teamReviewMode: read<"employees" | "competencies">(keys.teamReviewMode, "employees"),
});

export const saveSelfReviews = (reviews: SelfReview[]) => localStorage.setItem(keys.self, JSON.stringify(reviews));
export const saveManagerReviews = (reviews: ManagerReview[]) => localStorage.setItem(keys.manager, JSON.stringify(reviews));
export const saveRole = (role: Role) => localStorage.setItem(keys.role, JSON.stringify(role));
export const saveSelectedEmployee = (id: string) => localStorage.setItem(keys.employee, JSON.stringify(id));
export const saveTeamReviewMode = (mode: "employees" | "competencies") => localStorage.setItem(keys.teamReviewMode, JSON.stringify(mode));
export const resetState = () => Object.values(keys).forEach((key) => localStorage.removeItem(key));
