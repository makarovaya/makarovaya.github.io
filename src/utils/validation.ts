import type { Employee, ManagerReview, SelfReview } from "../types";

export const validateSelf = (review: SelfReview) => {
  const errors: string[] = [];
  if (!review.accomplishments.some((value) => value.trim())) errors.push("Добавьте минимум один ключевой результат.");
  if (!review.hardStrengths.length) errors.push("Выберите минимум один профессиональный навык, который помог.");
  if (!review.hardDevelopment.length) errors.push("Выберите минимум один профессиональный навык для развития.");
  if (review.corporateStrengths.length < 2) errors.push("Выберите минимум две сильные корпоративные компетенции.");
  if (!review.corporateDevelopment.length) errors.push("Выберите минимум одну корпоративную зону развития.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Одна компетенция не может быть одновременно сильной стороной и зоной развития.");
  if (!review.developmentFocus.trim()) errors.push("Заполните фокус развития.");
  return errors;
};

export const validateManager = (review: ManagerReview, employee: Employee) => {
  const errors: string[] = [];
  if (!review.category) errors.push("Выберите итоговую категорию.");
  if (!review.hardRating || !review.resultRating || !review.technologyRating || !review.teamRating) errors.push("Заполните оценки всех обязательных блоков.");
  if (employee.isManager && !review.leadershipRating) errors.push("Заполните оценку блока лидерства.");
  if (!review.hardStrengths.length || !review.hardDevelopment.length) errors.push("Выберите профессиональные сильные стороны и зоны развития.");
  if (!review.corporateStrengths.length || !review.corporateDevelopment.length) errors.push("Выберите корпоративные сильные стороны и зоны развития.");
  if (review.corporateStrengths.some((id) => review.corporateDevelopment.includes(id))) errors.push("Одна компетенция не может быть одновременно сильной стороной и зоной развития.");
  if (!review.categoryRationale.trim()) errors.push("Объясните связь компетенций с итоговой категорией.");
  if (!review.agreedFocus.trim()) errors.push("Заполните согласованный фокус развития.");
  if (!review.finalComment.trim()) errors.push("Добавьте итоговый комментарий руководителя.");
  return errors;
};
