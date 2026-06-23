import type { ManagerReview, SelfReview } from "../types";

const selfSoftStrengths = (review: SelfReview) => review.softStrengths?.length ? review.softStrengths : review.corporateStrengths;
const selfSoftGrowth = (review: SelfReview) => review.softGrowthAreas?.length ? review.softGrowthAreas : review.corporateDevelopment;

export const validateSelf = (review: SelfReview) => {
  const errors: string[] = [];
  const strengths = selfSoftStrengths(review);
  const growth = selfSoftGrowth(review);
  if (!review.hardStrengths.length) errors.push("Выберите минимум один hard skill как сильную сторону.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один hard skill как зону роста.");
  if (!review.managementSituation) errors.push("Выберите управленческую ситуацию.");
  if (!strengths.length) errors.push("Выберите минимум один навык как сильную сторону.");
  if (!growth.length) errors.push("Выберите минимум один навык как зону роста.");
  if (strengths.length > 5 || growth.length > 5) errors.push("Можно выбрать не больше 5 навыков.");
  if (strengths.some((id) => growth.includes(id))) errors.push("Один и тот же навык нельзя одновременно выбрать как сильную сторону и как зону роста.");
  if (!review.preferredDevelopmentDirection) errors.push("Выберите основное направление развития.");
  return errors;
};

export const validateManager = (review: ManagerReview) => {
  const errors: string[] = [];
  if (!review.category) errors.push("Выберите категорию сотрудника на основе оценки результативности.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум один hard skill как сильную сторону.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один hard skill как зону роста.");
  if (!review.corporateStrengths.length) errors.push("Выберите минимум один навык как сильную сторону.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум один навык как зону роста.");
  if (review.corporateStrengths.length > 5 || review.corporateDevelopment.length > 5) errors.push("Можно выбрать не больше 5 навыков.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Один и тот же навык нельзя одновременно выбрать как сильную сторону и как зону роста.");
  if (!review.mainTrack) errors.push("Выберите основной трек сотрудника.");
  if (review.successorTrack && !review.successorPosition.trim()) errors.push("Заполните позицию преемника.");
  return errors;
};
