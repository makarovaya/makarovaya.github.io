import { competencies } from "../data/competencies";
import { skills } from "../data/skills";
import type { ManagerReview } from "../types";

const title = (id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return skills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
};
const list = (ids: string[]) => ids.length ? ids.map(title).join(", ") : "пока не выбраны";

export const generateFeedbackDraft = (review: ManagerReview) => ({
  strengthsText: `Сильные стороны сотрудника: ${list([...review.hardStrengths, ...review.corporateStrengths])}.`,
  developmentText: `Зоны развития: ${list([...review.hardDevelopment, ...review.corporateDevelopment])}. В следующем периоде рекомендуется сфокусироваться на согласованном плане развития.`,
});
