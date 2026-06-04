import type { ManagerReview, Rating } from "../types";

const ratingToScore: Record<Rating, number | null> = { "": null, below: 1, meets: 2, above: 3, no_info: null };
export const ratingLabel: Record<Rating, string> = { "": "Не выбрано", below: "Ниже ожиданий", meets: "Соответствует", above: "Выше ожиданий", no_info: "Нет данных" };

export const score = (rating: Rating) => ratingToScore[rating];
export const corporateIndex = (review: ManagerReview) => {
  const values = [review.resultRating, review.technologyRating, review.teamRating].map(score).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};
export const indexLabel = (value: number | null) => value === null ? "Нет данных" : value < 1.5 ? "ниже ожиданий" : value < 2.5 ? "соответствует ожиданиям" : "выше ожиданий";
export const formatIndex = (value: number | null) => value === null ? "—" : value.toFixed(2);

export const managerHints = (review: ManagerReview, selfCorporateStrengths: string[]) => {
  const ratings = [review.hardRating, review.resultRating, review.technologyRating, review.teamRating, review.leadershipRating].map(score).filter((value): value is number => value !== null);
  const hints: string[] = [];
  if (review.category === "A" && ratings.length && ratings.every((value) => value <= 2)) hints.push("Проверьте, достаточно ли обоснована категория A: в компетенциях не отмечено проявлений выше ожиданий.");
  if ((review.category === "C" || review.category === "D") && ratings.length && ratings.every((value) => value >= 2)) hints.push("Проверьте согласованность оценки: категория ниже ожиданий, но компетенции оценены на уровне ожиданий или выше.");
  if (ratings.includes(1) && !review.corporateDevelopment.length) hints.push("Добавьте зону развития, связанную с оценкой ниже ожиданий.");
  if (review.corporateDevelopment.some((id) => selfCorporateStrengths.includes(id))) hints.push("Есть расхождения с самооценкой. Используйте их как тему для обсуждения на встрече.");
  return hints;
};
