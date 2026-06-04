import { competencies } from "../data/competencies";
import type { ManagerReview, SelfReview } from "../types";

const base = competencies.filter((competency) => competency.applicableTo === "all");
const leadership = competencies.filter((competency) => competency.applicableTo === "leadership");

export const validateSelf = (review: SelfReview) => {
  const errors: string[] = [];
  if (!review.accomplishments.some((value) => value.trim())) errors.push("Добавьте минимум один ключевой результат.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум один профессиональный навык, который помог.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один профессиональный навык для развития.");
  if (base.some((competency) => !review.competencyRatings[competency.id])) errors.push("Оцените все 9 базовых компетенций.");
  if (leadership.some((competency) => !review.competencyRatings[competency.id])) errors.push("Оцените все 3 лидерские компетенции или отметьте “не актуально”.");
  if (!review.corporateStrengths.length) errors.push("Выберите минимум одну сильную компетенцию.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум одну компетенцию для развития.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Одна компетенция не может быть одновременно сильной стороной и зоной развития.");
  if (!review.developmentFocus.trim()) errors.push("Заполните фокус развития.");
  return errors;
};

export const validateManager = (review: ManagerReview) => {
  const errors: string[] = [];
  if (competencies.some((competency) => !review.competencyRatings[competency.id])) errors.push("Заполните оценки руководителя по всем 12 компетенциям.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум одну профессиональную сильную сторону.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум одну профессиональную зону развития.");
  if (!review.corporateStrengths.length) errors.push("Выберите минимум одну сильную корпоративную компетенцию.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум одну корпоративную компетенцию для развития.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Одна компетенция не может быть одновременно сильной стороной и зоной развития.");
  if (!review.categoryRationale.trim()) errors.push("Объясните связь компетенций с итоговой категорией.");
  if (!review.agreedFocus.trim()) errors.push("Заполните согласованный фокус развития.");
  if (!review.finalComment.trim()) errors.push("Добавьте итоговый комментарий руководителя.");
  return errors;
};
