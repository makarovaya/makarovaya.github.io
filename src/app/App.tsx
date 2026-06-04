import { useMemo, useState, type ReactNode } from "react";
import { competencies, createEmptyManagerReview, createEmptySelfReview, employees, skills } from "../data/mockData";
import { loadState, resetState, saveManagerReviews, saveRole, saveSelectedEmployee, saveSelfReviews } from "../store/localStorageStore";
import type { Competency, Employee, ManagerReview, Rating, Role, SelfReview } from "../types";
import { corporateIndex, formatIndex, indexLabel, managerHints, ratingLabel, score } from "../utils/calculations";
import { generateFeedbackDraft } from "../utils/feedbackDraft";
import { validateManager, validateSelf } from "../utils/validation";

const initial = loadState();
const roleOptions: { value: Role; label: string }[] = [{ value: "employee", label: "Я сотрудник" }, { value: "manager", label: "Я руководитель" }, { value: "analytics", label: "Аналитика HR" }];
const blockNames = { result: "Результат", technology: "Технологии", team: "Команда", leadership: "Лидерство" };
const ratingOptions: { value: Rating; label: string }[] = [{ value: "below", label: "Ниже ожиданий" }, { value: "meets", label: "Соответствует" }, { value: "above", label: "Выше ожиданий" }, { value: "no_info", label: "Нет данных" }];
const categoryOptions = ["A", "B", "C", "D"] as const;

const getEmployee = (id: string) => employees.find((employee) => employee.id === id) ?? employees[0];
const itemTitle = (id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return skills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
};
const toggle = (items: string[], id: string) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

function Button({ children, variant = "primary", onClick, type = "button", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return <button className={`button button--${variant}`} onClick={onClick} type={type} disabled={disabled}>{children}</button>;
}

function Card({ title, eyebrow, description, children, className = "" }: { title?: string; eyebrow?: string; description?: string; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>
    {(title || eyebrow || description) && <div className="card__head">{eyebrow && <div className="eyebrow">{eyebrow}</div>}{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>}
    {children}
  </section>;
}

function Badge({ status }: { status: "draft" | "submitted" | "completed" }) {
  const text = { draft: "Черновик", submitted: "Самооценка отправлена", completed: "Оценка завершена" }[status];
  return <span className={`badge badge--${status}`}>{text}</span>;
}

function Segmented<T extends string>({ value, options, onChange, compact = false }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; compact?: boolean }) {
  return <div className={`segmented ${compact ? "segmented--compact" : ""}`}>{options.map((option) => <button type="button" key={option.value} className={value === option.value ? "is-active" : ""} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

function Textarea({ label, value, onChange, maxLength = 1000, hint, required = false, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; hint?: string; required?: boolean; rows?: number }) {
  return <label className="field"><span className="field__label">{label}{required && <b>*</b>}</span>{hint && <span className="field__hint">{hint}</span>}<textarea rows={rows} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} /><span className="field__count">{value.length} / {maxLength}</span></label>;
}

function Tag({ children, selected = false, tone = "default", onClick }: { children: ReactNode; selected?: boolean; tone?: string; onClick?: () => void }) {
  return <button type="button" className={`tag tag--${tone} ${selected ? "is-selected" : ""}`} onClick={onClick}>{children}</button>;
}

function SkillPicker({ selected, onChange, tone, exclude = [] }: { selected: string[]; onChange: (items: string[]) => void; tone: string; exclude?: string[] }) {
  const [query, setQuery] = useState("");
  const visible = skills.filter((item) => !exclude.includes(item.id) && item.title.toLowerCase().includes(query.toLowerCase()));
  const addCustom = () => {
    const title = query.trim();
    if (!title) return;
    const id = `custom:${title}`;
    if (!selected.includes(id)) onChange([...selected, id]);
    setQuery("");
  };
  return <div className="picker">
    <div className="picker__selected">{selected.map((id) => <Tag key={id} selected tone={tone} onClick={() => onChange(selected.filter((item) => item !== id))}>{itemTitle(id)} <span>×</span></Tag>)}</div>
    <div className="picker__search"><input value={query} placeholder="Найти навык или добавить свой" onChange={(event) => setQuery(event.target.value)} /><Button variant="secondary" onClick={addCustom}>Добавить свой</Button></div>
    <div className="picker__options">{visible.slice(0, query ? 8 : 12).map((item) => <Tag key={item.id} selected={selected.includes(item.id)} tone={tone} onClick={() => onChange(toggle(selected, item.id))}>{item.title}</Tag>)}</div>
  </div>;
}

function CompetencyPicker({ employee, selected, onChange, tone, exclude = [] }: { employee: Employee; selected: string[]; onChange: (items: string[]) => void; tone: string; exclude?: string[] }) {
  const available = competencies.filter((item) => item.applicableTo === "all" || employee.isManager);
  return <div className="competency-list">{Object.entries(blockNames).map(([block, title]) => {
    const items = available.filter((item) => item.block === block && !exclude.includes(item.id));
    if (!items.length) return null;
    return <div key={block}><h4>{title}</h4><div className="picker__options">{items.map((item) => <Tag key={item.id} selected={selected.includes(item.id)} tone={tone} onClick={() => onChange(toggle(selected, item.id))}>{item.title}</Tag>)}</div></div>;
  })}</div>;
}

function Accordion({ item }: { item: Competency }) {
  return <details className="accordion"><summary>{item.title}<span>Подробнее</span></summary><p>{item.description}</p><ul>{item.indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}</ul></details>;
}

function Avatar({ employee }: { employee: Employee }) {
  return <div className="avatar">{employee.avatarInitials}</div>;
}

function Toast({ message }: { message: string }) {
  return message ? <div className="toast">{message}</div> : null;
}

export function App() {
  const [role, setRole] = useState<Role>(initial.role);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initial.selectedEmployeeId);
  const [selfReviews, setSelfReviews] = useState(initial.selfReviews);
  const [managerReviews, setManagerReviews] = useState(initial.managerReviews);
  const [toast, setToast] = useState("");
  const [managerOpen, setManagerOpen] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const changeRole = (next: Role) => { setRole(next); saveRole(next); setManagerOpen(null); };
  const selectEmployee = (id: string) => { setSelectedEmployeeId(id); saveSelectedEmployee(id); };
  const updateSelf = (review: SelfReview) => {
    const next = selfReviews.some((item) => item.employeeId === review.employeeId) ? selfReviews.map((item) => item.employeeId === review.employeeId ? review : item) : [...selfReviews, review];
    setSelfReviews(next); saveSelfReviews(next);
  };
  const updateManager = (review: ManagerReview) => {
    const next = managerReviews.some((item) => item.employeeId === review.employeeId) ? managerReviews.map((item) => item.employeeId === review.employeeId ? review : item) : [...managerReviews, review];
    setManagerReviews(next); saveManagerReviews(next);
  };
  const reset = () => { resetState(); window.location.reload(); };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ selfReviews, managerReviews }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "performance-review-demo.json"; link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="app">
    <header className="topbar">
      <div className="brand"><span className="brand__mark">РТК</span><div><strong>Performance Review</strong><span>Оценка компетенций · 2026</span></div></div>
      <Segmented value={role} options={roleOptions} onChange={changeRole} />
      <div className="topbar__actions"><Button variant="ghost" onClick={exportJson}>Экспорт JSON</Button><Button variant="ghost" onClick={reset}>Сбросить демо-данные</Button></div>
    </header>
    <main>
      {role === "employee" && <EmployeeMode employee={getEmployee(selectedEmployeeId)} selectedId={selectedEmployeeId} onSelect={selectEmployee} selfReviews={selfReviews} managerReviews={managerReviews} onUpdate={updateSelf} notify={notify} />}
      {role === "manager" && (managerOpen ? <ManagerReviewPage employee={getEmployee(managerOpen)} selfReview={selfReviews.find((item) => item.employeeId === managerOpen) ?? createEmptySelfReview(managerOpen)} review={managerReviews.find((item) => item.employeeId === managerOpen) ?? createEmptyManagerReview(managerOpen)} onUpdate={updateManager} onBack={() => setManagerOpen(null)} notify={notify} onComplete={() => setModal(true)} /> : <ManagerDashboard selfReviews={selfReviews} managerReviews={managerReviews} onOpen={setManagerOpen} />)}
      {role === "analytics" && <Analytics selfReviews={selfReviews} managerReviews={managerReviews} />}
    </main>
    <Toast message={toast} />
    {modal && <div className="modal-backdrop"><div className="modal"><div className="modal__icon">✓</div><h2>Оценка завершена</h2><p>Сотрудник сможет увидеть итоговую обратную связь после закрытия этапа.</p><Button onClick={() => { setModal(false); setManagerOpen(null); }}>Вернуться к списку</Button></div></div>}
  </div>;
}

function EmployeeMode({ employee, selectedId, onSelect, selfReviews, managerReviews, onUpdate, notify }: { employee: Employee; selectedId: string; onSelect: (id: string) => void; selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onUpdate: (review: SelfReview) => void; notify: (message: string) => void }) {
  const review = selfReviews.find((item) => item.employeeId === employee.id) ?? createEmptySelfReview(employee.id);
  const managerReview = managerReviews.find((item) => item.employeeId === employee.id);
  return <div className="page">
    <div className="page-header">
      <div><div className="eyebrow">Режим сотрудника</div><h1>Моя оценка компетенций</h1><p>Пройдите самооценку и подготовьтесь к разговору с руководителем.</p></div>
      <label className="demo-user"><span>Демо-профиль</span><select value={selectedId} onChange={(event) => onSelect(event.target.value)}>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
    </div>
    {managerReview?.status === "completed" ? <EmployeeResult employee={employee} review={managerReview} /> : <SelfReviewEditor employee={employee} review={review} onUpdate={onUpdate} notify={notify} />}
  </div>;
}

function SelfReviewEditor({ employee, review, onUpdate, notify }: { employee: Employee; review: SelfReview; onUpdate: (review: SelfReview) => void; notify: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SelfReview>(key: K, value: SelfReview[K]) => onUpdate({ ...review, [key]: value });
  const fillDemo = () => onUpdate({ employeeId: employee.id, status: "draft", accomplishments: ["Подготовил и внедрил новый подход к приоритизации задач.", "Автоматизировал регулярную отчётность для команды."], hardStrengths: ["data", "stakeholders"], hardDevelopment: ["presentations"], corporateStrengths: ["ownership", "collaboration"], corporateDevelopment: ["technology"], developmentFocus: "Научиться быстрее проверять гипотезы с помощью цифровых инструментов.", notes: "Хочу обсудить участие в кросс-функциональном проекте." });
  const save = () => { setSaving(true); window.setTimeout(() => { onUpdate(review); setSaving(false); notify("Черновик сохранён"); }, 400); };
  const submit = () => {
    const nextErrors = validateSelf(review); setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...review, status: "submitted" }); notify("Самооценка отправлена"); }
  };
  if (review.status === "submitted") return <Card className="success-state"><div className="success-state__icon">✓</div><Badge status="submitted" /><h2>Самооценка отправлена руководителю</h2><p>Данные сохранены. После завершения оценки руководителем здесь появится итоговая обратная связь.</p></Card>;
  return <>
    <Card className="intro-card"><div className="intro-card__row"><div><Badge status={review.status} /><h2>Самооценка за 2026 год</h2><p>Самооценка поможет зафиксировать результаты, сильные стороны и зоны развития. Она не рассчитывает итоговую категорию автоматически.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
    <div className="stepper">{["Результаты", "Hard skills", "Компетенции", "Фокус развития"].map((title, index) => <button type="button" className={index === step ? "is-active" : index < step ? "is-done" : ""} key={title} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span>{title}</button>)}</div>
    {errors.length > 0 && <div className="error-box"><strong>Проверьте обязательные поля</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    {step === 0 && <Card title="Ключевые результаты" eyebrow="Шаг 1 из 4" description="Добавьте 1–3 результата, которыми вы хотите поделиться на встрече.">
      {review.accomplishments.map((value, index) => <div className="result-row" key={index}><span>{index + 1}</span><textarea value={value} maxLength={500} rows={3} placeholder="Опишите результат и его эффект" onChange={(event) => set("accomplishments", review.accomplishments.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />{review.accomplishments.length > 1 && <button type="button" onClick={() => set("accomplishments", review.accomplishments.filter((_, itemIndex) => itemIndex !== index))}>×</button>}</div>)}
      {review.accomplishments.length < 3 && <Button variant="secondary" onClick={() => set("accomplishments", [...review.accomplishments, ""])}>+ Добавить результат</Button>}
    </Card>}
    {step === 1 && <Card title="Профессиональные навыки" eyebrow="Шаг 2 из 4" description="Выберите навыки, знания или инструменты, которые помогли вам в работе, и те, которые стоит развить.">
      <div className="subsection"><h3>Что помогло в работе</h3><SkillPicker selected={review.hardStrengths} onChange={(items) => set("hardStrengths", items)} tone="strength" exclude={review.hardDevelopment} /></div>
      <div className="subsection"><h3>Что стоит развивать</h3><SkillPicker selected={review.hardDevelopment} onChange={(items) => set("hardDevelopment", items)} tone="development" exclude={review.hardStrengths} /></div>
    </Card>}
    {step === 2 && <Card title="Корпоративные компетенции" eyebrow="Шаг 3 из 4" description="Выберите проявления, которые лучше всего описывают ваши сильные стороны и зоны развития.">
      <div className="subsection"><h3>Сильные стороны <small>выберите минимум 2</small></h3><CompetencyPicker employee={employee} selected={review.corporateStrengths} onChange={(items) => set("corporateStrengths", items)} tone="strength" exclude={review.corporateDevelopment} /></div>
      <div className="subsection"><h3>Зоны развития <small>выберите минимум 1</small></h3><CompetencyPicker employee={employee} selected={review.corporateDevelopment} onChange={(items) => set("corporateDevelopment", items)} tone="development" exclude={review.corporateStrengths} /></div>
      <div className="accordions"><h3>Подробное описание модели</h3>{competencies.filter((item) => item.applicableTo === "all" || employee.isManager).map((item) => <Accordion key={item.id} item={item} />)}</div>
    </Card>}
    {step === 3 && <Card title="Фокус развития" eyebrow="Шаг 4 из 4" description="Сформулируйте один главный фокус развития на следующий период.">
      <Textarea required label="Главный фокус развития" value={review.developmentFocus} onChange={(value) => set("developmentFocus", value)} maxLength={700} hint="Что вы хотите усилить и какой результат это даст?" />
      <Textarea label="Дополнительный комментарий" value={review.notes} onChange={(value) => set("notes", value)} maxLength={700} hint="Необязательное поле: вопросы или темы для обсуждения." />
    </Card>}
    <div className="form-footer"><Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</Button><div>{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}{step < 3 ? <Button onClick={() => setStep(step + 1)}>Продолжить</Button> : <Button onClick={submit}>Отправить руководителю</Button>}</div></div>
  </>;
}

function EmployeeResult({ employee, review }: { employee: Employee; review: ManagerReview }) {
  const [showBlocks, setShowBlocks] = useState(false);
  return <><Card className="result-hero"><div><div className="eyebrow">Итоговая обратная связь</div><h2>{employee.fullName}, оценка завершена</h2><p>Обсудите результат с руководителем и зафиксируйте фокус на следующий период.</p></div><div className="category"><span>Итоговая категория</span><strong>{review.category}</strong></div></Card>
    <div className="result-grid"><Card title="Сильные стороны"><p className="feedback">{review.strengthsText}</p></Card><Card title="Зоны развития"><p className="feedback">{review.developmentText}</p></Card><Card title="Согласованный фокус развития"><p className="feedback">{review.agreedFocus}</p></Card><Card title="Комментарий руководителя"><p className="feedback">{review.finalComment}</p></Card></div>
    <Card><label className="switch"><input type="checkbox" checked={showBlocks} onChange={(event) => setShowBlocks(event.target.checked)} /><span />Показать экспериментально оценки по блокам</label>{showBlocks && <div className="rating-summary">{[["Hard skills", review.hardRating], ["Результат", review.resultRating], ["Технологии", review.technologyRating], ["Команда", review.teamRating]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{ratingLabel[value as Rating]}</strong></div>)}</div>}</Card></>;
}

function ManagerDashboard({ selfReviews, managerReviews, onOpen }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onOpen: (id: string) => void }) {
  return <div className="page"><div className="page-header"><div><div className="eyebrow">Режим руководителя</div><h1>Команда · Performance review</h1><p>Отслеживайте прогресс и переходите к оценке сотрудников.</p></div><div className="deadline"><span>Завершить до</span><strong>30 июня 2026</strong></div></div>
    <div className="stats"><Card><b>{employees.length}</b><span>сотрудника в команде</span></Card><Card><b>{selfReviews.filter((item) => item.status === "submitted").length}</b><span>самооценки отправлено</span></Card><Card><b>{managerReviews.filter((item) => item.status === "completed").length}</b><span>оценок завершено</span></Card></div>
    <div className="employee-grid">{employees.map((employee) => {
      const self = selfReviews.find((item) => item.employeeId === employee.id); const manager = managerReviews.find((item) => item.employeeId === employee.id);
      const status = manager?.status === "completed" ? "completed" : self?.status === "submitted" ? "submitted" : "draft";
      return <Card key={employee.id} className="employee-card"><div className="employee-card__top"><Avatar employee={employee} /><Badge status={status} /></div><h3>{employee.fullName}</h3><p>{employee.position}</p><span>{employee.department}</span><Button variant={self?.status === "submitted" ? "primary" : "secondary"} onClick={() => onOpen(employee.id)}>{manager?.status === "completed" ? "Посмотреть оценку" : self?.status === "submitted" ? "Открыть оценку" : "Открыть карточку"}</Button></Card>;
    })}</div>
  </div>;
}

function ManagerReviewPage({ employee, selfReview, review, onUpdate, onBack, notify, onComplete }: { employee: Employee; selfReview: SelfReview; review: ManagerReview; onUpdate: (review: ManagerReview) => void; onBack: () => void; notify: (message: string) => void; onComplete: () => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof ManagerReview>(key: K, value: ManagerReview[K]) => onUpdate({ ...review, [key]: value });
  const setWithDraft = (changes: Partial<ManagerReview>) => { const next = { ...review, ...changes }; onUpdate({ ...next, ...generateFeedbackDraft(next) }); };
  const hints = managerHints(review, selfReview.corporateStrengths);
  const index = corporateIndex(review);
  const fillDemo = () => { const next = { ...review, category: "B" as const, hardRating: "above" as const, resultRating: "above" as const, technologyRating: "meets" as const, teamRating: "above" as const, leadershipRating: employee.isManager ? "meets" as const : "no_info" as const, hardStrengths: selfReview.hardStrengths.length ? selfReview.hardStrengths : ["data"], hardDevelopment: selfReview.hardDevelopment.length ? selfReview.hardDevelopment : ["presentations"], corporateStrengths: selfReview.corporateStrengths.length ? selfReview.corporateStrengths : ["ownership"], corporateDevelopment: selfReview.corporateDevelopment.length ? selfReview.corporateDevelopment : ["technology"], categoryRationale: "Категория отражает устойчивый результат и проявления компетенций на уровне ожиданий или выше.", agreedFocus: selfReview.developmentFocus || "Усилить использование цифровых инструментов и метрик в работе.", finalComment: "Сотрудник стабильно достигает результата и конструктивно взаимодействует с командой. В следующем периоде важно закрепить эффект через выбранный фокус развития." }; onUpdate({ ...next, ...generateFeedbackDraft(next) }); };
  const complete = () => { const nextErrors = validateManager(review, employee); setErrors(nextErrors); if (!nextErrors.length) { onUpdate({ ...review, status: "completed" }); notify("Оценка руководителя завершена"); onComplete(); } };
  return <div className="manager-page">
    <div className="manager-header"><Button variant="ghost" onClick={onBack}>← Вернуться к списку</Button><div><h1>{employee.fullName}</h1><p>{employee.position} · {employee.department}</p></div><Badge status={review.status} /></div>
    {errors.length > 0 && <div className="error-box error-box--floating"><strong>Не хватает данных для завершения</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    <div className="split">
      <aside className="split__left">
        <div className="panel-title"><div><div className="eyebrow">Самооценка сотрудника</div><h2>Контекст для оценки</h2></div><Badge status={selfReview.status} /></div>
        {selfReview.status === "draft" && <div className="empty-note">Самооценка ещё не отправлена. Можно открыть карточку, но завершать оценку лучше после получения контекста.</div>}
        <SummaryTags title="Ключевые результаты" items={selfReview.accomplishments.filter(Boolean)} />
        <SummaryTags title="Hard skills · сильные стороны" items={selfReview.hardStrengths.map(itemTitle)} tone="strength" />
        <SummaryTags title="Hard skills · развитие" items={selfReview.hardDevelopment.map(itemTitle)} tone="development" />
        <SummaryTags title="Компетенции · сильные стороны" items={selfReview.corporateStrengths.map(itemTitle)} tone="strength" />
        <SummaryTags title="Компетенции · развитие" items={selfReview.corporateDevelopment.map(itemTitle)} tone="development" />
        {selfReview.developmentFocus && <SummaryTags title="Фокус развития" items={[selfReview.developmentFocus]} />}
      </aside>
      <section className="split__right">
        <Card className="manager-intro"><div className="intro-card__row"><div><div className="eyebrow">Управленческая оценка</div><h2>Оценка блоков и итоговая обратная связь</h2><p>Используйте самооценку как контекст: подтвердите выбор сотрудника, скорректируйте его или добавьте свои наблюдения.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
        <Card title="Итоговая категория" description="Категория не рассчитывается автоматически из компетенций. Выберите её на основе результата за период.">
          <Segmented value={review.category} options={categoryOptions.map((value) => ({ value, label: value }))} onChange={(value) => set("category", value)} compact />
        </Card>
        <Card title="Оценка укрупнённых блоков" description="Не оценивайте каждую компетенцию отдельно: выберите уровень проявления для каждого блока.">
          <div className="rating-grid"><RatingRow label="Hard skills" value={review.hardRating} onChange={(value) => set("hardRating", value)} /><RatingRow label="Результат" value={review.resultRating} onChange={(value) => set("resultRating", value)} /><RatingRow label="Технологии" value={review.technologyRating} onChange={(value) => set("technologyRating", value)} /><RatingRow label="Команда" value={review.teamRating} onChange={(value) => set("teamRating", value)} />{employee.isManager && <RatingRow label="Лидерство" value={review.leadershipRating} onChange={(value) => set("leadershipRating", value)} />}</div>
        </Card>
        <Card title="Профессиональные навыки" description="Быстро подтвердите выбор сотрудника или добавьте свои наблюдения.">
          <QuickCopy label="Подтвердить сильные стороны из самооценки" onClick={() => setWithDraft({ hardStrengths: [...new Set([...review.hardStrengths, ...selfReview.hardStrengths])] })} /><SkillPicker selected={review.hardStrengths} onChange={(items) => setWithDraft({ hardStrengths: items })} tone="manager-strength" exclude={review.hardDevelopment} />
          <div className="divider" /><QuickCopy label="Подтвердить зоны развития из самооценки" onClick={() => setWithDraft({ hardDevelopment: [...new Set([...review.hardDevelopment, ...selfReview.hardDevelopment])] })} /><SkillPicker selected={review.hardDevelopment} onChange={(items) => setWithDraft({ hardDevelopment: items })} tone="manager-development" exclude={review.hardStrengths} />
        </Card>
        <Card title="Корпоративные компетенции" description="Выберите конкретные компетенции как сильные стороны и зоны развития.">
          <h3>Сильные стороны</h3><QuickCopy label="Подтвердить сильные стороны сотрудника" onClick={() => setWithDraft({ corporateStrengths: [...new Set([...review.corporateStrengths, ...selfReview.corporateStrengths])] })} /><CompetencyPicker employee={employee} selected={review.corporateStrengths} onChange={(items) => setWithDraft({ corporateStrengths: items })} tone="manager-strength" exclude={review.corporateDevelopment} />
          <div className="divider" /><h3>Зоны развития</h3><QuickCopy label="Подтвердить зоны развития сотрудника" onClick={() => setWithDraft({ corporateDevelopment: [...new Set([...review.corporateDevelopment, ...selfReview.corporateDevelopment])] })} /><CompetencyPicker employee={employee} selected={review.corporateDevelopment} onChange={(items) => setWithDraft({ corporateDevelopment: items })} tone="manager-development" exclude={review.corporateStrengths} />
        </Card>
        <Card title="Автоматическая сводка" description="Индексы строятся только по оценке руководителя и используются для аналитики.">
          <div className="summary-index"><div><span>Corporate Competency Index</span><strong>{formatIndex(index)}</strong><small>{indexLabel(index)}</small></div>{[["Hard", review.hardRating], ["Результат", review.resultRating], ["Технологии", review.technologyRating], ["Команда", review.teamRating], ...(employee.isManager ? [["Лидерство", review.leadershipRating] as [string, Rating]] : [])].map(([label, rating]) => <div key={label}><span>{label}</span><strong>{formatIndex(score(rating as Rating))}</strong><small>{ratingLabel[rating as Rating]}</small></div>)}</div>
          {hints.length > 0 && <div className="hints">{hints.map((hint) => <p key={hint}>{hint}</p>)}</div>}
        </Card>
        <Card title="Итоговая обратная связь">
          <Textarea label="Ключевые сильные стороны сотрудника" value={review.strengthsText} onChange={(value) => set("strengthsText", value)} maxLength={1000} hint="Черновик обновляется при выборе тегов, текст можно отредактировать." />
          <Textarea label="Ключевые зоны развития" value={review.developmentText} onChange={(value) => set("developmentText", value)} maxLength={1000} hint="Черновик обновляется при выборе тегов, текст можно отредактировать." />
          <Textarea required label="Как компетенции связаны с итоговой категорией" value={review.categoryRationale} onChange={(value) => set("categoryRationale", value)} maxLength={1000} hint="Кратко объясните связь проявлений компетенций с итоговой категорией сотрудника." />
          <Textarea required label="Согласованный фокус развития" value={review.agreedFocus} onChange={(value) => set("agreedFocus", value)} maxLength={1000} />
          <Textarea required label="Итоговый комментарий руководителя" value={review.finalComment} onChange={(value) => set("finalComment", value)} maxLength={1500} />
        </Card>
        <div className="form-footer"><Button variant="ghost" onClick={onBack}>Вернуться к списку</Button><div><Button variant="secondary" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button><Button onClick={complete}>Завершить оценку</Button></div></div>
      </section>
    </div>
  </div>;
}

function RatingRow({ label, value, onChange }: { label: string; value: Rating; onChange: (value: Rating) => void }) {
  return <div className="rating-row"><strong>{label}</strong><Segmented value={value} options={ratingOptions} onChange={onChange} compact /></div>;
}
function QuickCopy({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" className="quick-copy" onClick={onClick}>+ {label}</button>; }
function SummaryTags({ title, items, tone = "default" }: { title: string; items: string[]; tone?: string }) {
  return <div className="summary-section"><h3>{title}</h3>{items.length ? <div className="summary-section__items">{items.map((item) => <span className={`summary-pill summary-pill--${tone}`} key={item}>{item}</span>)}</div> : <p className="muted">Пока не заполнено</p>}</div>;
}

function Analytics({ selfReviews, managerReviews }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[] }) {
  const completed = managerReviews.filter((review) => review.status === "completed");
  const avg = (values: (number | null)[]) => { const filtered = values.filter((value): value is number => value !== null); return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : null; };
  const metrics = [
    ["Hard Index", avg(completed.map((review) => score(review.hardRating)))], ["Result Index", avg(completed.map((review) => score(review.resultRating)))],
    ["Technology Index", avg(completed.map((review) => score(review.technologyRating)))], ["Team Index", avg(completed.map((review) => score(review.teamRating)))],
    ["Corporate Index", avg(completed.map(corporateIndex))], ["Leadership Index", avg(completed.map((review) => score(review.leadershipRating)))],
  ] as const;
  const frequency = (lists: string[][]) => {
    const counts = new Map<string, number>(); lists.flat().forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const gaps = managerReviews.flatMap((manager) => {
    const self = selfReviews.find((item) => item.employeeId === manager.employeeId); if (!self) return [];
    return manager.corporateDevelopment.filter((id) => self.corporateStrengths.includes(id) || !self.corporateDevelopment.includes(id)).map((id) => ({ employee: getEmployee(manager.employeeId).fullName, competency: itemTitle(id), self: self.corporateStrengths.includes(id) ? "Сильная сторона" : "Не выбрано", manager: "Зона развития" }));
  });
  return <div className="page"><div className="page-header"><div><div className="eyebrow">HR-аналитика</div><h1>Сводка по циклу оценки</h1><p>Интегральные показатели строятся только по оценкам руководителей. Самооценка показана отдельно.</p></div><div className="deadline"><span>Цикл</span><strong>Performance Review 2026</strong></div></div>
    <div className="metric-grid">{metrics.map(([label, value]) => <Card key={label}><span>{label}</span><b>{formatIndex(value)}</b><small>{indexLabel(value)}</small></Card>)}<Card><span>Завершено</span><b>{completed.length}</b><small>из {employees.length} оценок</small></Card><Card><span>В работе</span><b>{employees.length - completed.length}</b><small>требуют внимания</small></Card></div>
    <Card title="Сотрудники" description="Показатели руководителя используются в агрегированной статистике."><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Категория</th><th>Hard</th><th>Результат</th><th>Технологии</th><th>Команда</th><th>Лидерство</th><th>Corporate</th><th>Статус</th></tr></thead><tbody>{employees.map((employee) => { const review = managerReviews.find((item) => item.employeeId === employee.id); return <tr key={employee.id}><td><strong>{employee.fullName}</strong><span>{employee.position}</span></td><td>{review?.category || "—"}</td><td>{formatIndex(review ? score(review.hardRating) : null)}</td><td>{formatIndex(review ? score(review.resultRating) : null)}</td><td>{formatIndex(review ? score(review.technologyRating) : null)}</td><td>{formatIndex(review ? score(review.teamRating) : null)}</td><td>{formatIndex(review ? score(review.leadershipRating) : null)}</td><td>{formatIndex(review ? corporateIndex(review) : null)}</td><td><Badge status={review?.status === "completed" ? "completed" : "draft"} /></td></tr>; })}</tbody></table></div></Card>
    <div className="analytics-grid"><FrequencyCard title="По мнению сотрудников" subtitle="Самооценка · материал для диалога" strengths={frequency(selfReviews.map((item) => [...item.hardStrengths, ...item.corporateStrengths]))} development={frequency(selfReviews.map((item) => [...item.hardDevelopment, ...item.corporateDevelopment]))} /><FrequencyCard title="По оценке руководителей" subtitle="Источник управленческой аналитики" strengths={frequency(managerReviews.map((item) => [...item.hardStrengths, ...item.corporateStrengths]))} development={frequency(managerReviews.map((item) => [...item.hardDevelopment, ...item.corporateDevelopment]))} /></div>
    <Card title="Gap-аналитика" description="Расхождения не являются ошибкой: это темы для обсуждения на performance review встрече."><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Компетенция</th><th>Самооценка</th><th>Руководитель</th></tr></thead><tbody>{gaps.length ? gaps.map((gap, index) => <tr key={`${gap.employee}-${gap.competency}-${index}`}><td>{gap.employee}</td><td>{gap.competency}</td><td>{gap.self}</td><td>{gap.manager}</td></tr>) : <tr><td colSpan={4}>Расхождений пока нет</td></tr>}</tbody></table></div></Card>
  </div>;
}

function FrequencyCard({ title, subtitle, strengths, development }: { title: string; subtitle: string; strengths: [string, number][]; development: [string, number][] }) {
  return <Card title={title} description={subtitle}><h3 className="frequency-title">Сильные стороны</h3><div className="frequency">{strengths.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div><h3 className="frequency-title">Зоны развития</h3><div className="frequency">{development.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div></Card>;
}
