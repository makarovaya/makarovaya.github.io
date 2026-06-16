import { competencies, skills } from "../data/mockData";
import type { ManagerReview } from "../types";

const title = (id: string) => skills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
const list = (ids: string[]) => ids.length ? ids.map(title).join(", ") : "пока не выбраны";

export const generateFeedbackDraft = (review: ManagerReview) => ({
  strengthsText: `Сильные стороны сотрудника: ${list([...review.hardStrengths, ...review.corporateStrengths])}.`,
  developmentText: `Зоны развития: ${list([...review.hardDevelopment, ...review.corporateDevelopment])}.`,
});
