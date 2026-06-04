import { competencies } from "../data/competencies";
import type { CompetencyBlock, CompetencyRatingMap, ManagerReview, Rating, SelfReview } from "../types";

export const ratingToScore: Record<Rating, number | null> = { "": null, below: 1, meets: 2, above: 3, no_info: null, not_applicable: null };
export const ratingLabel: Record<Rating, string> = {
  "": "Не выбрано",
  below: "Ниже ожиданий",
  meets: "Соответствует",
  above: "Выше ожиданий",
  no_info: "Нет информации",
  not_applicable: "Не актуально",
};

export const score = (rating: Rating | undefined) => ratingToScore[rating ?? ""];

export const averageRatings = (ratings: Array<Rating | undefined>): number | null => {
  const values = ratings.map(score).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

export const formatIndex = (value: number | null) => value === null ? "—" : value.toFixed(2);
export const indexLabel = (value: number | null) => value === null ? "Нет данных" : value < 1.5 ? "ниже ожиданий" : value < 2.5 ? "соответствует ожиданиям" : "выше ожиданий";

export const blockAverage = (ratings: CompetencyRatingMap, block: CompetencyBlock) =>
  averageRatings(competencies.filter((competency) => competency.block === block).map((competency) => ratings[competency.id]));

export const corporateIndex = (ratings: CompetencyRatingMap) =>
  averageRatings(competencies.map((competency) => ratings[competency.id]));

export const gapForCompetency = (selfRating: Rating | undefined, managerRating: Rating | undefined) => {
  const selfScore = score(selfRating);
  const managerScore = score(managerRating);
  return selfScore === null || managerScore === null ? null : managerScore - selfScore;
};

export const employeeIndices = (self?: SelfReview, manager?: ManagerReview) => {
  const selfCorporate = self ? corporateIndex(self.competencyRatings) : null;
  const managerCorporate = manager ? corporateIndex(manager.competencyRatings) : null;
  const gaps = competencies.map((competency) => gapForCompetency(self?.competencyRatings[competency.id], manager?.competencyRatings[competency.id])).filter((value): value is number => value !== null);
  return {
    selfResult: self ? blockAverage(self.competencyRatings, "result") : null,
    selfTechnology: self ? blockAverage(self.competencyRatings, "technology") : null,
    selfTeam: self ? blockAverage(self.competencyRatings, "team") : null,
    selfLeadership: self ? blockAverage(self.competencyRatings, "leadership") : null,
    selfCorporate,
    managerResult: manager ? blockAverage(manager.competencyRatings, "result") : null,
    managerTechnology: manager ? blockAverage(manager.competencyRatings, "technology") : null,
    managerTeam: manager ? blockAverage(manager.competencyRatings, "team") : null,
    managerLeadership: manager ? blockAverage(manager.competencyRatings, "leadership") : null,
    managerCorporate,
    gap: gaps.length ? gaps.reduce((sum, value) => sum + Math.abs(value), 0) / gaps.length : null,
  };
};

export const competencyStats = (selfReviews: SelfReview[], managerReviews: ManagerReview[]) => competencies.map((competency) => {
  const selfRatings = selfReviews.map((review) => review.competencyRatings[competency.id]);
  const managerRatings = managerReviews.map((review) => review.competencyRatings[competency.id]);
  const gaps = managerReviews.map((manager) => {
    const self = selfReviews.find((review) => review.employeeId === manager.employeeId);
    return gapForCompetency(self?.competencyRatings[competency.id], manager.competencyRatings[competency.id]);
  }).filter((value): value is number => value !== null);
  return {
    competency,
    selfAvg: averageRatings(selfRatings),
    managerAvg: averageRatings(managerRatings),
    gap: gaps.length ? gaps.reduce((sum, value) => sum + Math.abs(value), 0) / gaps.length : null,
    selfBelow: selfRatings.filter((rating) => rating === "below").length,
    managerBelow: managerRatings.filter((rating) => rating === "below").length,
    selfAbove: selfRatings.filter((rating) => rating === "above").length,
    managerAbove: managerRatings.filter((rating) => rating === "above").length,
    noInfo: managerRatings.filter((rating) => rating === "no_info").length,
    notApplicable: [...selfRatings, ...managerRatings].filter((rating) => rating === "not_applicable").length,
  };
});

export const managerHints = (review: ManagerReview, self?: SelfReview) => {
  const hints: string[] = [];
  const ratings = competencies.map((competency) => review.competencyRatings[competency.id]);
  const noInfoCount = ratings.filter((rating) => rating === "no_info").length;
  const strongGaps = competencies.filter((competency) => {
    const gap = gapForCompetency(self?.competencyRatings[competency.id], review.competencyRatings[competency.id]);
    return gap !== null && Math.abs(gap) >= 2;
  });
  const selfHigher = competencies.filter((competency) => {
    const gap = gapForCompetency(self?.competencyRatings[competency.id], review.competencyRatings[competency.id]);
    return gap !== null && gap <= -1;
  });
  const managerHigher = competencies.filter((competency) => {
    const gap = gapForCompetency(self?.competencyRatings[competency.id], review.competencyRatings[competency.id]);
    return gap !== null && gap >= 1;
  });
  if (strongGaps.length) hints.push("Есть сильное расхождение с самооценкой. Рекомендуется обсудить это на встрече.");
  if (selfHigher.length > 1) hints.push("По нескольким компетенциям самооценка сотрудника выше оценки руководителя. Используйте это как тему для синхронизации ожиданий.");
  if (managerHigher.length) hints.push("Руководитель оценивает некоторые компетенции выше самооценки сотрудника. Это может быть ресурсом для поддерживающей обратной связи.");
  if (noInfoCount >= 3) hints.push("По нескольким компетенциям выбрано “нет информации”. Проверьте, достаточно ли данных для итоговой оценки.");
  if (review.category === "A" && !ratings.includes("above")) hints.push("Проверьте обоснованность категории A: по компетенциям не отмечено проявлений выше ожиданий.");
  if ((review.category === "C" || review.category === "D") && !ratings.includes("below")) hints.push("Проверьте согласованность оценки: категория ниже ожиданий, но по компетенциям нет зон ниже ожиданий.");
  if (self) {
    const leadership = competencies.filter((competency) => competency.block === "leadership");
    if (leadership.some((competency) => self.competencyRatings[competency.id] === "not_applicable" && !["", "not_applicable", "no_info"].includes(review.competencyRatings[competency.id] ?? ""))) hints.push("Сотрудник отметил лидерскую компетенцию как неактуальную, но руководитель её оценил. Возможно, стоит обсудить ожидания к роли.");
    if (leadership.some((competency) => self.competencyRatings[competency.id] && self.competencyRatings[competency.id] !== "not_applicable" && review.competencyRatings[competency.id] === "not_applicable")) hints.push("Сотрудник считает лидерскую компетенцию актуальной, а руководитель — нет. Возможно, стоит прояснить управленческую зону ответственности.");
  }
  return hints;
};
