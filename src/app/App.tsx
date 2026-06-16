import { useState, type ReactNode } from "react";
import { competencies, createEmptyManagerReview, createEmptySelfReview, employees, skills } from "../data/mockData";
import { loadState, resetState, saveManagerReviews, saveRole, saveSelectedEmployee, saveSelfReviews } from "../store/localStorageStore";
import type { Competency, DevelopmentTrack, Employee, ManagerReview, Role, SelfReview } from "../types";
import { validateManager, validateSelf } from "../utils/validation";

const initial = loadState();
const roleOptions: { value: Role; label: string }[] = [{ value: "employee", label: "Я сотрудник" }, { value: "manager", label: "Я руководитель" }, { value: "analytics", label: "Аналитика HR" }];
const blockNames = { result: "Результат", technology: "Технологии", team: "Команда", leadership: "Лидерство" };
const categoryOptions = ["A", "B", "C", "D"] as const;
const developmentTracks: { value: DevelopmentTrack; label: string }[] = [
  { value: "expert", label: "Экспертный трек (развитие в текущей роли)" },
  { value: "career_growth", label: "Трек карьерного роста (руководитель выбирает позицию)" },
  { value: "mentor", label: "Трек наставника/ментора" },
  { value: "leadership", label: "Лидерский трек" },
  { value: "retention_key_expert", label: "Ключевой эксперт/трек удержания" },
  { value: "successor", label: "Преемник на позицию (от 8 грейда)" },
];

const getEmployee = (id: string) => employees.find((employee) => employee.id === id) ?? employees[0];
const itemTitle = (id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return skills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
};
const toggle = (items: string[], id: string, limit?: number) => {
  const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  return limit ? next.slice(0, limit) : next;
};

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

function CompetencyPicker({ employee, selected, onChange, tone, exclude = [], limit = 3 }: { employee: Employee; selected: string[]; onChange: (items: string[]) => void; tone: string; exclude?: string[]; limit?: number }) {
  const [info, setInfo] = useState<Competency | null>(null);
  const available = competencies.filter((item) => item.applicableTo === "all" || employee.isManager);
  return <div className="competency-list">{Object.entries(blockNames).map(([block, title]) => {
    const items = available.filter((item) => item.block === block && !exclude.includes(item.id));
    if (!items.length) return null;
    return <div key={block}><h4>{title}</h4><div className="competency-compact-list">{items.map((item) => {
      const selectedItem = selected.includes(item.id);
      const limitReached = selected.length >= limit && !selectedItem;
      return <div className={`competency-option ${selectedItem ? "is-selected" : ""} ${limitReached ? "is-muted" : ""}`} key={item.id}><button type="button" className="competency-option__main" disabled={limitReached} onClick={() => onChange(toggle(selected, item.id, limit))}><strong>{item.title}</strong><span>{title}</span></button><button type="button" className="info-button" aria-label={`Описание компетенции ${item.title}`} onClick={() => setInfo(item)}>i</button></div>;
    })}</div></div>;
  })}{info && <CompetencyInfoModal competency={info} onClose={() => setInfo(null)} />}</div>;
}

function CompetencyInfoModal({ competency, onClose }: { competency: Competency; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="competency-info-modal" onMouseDown={(event) => event.stopPropagation()}><div className="eyebrow">{blockNames[competency.block]}</div><h2>{competency.title}</h2><p>{competency.description}</p><ul>{competency.indicators.slice(0, 3).map((indicator) => <li key={indicator}>{indicator}</li>)}</ul><Button onClick={onClose}>Понятно</Button></div></div>;
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
  const fillDemo = () => onUpdate({ employeeId: employee.id, status: "draft", accomplishments: ["Подготовил и внедрил новый подход к приоритизации задач.", "Автоматизировал регулярную отчётность для команды."], hardStrengths: ["data", "stakeholders"], hardDevelopment: ["presentations"], corporateStrengths: ["ownership", "collaboration"], corporateDevelopment: ["technology"], developmentFocus: "", notes: "Хочу обсудить участие в кросс-функциональном проекте." });
  const save = () => { setSaving(true); window.setTimeout(() => { onUpdate(review); setSaving(false); notify("Черновик сохранён"); }, 400); };
  const submit = () => {
    const nextErrors = validateSelf(review); setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...review, status: "submitted" }); notify("Самооценка отправлена"); }
  };
  if (review.status === "submitted") return <Card className="success-state"><div className="success-state__icon">✓</div><Badge status="submitted" /><h2>Самооценка отправлена руководителю</h2><p>Данные сохранены. После завершения оценки руководителем здесь появится итоговая обратная связь.</p></Card>;
  return <>
    <Card className="intro-card"><div className="intro-card__row"><div><Badge status={review.status} /><h2>Самооценка за 2026 год</h2><p>Самооценка поможет зафиксировать результаты, сильные стороны и зоны развития. Она не рассчитывает итоговую категорию автоматически.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
    <div className="stepper stepper--three">{["Результаты", "Hard skills", "Компетенции"].map((title, index) => <button type="button" className={index === step ? "is-active" : index < step ? "is-done" : ""} key={title} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span>{title}</button>)}</div>
    {errors.length > 0 && <div className="error-box"><strong>Проверьте обязательные поля</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    {step === 0 && <Card title="Ключевые результаты" eyebrow="Шаг 1 из 4" description="Добавьте 1–3 результата, которыми вы хотите поделиться на встрече.">
      {review.accomplishments.map((value, index) => <div className="result-row" key={index}><span>{index + 1}</span><textarea value={value} maxLength={500} rows={3} placeholder="Опишите результат и его эффект" onChange={(event) => set("accomplishments", review.accomplishments.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />{review.accomplishments.length > 1 && <button type="button" onClick={() => set("accomplishments", review.accomplishments.filter((_, itemIndex) => itemIndex !== index))}>×</button>}</div>)}
      {review.accomplishments.length < 3 && <Button variant="secondary" onClick={() => set("accomplishments", [...review.accomplishments, ""])}>+ Добавить результат</Button>}
    </Card>}
    {step === 1 && <Card title="Профессиональные навыки" eyebrow="Шаг 2 из 4" description="Выберите навыки, знания или инструменты, которые помогли вам в работе, и те, которые стоит развить.">
      <div className="subsection"><h3>Что помогло в работе</h3><SkillPicker selected={review.hardStrengths} onChange={(items) => set("hardStrengths", items)} tone="strength" exclude={review.hardDevelopment} /></div>
      <div className="subsection"><h3>Что стоит развивать</h3><SkillPicker selected={review.hardDevelopment} onChange={(items) => set("hardDevelopment", items)} tone="development" exclude={review.hardStrengths} /></div>
    </Card>}
    {step === 2 && <Card title="Корпоративные компетенции" eyebrow="Шаг 3 из 3" description="Выберите компетенции из корпоративной модели, которые помогали вам в работе, и компетенции, которые вы хотели бы усилить. Если нужно, нажмите на значок информации рядом с названием, чтобы посмотреть описание.">
      <div className="subsection"><h3>Выберите компетенции, которые помогали вам добиться результата <small>от 1 до 5</small></h3><CompetencyPicker employee={employee} selected={review.corporateStrengths} onChange={(items) => set("corporateStrengths", items)} tone="strength" exclude={review.corporateDevelopment} limit={5} /></div>
      <div className="subsection"><h3>Выберите компетенции, которые хотели бы усилить <small>от 1 до 5</small></h3><CompetencyPicker employee={employee} selected={review.corporateDevelopment} onChange={(items) => set("corporateDevelopment", items)} tone="development" exclude={review.corporateStrengths} limit={5} /></div>
    </Card>}
    <div className="form-footer"><Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</Button><div>{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}{step < 2 ? <Button onClick={() => setStep(step + 1)}>Продолжить</Button> : <Button onClick={submit}>Отправить руководителю</Button>}</div></div>
  </>;
}

function EmployeeResult({ employee, review }: { employee: Employee; review: ManagerReview }) {
  const track = developmentTracks.find((item) => item.value === review.developmentTrack)?.label ?? "Не выбран";
  return <><Card className="result-hero"><div><div className="eyebrow">Итоговая обратная связь</div><h2>{employee.fullName}, оценка завершена</h2><p>Обсудите результат с руководителем и договоритесь о следующих шагах в выбранном треке.</p></div><div className="category"><span>Категория сотрудника на основе оценки результативности</span><strong>{review.category}</strong></div></Card>
    <div className="result-grid"><Card title="Профессиональные навыки, которые помогали результату"><TagList ids={review.hardStrengths} tone="strength" /></Card><Card title="Профессиональные навыки, которые стоит усилить"><TagList ids={review.hardDevelopment} tone="development" /></Card><Card title="Корпоративные компетенции, которые помогали результату"><TagList ids={review.corporateStrengths} tone="strength" /></Card><Card title="Корпоративные компетенции, которые стоит усилить"><TagList ids={review.corporateDevelopment} tone="development" /></Card><Card title="Трек на следующий период"><p className="feedback">{track}{review.targetPosition && ` · ${review.targetPosition}`}{review.successorPosition && ` · ${review.successorPosition}`}</p>{review.trackComment && <p className="feedback">{review.trackComment}</p>}</Card><Card title="Комментарий руководителя"><p className="feedback">{review.finalComment || "Комментарий не заполнен."}</p></Card></div></>;
}

function TagList({ ids, tone }: { ids: string[]; tone: string }) {
  return ids.length ? <div className="summary-section__items">{ids.map((id) => <span className={`summary-pill summary-pill--${tone}`} key={id}>{itemTitle(id)}</span>)}</div> : <p className="muted">Пока не заполнено</p>;
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
  const setWithDraft = (changes: Partial<ManagerReview>) => onUpdate({ ...review, ...changes });
  const fillDemo = () => { const next = { ...review, category: "B" as const, hardStrengths: selfReview.hardStrengths.length ? selfReview.hardStrengths.slice(0, 3) : ["data"], hardDevelopment: selfReview.hardDevelopment.length ? selfReview.hardDevelopment.slice(0, 3) : ["presentations"], corporateStrengths: selfReview.corporateStrengths.length ? selfReview.corporateStrengths.slice(0, 3) : ["ownership"], corporateDevelopment: selfReview.corporateDevelopment.length ? selfReview.corporateDevelopment.slice(0, 3) : ["technology"], developmentTrack: "expert" as const, trackComment: "Развитие в текущей роли через усиление выбранных навыков.", finalComment: "Сотрудник стабильно достигает результата и конструктивно взаимодействует с командой." }; onUpdate(next); };
  const complete = () => { const nextErrors = validateManager(review); setErrors(nextErrors); if (!nextErrors.length) { onUpdate({ ...review, status: "completed" }); notify("Оценка руководителя завершена"); onComplete(); } };
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
        <SummaryTags title="Корпоративные компетенции · помогали результату" items={selfReview.corporateStrengths.map(itemTitle)} tone="strength" />
        <SummaryTags title="Корпоративные компетенции · хочет усилить" items={selfReview.corporateDevelopment.map(itemTitle)} tone="development" />
      </aside>
      <section className="split__right">
        <Card className="manager-intro"><div className="intro-card__row"><div><div className="eyebrow">Управленческая оценка</div><h2>Выбор навыков и трека развития</h2><p>Используйте самооценку как контекст: подтвердите выбор сотрудника, скорректируйте его или добавьте свои наблюдения.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
        <Card title="Категория сотрудника на основе оценки результативности" description="Категория не рассчитывается автоматически из компетенций. Выберите её на основе результата за период.">
          <Segmented value={review.category} options={categoryOptions.map((value) => ({ value, label: value }))} onChange={(value) => set("category", value)} compact />
        </Card>
        <Card title="Профессиональные навыки" description="Быстро подтвердите выбор сотрудника или добавьте свои наблюдения.">
          <QuickCopy label="Подтвердить навыки, которые помогали результату" onClick={() => setWithDraft({ hardStrengths: [...new Set([...review.hardStrengths, ...selfReview.hardStrengths])].slice(0, 3) })} /><SkillPicker selected={review.hardStrengths} onChange={(items) => setWithDraft({ hardStrengths: items.slice(0, 3) })} tone="manager-strength" exclude={review.hardDevelopment} />
          <div className="divider" /><QuickCopy label="Подтвердить навыки, которые стоит усилить" onClick={() => setWithDraft({ hardDevelopment: [...new Set([...review.hardDevelopment, ...selfReview.hardDevelopment])].slice(0, 3) })} /><SkillPicker selected={review.hardDevelopment} onChange={(items) => setWithDraft({ hardDevelopment: items.slice(0, 3) })} tone="manager-development" exclude={review.hardStrengths} />
        </Card>
        <Card title="Корпоративные компетенции" description="Сравните выбор сотрудника со своими наблюдениями. Вы можете подтвердить выбранные сотрудником компетенции или выбрать другие.">
          <h3>Выберите компетенции, которые помогали сотруднику добиться результата</h3><QuickCopy label="Подтвердить выбор сотрудника" onClick={() => setWithDraft({ corporateStrengths: [...new Set([...review.corporateStrengths, ...selfReview.corporateStrengths])].slice(0, 5) })} /><CompetencyPicker employee={employee} selected={review.corporateStrengths} onChange={(items) => setWithDraft({ corporateStrengths: items })} tone="manager-strength" exclude={review.corporateDevelopment} limit={5} />
          <div className="divider" /><h3>Выберите компетенции, которые сотруднику стоит усилить</h3><QuickCopy label="Подтвердить выбор сотрудника" onClick={() => setWithDraft({ corporateDevelopment: [...new Set([...review.corporateDevelopment, ...selfReview.corporateDevelopment])].slice(0, 5) })} /><CompetencyPicker employee={employee} selected={review.corporateDevelopment} onChange={(items) => setWithDraft({ corporateDevelopment: items })} tone="manager-development" exclude={review.corporateStrengths} limit={5} />
        </Card>
        <Card title="Трек сотрудника на следующий период" description="Трек помогает зафиксировать, в каком направлении сотруднику целесообразно развиваться после performance review.">
          <DevelopmentTrackSelect value={review.developmentTrack} onChange={(value) => set("developmentTrack", value)} />
          {review.developmentTrack === "career_growth" && <label className="field"><span className="field__label">Целевая позиция<b>*</b></span><input value={review.targetPosition} placeholder="Например: Старший аналитик, Руководитель направления, Product owner" onChange={(event) => set("targetPosition", event.target.value)} /></label>}
          {review.developmentTrack === "successor" && <><label className="field"><span className="field__label">Позиция, на которую рассматривается сотрудник как преемник<b>*</b></span><input value={review.successorPosition} placeholder="Укажите позицию" onChange={(event) => set("successorPosition", event.target.value)} /></label><div className="empty-note">Этот трек предполагает, что сотрудник рассматривается как потенциальный преемник на позицию от 8 грейда.</div></>}
          <Textarea label="Комментарий к выбранному треку" value={review.trackComment} onChange={(value) => set("trackComment", value)} maxLength={1000} />
          <Textarea label="Итоговый комментарий руководителя" value={review.finalComment} onChange={(value) => set("finalComment", value)} maxLength={1500} />
        </Card>
        <div className="form-footer"><Button variant="ghost" onClick={onBack}>Вернуться к списку</Button><div><Button variant="secondary" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button><Button onClick={complete}>Завершить оценку</Button></div></div>
      </section>
    </div>
  </div>;
}

function DevelopmentTrackSelect({ value, onChange }: { value: DevelopmentTrack; onChange: (value: DevelopmentTrack) => void }) {
  return <label className="field"><span className="field__label">Выберите трек для сотрудника на следующий период<b>*</b></span><select className="select-control" value={value} onChange={(event) => onChange(event.target.value as DevelopmentTrack)}><option value="">Не выбрано</option>{developmentTracks.map((track) => <option key={track.value} value={track.value}>{track.label}</option>)}</select></label>;
}
function QuickCopy({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" className="quick-copy" onClick={onClick}>+ {label}</button>; }
function SummaryTags({ title, items, tone = "default" }: { title: string; items: string[]; tone?: string }) {
  return <div className="summary-section"><h3>{title}</h3>{items.length ? <div className="summary-section__items">{items.map((item) => <span className={`summary-pill summary-pill--${tone}`} key={item}>{item}</span>)}</div> : <p className="muted">Пока не заполнено</p>}</div>;
}

function Analytics({ selfReviews, managerReviews }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[] }) {
  const completed = managerReviews.filter((review) => review.status === "completed");
  const frequency = (lists: string[][]) => {
    const counts = new Map<string, number>(); lists.flat().forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const trackCounts = developmentTracks.map((track) => ({ track: track.label, count: managerReviews.filter((review) => review.developmentTrack === track.value).length }));
  return <div className="page"><div className="page-header"><div><div className="eyebrow">HR-аналитика</div><h1>Сводка по циклу оценки</h1><p>Самооценка и оценка руководителя разделены. Аналитика показывает выбранные навыки и треки без расчёта категории.</p></div><div className="deadline"><span>Цикл</span><strong>Performance Review 2026</strong></div></div>
    <div className="metric-grid"><Card><span>Завершено</span><b>{completed.length}</b><small>из {employees.length} оценок</small></Card><Card><span>В работе</span><b>{employees.length - completed.length}</b><small>требуют внимания</small></Card><Card><span>Трек выбран</span><b>{managerReviews.filter((review) => review.developmentTrack).length}</b><small>сотрудников</small></Card></div>
    <Card title="Распределение выбранных треков"><div className="table-wrap"><table><thead><tr><th>Трек</th><th>Количество сотрудников</th></tr></thead><tbody>{trackCounts.map((row) => <tr key={row.track}><td>{row.track}</td><td>{row.count}</td></tr>)}</tbody></table></div></Card>
    <Card title="Сотрудники"><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Категория сотрудника на основе оценки результативности</th><th>Трек</th><th>Статус</th></tr></thead><tbody>{employees.map((employee) => { const review = managerReviews.find((item) => item.employeeId === employee.id); const track = developmentTracks.find((item) => item.value === review?.developmentTrack)?.label ?? "—"; return <tr key={employee.id}><td><strong>{employee.fullName}</strong><span>{employee.position}</span></td><td>{review?.category || "—"}</td><td>{track}</td><td><Badge status={review?.status === "completed" ? "completed" : "draft"} /></td></tr>; })}</tbody></table></div></Card>
    <div className="analytics-grid"><FrequencyCard title="По самооценке сотрудников" subtitle="Корпоративные компетенции" strengths={frequency(selfReviews.map((item) => item.corporateStrengths))} development={frequency(selfReviews.map((item) => item.corporateDevelopment))} /><FrequencyCard title="По оценке руководителей" subtitle="Корпоративные компетенции" strengths={frequency(managerReviews.map((item) => item.corporateStrengths))} development={frequency(managerReviews.map((item) => item.corporateDevelopment))} /><FrequencyCard title="Hard skills · сотрудники" subtitle="Профессиональные навыки" strengths={frequency(selfReviews.map((item) => item.hardStrengths))} development={frequency(selfReviews.map((item) => item.hardDevelopment))} /><FrequencyCard title="Hard skills · руководители" subtitle="Профессиональные навыки" strengths={frequency(managerReviews.map((item) => item.hardStrengths))} development={frequency(managerReviews.map((item) => item.hardDevelopment))} /></div>
  </div>;
}

function FrequencyCard({ title, subtitle, strengths, development }: { title: string; subtitle: string; strengths: [string, number][]; development: [string, number][] }) {
  return <Card title={title} description={subtitle}><h3 className="frequency-title">Помогали результату</h3><div className="frequency">{strengths.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div><h3 className="frequency-title">Стоит усилить</h3><div className="frequency">{development.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div></Card>;
}
