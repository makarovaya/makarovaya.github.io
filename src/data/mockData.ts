import { competencies } from "./competencies";
import { skills } from "./skills";
import type { CompetencyRatingMap, Employee, ManagerReview, Rating, SelfReview } from "../types";

export { competencies, skills };

export const employees: Employee[] = [
  { id: "anna", fullName: "Анна Смирнова", position: "Бизнес-аналитик", department: "Цифровые продукты", grade: "Middle", isManager: false, managerId: "elena", avatarInitials: "АС" },
  { id: "boris", fullName: "Борис Кузнецов", position: "Руководитель проектов", department: "Трансформация бизнеса", grade: "Senior", isManager: false, managerId: "elena", avatarInitials: "БК" },
  { id: "elena", fullName: "Елена Волкова", position: "Руководитель направления", department: "Трансформация бизнеса", grade: "Head", isManager: true, managerId: "director", avatarInitials: "ЕВ" },
  { id: "maxim", fullName: "Максим Орлов", position: "Продуктовый аналитик", department: "Цифровые продукты", grade: "Junior", isManager: false, managerId: "elena", avatarInitials: "МО" },
];

export const emptyCompetencyRatings = (defaultValue: Rating = ""): CompetencyRatingMap =>
  Object.fromEntries(competencies.map((competency) => [competency.id, defaultValue]));

export const createEmptySelfReview = (employeeId: string): SelfReview => ({
  employeeId,
  status: "draft",
  accomplishments: [""],
  hardStrengths: [],
  hardDevelopment: [],
  competencyRatings: emptyCompetencyRatings(),
  leadershipNotApplicable: false,
  corporateStrengths: [],
  corporateDevelopment: [],
  developmentFocus: "",
  notes: "",
});

export const createEmptyManagerReview = (employeeId: string): ManagerReview => ({
  employeeId,
  status: "draft",
  category: "",
  competencyRatings: emptyCompetencyRatings(),
  hardStrengths: [],
  hardDevelopment: [],
  corporateStrengths: [],
  corporateDevelopment: [],
  strengthsText: "",
  developmentText: "",
  categoryRationale: "",
  agreedFocus: "",
  finalComment: "",
});

const ratings = (values: Partial<CompetencyRatingMap>): CompetencyRatingMap => {
  const next = emptyCompetencyRatings();
  Object.entries(values).forEach(([key, value]) => {
    if (value) next[key] = value;
  });
  return next;
};

export const initialSelfReviews: SelfReview[] = [
  createEmptySelfReview("anna"),
  {
    employeeId: "boris",
    status: "submitted",
    accomplishments: ["Запустил единый трекер портфеля проектов для трёх бизнес-направлений.", "Сократил срок согласования проектных решений на 20%."],
    hardStrengths: ["projects", "stakeholders", "facilitation"],
    hardDevelopment: ["bi", "finance"],
    competencyRatings: ratings({
      "result.createBestExperience": "meets",
      "result.findNewMeanings": "above",
      "result.makeComplexDecisions": "above",
      "technology.implementTechnologies": "meets",
      "technology.useProductThinking": "meets",
      "technology.workWithData": "below",
      "team.collaborate": "above",
      "team.takeResponsibility": "above",
      "team.developSelfAndOthers": "meets",
      "leadership.thinkTomorrow": "not_applicable",
      "leadership.manageTeamPotential": "not_applicable",
      "leadership.leadChanges": "not_applicable",
    }),
    leadershipNotApplicable: true,
    corporateStrengths: ["result.makeComplexDecisions", "team.collaborate", "team.takeResponsibility"],
    corporateDevelopment: ["technology.workWithData"],
    developmentFocus: "Усилить работу с BI-инструментами и перейти к управлению портфелем на основе метрик.",
    notes: "Хочу обсудить участие в программе развития руководителей.",
  },
  {
    employeeId: "elena",
    status: "submitted",
    accomplishments: ["Перестроила процесс приоритизации инициатив направления.", "Сформировала две продуктовые команды и делегировала владельцам продуктов ключевые решения."],
    hardStrengths: ["change", "projects", "stakeholders"],
    hardDevelopment: ["finance"],
    competencyRatings: ratings({
      "result.createBestExperience": "meets",
      "result.findNewMeanings": "above",
      "result.makeComplexDecisions": "above",
      "technology.implementTechnologies": "meets",
      "technology.useProductThinking": "above",
      "technology.workWithData": "meets",
      "team.collaborate": "above",
      "team.takeResponsibility": "above",
      "team.developSelfAndOthers": "above",
      "leadership.thinkTomorrow": "above",
      "leadership.manageTeamPotential": "above",
      "leadership.leadChanges": "meets",
    }),
    leadershipNotApplicable: false,
    corporateStrengths: ["leadership.manageTeamPotential", "leadership.thinkTomorrow", "team.takeResponsibility"],
    corporateDevelopment: ["technology.workWithData"],
    developmentFocus: "Повысить прозрачность экономики продуктовых инициатив.",
    notes: "",
  },
  {
    employeeId: "maxim",
    status: "draft",
    accomplishments: ["Подготовил дашборд продуктовых метрик."],
    hardStrengths: ["data", "sql"],
    hardDevelopment: [],
    competencyRatings: ratings({
      "technology.workWithData": "above",
      "team.collaborate": "meets",
      "leadership.thinkTomorrow": "not_applicable",
      "leadership.manageTeamPotential": "not_applicable",
      "leadership.leadChanges": "not_applicable",
    }),
    leadershipNotApplicable: true,
    corporateStrengths: ["technology.workWithData"],
    corporateDevelopment: [],
    developmentFocus: "",
    notes: "",
  },
];

export const initialManagerReviews: ManagerReview[] = [
  {
    employeeId: "boris",
    status: "completed",
    category: "B",
    competencyRatings: ratings({
      "result.createBestExperience": "meets",
      "result.findNewMeanings": "meets",
      "result.makeComplexDecisions": "above",
      "technology.implementTechnologies": "meets",
      "technology.useProductThinking": "meets",
      "technology.workWithData": "below",
      "team.collaborate": "above",
      "team.takeResponsibility": "above",
      "team.developSelfAndOthers": "meets",
      "leadership.thinkTomorrow": "not_applicable",
      "leadership.manageTeamPotential": "not_applicable",
      "leadership.leadChanges": "not_applicable",
    }),
    hardStrengths: ["projects", "stakeholders", "facilitation"],
    hardDevelopment: ["bi"],
    corporateStrengths: ["result.makeComplexDecisions", "team.collaborate", "team.takeResponsibility"],
    corporateDevelopment: ["technology.workWithData"],
    strengthsText: "Борис уверенно ведёт сложные проекты и создаёт рабочие договорённости между командами.",
    developmentText: "Следующий шаг — усилить работу с BI-инструментами и метриками портфеля.",
    categoryRationale: "Категория B отражает устойчивый результат выше ожиданий по ключевым проектам и сильное межфункциональное взаимодействие.",
    agreedFocus: "Усилить работу с BI-инструментами и перейти к управлению портфелем на основе метрик.",
    finalComment: "За период Борис заметно повысил прозрачность проектного портфеля. На следующем цикле важно закрепить результат через метрики и масштабирование практики.",
  },
  {
    employeeId: "elena",
    status: "draft",
    category: "A",
    competencyRatings: ratings({
      "result.createBestExperience": "meets",
      "result.findNewMeanings": "above",
      "result.makeComplexDecisions": "above",
      "technology.implementTechnologies": "meets",
      "technology.useProductThinking": "above",
      "technology.workWithData": "no_info",
      "team.collaborate": "above",
      "team.takeResponsibility": "above",
      "team.developSelfAndOthers": "above",
      "leadership.thinkTomorrow": "above",
      "leadership.manageTeamPotential": "above",
      "leadership.leadChanges": "meets",
    }),
    hardStrengths: ["change", "projects"],
    hardDevelopment: ["finance"],
    corporateStrengths: ["leadership.manageTeamPotential", "leadership.thinkTomorrow"],
    corporateDevelopment: ["technology.workWithData"],
    strengthsText: "",
    developmentText: "",
    categoryRationale: "",
    agreedFocus: "Повысить прозрачность экономики продуктовых инициатив.",
    finalComment: "",
  },
];
