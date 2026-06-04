import { initialManagerReviews, initialSelfReviews } from "../data/mockData";
import type { ManagerReview, Role, SelfReview } from "../types";

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

export const loadState = () => ({
  selfReviews: read<SelfReview[]>(keys.self, initialSelfReviews),
  managerReviews: read<ManagerReview[]>(keys.manager, initialManagerReviews),
  role: read<Role>(keys.role, "employee"),
  selectedEmployeeId: read<string>(keys.employee, "anna"),
});

export const saveSelfReviews = (reviews: SelfReview[]) => localStorage.setItem(keys.self, JSON.stringify(reviews));
export const saveManagerReviews = (reviews: ManagerReview[]) => localStorage.setItem(keys.manager, JSON.stringify(reviews));
export const saveRole = (role: Role) => localStorage.setItem(keys.role, JSON.stringify(role));
export const saveSelectedEmployee = (id: string) => localStorage.setItem(keys.employee, JSON.stringify(id));
export const resetState = () => Object.values(keys).forEach((key) => localStorage.removeItem(key));
