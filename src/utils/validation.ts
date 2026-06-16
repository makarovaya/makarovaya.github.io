import type { ManagerReview, SelfReview } from "../types";

export const validateSelf = (review: SelfReview) => {
  const errors: string[] = [];
  if (!review.accomplishments.some((value) => value.trim())) errors.push("Добавьте минимум один ключевой результат.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум один профессиональный навык, который помог.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один профессиональный навык для развития.");
  if (!review.corporateStrengths.length) errors.push("Выберите минимум одну компетенцию.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум одну компетенцию.");
  if (review.corporateStrengths.length > 3 || review.corporateDevelopment.length > 3) errors.push("Можно выбрать не больше трёх компетенций в каждом блоке.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Компетенция не может одновременно быть тем, что помогало результату, и тем, что вы хотите усилить.");
  return errors;
};

export const validateManager = (review: ManagerReview) => {
  const errors: string[] = [];
  if (!review.category) errors.push("Выберите категорию сотрудника на основе оценки результативности.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум один hard skill, который помогал сотруднику добиться результата.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один hard skill, который сотруднику стоит усилить.");
  if (!review.corporateStrengths.length) errors.push("Выберите минимум одну корпоративную компетенцию, которая помогала результату.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум одну корпоративную компетенцию, которую сотруднику стоит усилить.");
  if (review.corporateStrengths.length > 3 || review.corporateDevelopment.length > 3) errors.push("Можно выбрать не больше трёх компетенций в каждом блоке.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Одна компетенция не может быть одновременно сильной стороной и зоной развития.");
  if (!review.developmentTrack) errors.push("Выберите трек для сотрудника на следующий период.");
  if (review.developmentTrack === "career_growth" && !review.targetPosition.trim()) errors.push("Заполните целевую позицию для карьерного трека.");
  if (review.developmentTrack === "successor" && !review.successorPosition.trim()) errors.push("Заполните позицию преемника.");
  return errors;
};
