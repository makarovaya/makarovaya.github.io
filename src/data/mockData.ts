import type { Competency, Employee, ManagerReview, SelfReview, Skill } from "../types";

export const employees: Employee[] = [
  { id: "anna", fullName: "Анна Смирнова", position: "Бизнес-аналитик", department: "Цифровые продукты", grade: "Middle", isManager: false, managerId: "elena", avatarInitials: "АС" },
  { id: "boris", fullName: "Борис Кузнецов", position: "Руководитель проектов", department: "Трансформация бизнеса", grade: "Senior", isManager: false, managerId: "elena", avatarInitials: "БК" },
  { id: "elena", fullName: "Елена Волкова", position: "Руководитель направления", department: "Трансформация бизнеса", grade: "Head", isManager: true, managerId: "director", avatarInitials: "ЕВ" },
  { id: "maxim", fullName: "Максим Орлов", position: "Продуктовый аналитик", department: "Цифровые продукты", grade: "Junior", isManager: false, managerId: "elena", avatarInitials: "МО" },
];

export const skills: Skill[] = [
  ["data", "Анализ данных", "analytics"], ["visualization", "Визуализация данных", "analytics"],
  ["customer", "Работа с заказчиком", "communication"], ["projects", "Управление проектами", "project"],
  ["product", "Продуктовое мышление", "professional"], ["automation", "Автоматизация процессов", "digital"],
  ["presentations", "Подготовка презентаций", "communication"], ["finance", "Финансовое моделирование", "professional"],
  ["contracts", "Договорная работа", "professional"], ["change", "Управление изменениями", "management"],
  ["facilitation", "Фасилитация встреч", "communication"], ["risks", "Работа с рисками", "project"],
  ["methodology", "Разработка методологии", "professional"], ["processes", "Настройка бизнес-процессов", "professional"],
  ["ux", "Исследование пользовательского опыта", "professional"], ["bi", "Работа с BI-инструментами", "digital"],
  ["python", "Python", "digital"], ["sql", "SQL", "digital"], ["excel", "Excel", "digital"],
  ["powerpoint", "PowerPoint", "digital"], ["stakeholders", "Коммуникация со стейкхолдерами", "communication"],
].map(([id, title, category]) => ({ id, title, category, source: "dictionary" })) as Skill[];

export const competencies: Competency[] = [
  ["client", "result", "Создаёт лучший опыт", "Превосходит ожидания клиента и формирует лучшие решения для него.", ["Выявляет ценности и интересы клиента", "Проявляет эмпатию", "Предлагает решения, превосходящие ожидания"], "all"],
  ["meaning", "result", "Ищет новые смыслы", "Открыт к новому, переосмысляет опыт и предлагает нестандартные решения.", ["Ставит под сомнение устоявшиеся подходы", "Идёт на эксперименты", "Предлагает нестандартные решения"], "all"],
  ["decisions", "result", "Принимает комплексные решения", "Анализирует разные сценарии и решительно действует для достижения результата.", ["Критически оценивает информацию", "Учитывает разные сценарии", "Переходит от решения к действиям"], "all"],
  ["technology", "technology", "Внедряет технологии", "Оценивает применимость технологий и использует инновации в работе.", ["Ориентируется в инструментах", "Оценивает эффект внедрения", "Тестирует инновации"], "all"],
  ["product", "technology", "Использует продуктовое мышление", "Связывает метрики с ценностью для клиента и использует обратную связь.", ["Трансформирует потребности в продукты", "Работает с метриками ценности", "Проверяет гипотезы"], "all"],
  ["data", "technology", "Работает с данными", "Собирает, анализирует и визуализирует данные, принимает решения на их основе.", ["Соблюдает правила безопасности", "Применяет инструменты аналитики", "Делает выводы на основе данных"], "all"],
  ["collaboration", "team", "Сотрудничает с коллегами", "Выстраивает доверительные отношения и активно взаимодействует с другими командами.", ["Строит партнёрские отношения", "Работает кросс-функционально", "Уважительно договаривается"], "all"],
  ["ownership", "team", "Берёт ответственность", "Вносит вклад в общие цели, выполняет обещания и поддерживает коллег.", ["Помогает коллегам", "Планирует приоритеты", "Отвечает за результат"], "all"],
  ["growth", "team", "Развивается и развивает", "Запрашивает обратную связь, растёт над собой и делится опытом.", ["Знает зоны развития", "Запрашивает обратную связь", "Делится опытом"], "all"],
  ["future", "leadership", "Мыслит завтрашним днём", "Учитывает глобальные тренды и перспективу будущего.", ["Отслеживает тренды", "Смотрит шире задачи", "Учитывает стратегию компании"], "managers"],
  ["potential", "leadership", "Управляет потенциалом команды", "Формирует сильную команду, делегирует и раскрывает потенциал людей.", ["Формирует команду профессионалов", "Делегирует ответственность", "Поддерживает честную среду"], "managers"],
  ["leadership", "leadership", "Ведёт за собой", "Создаёт ясное направление и помогает команде двигаться к результату.", ["Формулирует направление", "Вовлекает команду", "Поддерживает в изменениях"], "managers"],
].map(([id, block, title, description, indicators, applicableTo]) => ({ id, block, title, description, indicators, applicableTo })) as Competency[];

export const createEmptySelfReview = (employeeId: string): SelfReview => ({
  employeeId, status: "draft", accomplishments: [""], hardStrengths: [], hardDevelopment: [],
  corporateStrengths: [], corporateDevelopment: [], developmentFocus: "", notes: "",
});

export const createEmptyManagerReview = (employeeId: string): ManagerReview => ({
  employeeId, status: "draft", category: "", hardRating: "", resultRating: "", technologyRating: "",
  teamRating: "", leadershipRating: "", hardStrengths: [], hardDevelopment: [], corporateStrengths: [],
  corporateDevelopment: [], strengthsText: "", developmentText: "", categoryRationale: "",
  agreedFocus: "", finalComment: "",
});

export const initialSelfReviews: SelfReview[] = [
  createEmptySelfReview("anna"),
  { employeeId: "boris", status: "submitted", accomplishments: ["Запустил единый трекер портфеля проектов для трёх бизнес-направлений.", "Сократил срок согласования проектных решений на 20%."], hardStrengths: ["projects", "stakeholders", "facilitation"], hardDevelopment: ["bi", "finance"], corporateStrengths: ["ownership", "collaboration", "decisions"], corporateDevelopment: ["technology"], developmentFocus: "Усилить работу с BI-инструментами и перейти к управлению портфелем на основе метрик.", notes: "Хочу обсудить участие в программе развития руководителей." },
  { employeeId: "elena", status: "submitted", accomplishments: ["Перестроила процесс приоритизации инициатив направления.", "Сформировала две продуктовые команды и делегировала владельцам продуктов ключевые решения."], hardStrengths: ["change", "projects", "stakeholders"], hardDevelopment: ["finance"], corporateStrengths: ["potential", "future", "ownership"], corporateDevelopment: ["data"], developmentFocus: "Повысить прозрачность экономики продуктовых инициатив.", notes: "" },
  { employeeId: "maxim", status: "draft", accomplishments: ["Подготовил дашборд продуктовых метрик."], hardStrengths: ["data", "sql"], hardDevelopment: [], corporateStrengths: ["data"], corporateDevelopment: [], developmentFocus: "", notes: "" },
];

export const initialManagerReviews: ManagerReview[] = [
  { employeeId: "boris", status: "completed", category: "B", hardRating: "above", resultRating: "above", technologyRating: "meets", teamRating: "above", leadershipRating: "no_info", hardStrengths: ["projects", "stakeholders", "facilitation"], hardDevelopment: ["bi"], corporateStrengths: ["ownership", "collaboration", "decisions"], corporateDevelopment: ["technology"], strengthsText: "Борис уверенно ведёт сложные проекты и создаёт рабочие договорённости между командами.", developmentText: "Следующий шаг — усилить работу с BI-инструментами и метриками портфеля.", categoryRationale: "Категория B отражает устойчивый результат выше ожиданий по ключевым проектам и сильное межфункциональное взаимодействие.", agreedFocus: "Усилить работу с BI-инструментами и перейти к управлению портфелем на основе метрик.", finalComment: "За период Борис заметно повысил прозрачность проектного портфеля. На следующем цикле важно закрепить результат через метрики и масштабирование практики." },
  { employeeId: "elena", status: "draft", category: "A", hardRating: "above", resultRating: "above", technologyRating: "meets", teamRating: "above", leadershipRating: "above", hardStrengths: ["change", "projects"], hardDevelopment: ["finance"], corporateStrengths: ["potential", "future"], corporateDevelopment: ["data"], strengthsText: "", developmentText: "", categoryRationale: "", agreedFocus: "Повысить прозрачность экономики продуктовых инициатив.", finalComment: "" },
];
