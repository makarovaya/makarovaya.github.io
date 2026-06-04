import type { Skill } from "../types";

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
