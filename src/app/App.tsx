import { useMemo, useState, type ReactNode } from "react";
import { competencies, createEmptyManagerReview, createEmptySelfReview, employees, skills } from "../data/mockData";
import { loadState, resetState, saveManagerReviews, saveRole, saveSelectedEmployee, saveSelfReviews, saveTeamReviewMode } from "../store/localStorageStore";
import type { Competency, ManagerReview, Rating, Role, SelfReview } from "../types";
import { blockAverage, competencyStats, corporateIndex, employeeIndices, formatIndex, gapForCompetency, indexLabel, managerHints, ratingLabel, score } from "../utils/calculations";
import { generateFeedbackDraft } from "../utils/feedbackDraft";
import { validateManager, validateSelf } from "../utils/validation";

type TeamReviewMode = "employees" | "competencies";

const initial = loadState();
const blockNames = { result: "Результат", technology: "Технологии", team: "Команда", leadership: "Лидерство" };
const roleOptions: { value: Role; label: string }[] = [{ value: "employee", label: "Я сотрудник" }, { value: "manager", label: "Я руководитель" }, { value: "analytics", label: "Аналитика HR" }];
const employeeRatingOptions: Rating[] = ["below", "meets", "above"];
const leadershipSelfOptions: Rating[] = ["not_applicable", "below", "meets", "above"];
const managerBaseOptions: Rating[] = ["below", "meets", "above", "no_info"];
const managerLeadershipOptions: Rating[] = ["not_applicable", "below", "meets", "above", "no_info"];
const categories = ["A", "B", "C", "D"] as const;

const getEmployee = (id: string) => employees.find((employee) => employee.id === id) ?? employees[0];
const byBlock = (block: string) => competencies.filter((competency) => competency.block === block);
const isLeadership = (competency: Competency) => competency.block === "leadership";
const itemTitle = (id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return skills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
};
const toggle = (items: string[], id: string, limit?: number) => {
  const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  return limit ? next.slice(0, limit) : next;
};

function Button({ children, variant = "primary", onClick, disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; disabled?: boolean }) {
  return <button type="button" className={`button button--${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Card({ title, eyebrow, description, children, className = "" }: { title?: string; eyebrow?: string; description?: string; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{(title || eyebrow || description) && <div className="card__head">{eyebrow && <div className="eyebrow">{eyebrow}</div>}{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>}{children}</section>;
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

function RatingControl({ value, options, onChange }: { value: Rating; options: Rating[]; onChange: (rating: Rating) => void }) {
  return <Segmented value={value} options={options.map((rating) => ({ value: rating, label: ratingLabel[rating] }))} onChange={onChange} compact />;
}

function SkillPicker({ selected, onChange, tone, exclude = [], limit = 99 }: { selected: string[]; onChange: (items: string[]) => void; tone: string; exclude?: string[]; limit?: number }) {
  const [query, setQuery] = useState("");
  const visible = skills.filter((item) => !exclude.includes(item.id) && item.title.toLowerCase().includes(query.toLowerCase()));
  const addCustom = () => {
    const title = query.trim();
    if (!title) return;
    onChange(toggle(selected, `custom:${title}`, limit));
    setQuery("");
  };
  return <div className="picker">
    <div className="picker__selected">{selected.map((id) => <Tag key={id} selected tone={tone} onClick={() => onChange(selected.filter((item) => item !== id))}>{itemTitle(id)} <span>×</span></Tag>)}</div>
    <div className="picker__search"><input value={query} placeholder="Найти навык или добавить свой" onChange={(event) => setQuery(event.target.value)} /><Button variant="secondary" onClick={addCustom}>Добавить свой</Button></div>
    <div className="picker__options">{visible.slice(0, query ? 8 : 12).map((item) => <Tag key={item.id} selected={selected.includes(item.id)} tone={tone} onClick={() => onChange(toggle(selected, item.id, limit))}>{item.title}</Tag>)}</div>
  </div>;
}

function CompetencyPicker({ selected, onChange, tone, exclude = [], limit = 99 }: { selected: string[]; onChange: (items: string[]) => void; tone: string; exclude?: string[]; limit?: number }) {
  return <div className="competency-list">{Object.entries(blockNames).map(([block, title]) => <div key={block}><h4>{title}</h4><div className="picker__options">{byBlock(block).filter((item) => !exclude.includes(item.id)).map((item) => <Tag key={item.id} selected={selected.includes(item.id)} tone={tone} onClick={() => onChange(toggle(selected, item.id, limit))}>{item.title}</Tag>)}</div></div>)}</div>;
}

function CompetencyDetails({ competency }: { competency: Competency }) {
  return <details className="competency-details"><summary>Описание и индикаторы</summary><p>{competency.description}</p><ul>{competency.indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}</ul></details>;
}

function CompetencyRatingCard({ competency, value, options, onChange, selfValue, managerValue }: { competency: Competency; value: Rating; options: Rating[]; onChange: (rating: Rating) => void; selfValue?: Rating; managerValue?: Rating }) {
  const gap = gapForCompetency(selfValue, managerValue);
  return <div className={`competency-card competency-card--${competency.block}`}>
    <div className="competency-card__main"><div><span>{blockNames[competency.block]}</span><h3>{competency.title}</h3></div>{gap !== null && <strong className={`gap gap--${Math.abs(gap) >= 2 ? "strong" : "soft"}`}>{gap > 0 ? "+" : ""}{gap}</strong>}</div>
    <RatingControl value={value} options={options} onChange={onChange} />
    <CompetencyDetails competency={competency} />
  </div>;
}

function Avatar({ employeeId }: { employeeId: string }) {
  const employee = getEmployee(employeeId);
  return <div className="avatar">{employee.avatarInitials}</div>;
}

function Toast({ message }: { message: string }) {
  return message ? <div className="toast">{message}</div> : null;
}

export function App() {
  const [role, setRole] = useState<Role>(initial.role);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initial.selectedEmployeeId);
  const [teamReviewMode, setTeamReviewMode] = useState<TeamReviewMode>(initial.teamReviewMode);
  const [selfReviews, setSelfReviews] = useState(initial.selfReviews);
  const [managerReviews, setManagerReviews] = useState(initial.managerReviews);
  const [toast, setToast] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const updateSelf = (review: SelfReview) => {
    const next = selfReviews.some((item) => item.employeeId === review.employeeId) ? selfReviews.map((item) => item.employeeId === review.employeeId ? review : item) : [...selfReviews, review];
    setSelfReviews(next); saveSelfReviews(next);
  };
  const updateManager = (review: ManagerReview) => {
    const next = managerReviews.some((item) => item.employeeId === review.employeeId) ? managerReviews.map((item) => item.employeeId === review.employeeId ? review : item) : [...managerReviews, review];
    setManagerReviews(next); saveManagerReviews(next);
  };
  const changeRole = (next: Role) => { setRole(next); saveRole(next); };
  const changeEmployee = (id: string) => { setSelectedEmployeeId(id); saveSelectedEmployee(id); };
  const changeTeamMode = (mode: TeamReviewMode) => { setTeamReviewMode(mode); saveTeamReviewMode(mode); };
  const reset = () => { resetState(); window.location.reload(); };

  return <div className="app">
    <header className="topbar">
      <div className="brand"><span className="brand__mark">РТК</span><div><strong>Performance Review</strong><span>Оценка компетенций · v2</span></div></div>
      <Segmented value={role} options={roleOptions} onChange={changeRole} />
      <div className="topbar__actions"><Button variant="ghost" onClick={reset}>Сбросить демо-данные</Button></div>
    </header>
    <main>
      {role === "employee" && <EmployeeMode selectedId={selectedEmployeeId} onSelect={changeEmployee} selfReviews={selfReviews} managerReviews={managerReviews} onUpdate={updateSelf} notify={notify} />}
      {role === "manager" && <TeamReviewPage mode={teamReviewMode} onModeChange={changeTeamMode} selfReviews={selfReviews} managerReviews={managerReviews} onUpdate={updateManager} notify={notify} />}
      {role === "analytics" && <Analytics selfReviews={selfReviews} managerReviews={managerReviews} />}
    </main>
    <Toast message={toast} />
  </div>;
}

function EmployeeMode({ selectedId, onSelect, selfReviews, managerReviews, onUpdate, notify }: { selectedId: string; onSelect: (id: string) => void; selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onUpdate: (review: SelfReview) => void; notify: (message: string) => void }) {
  const employee = getEmployee(selectedId);
  const review = selfReviews.find((item) => item.employeeId === selectedId) ?? createEmptySelfReview(selectedId);
  const managerReview = managerReviews.find((item) => item.employeeId === selectedId);
  return <div className="page">
    <div className="page-header"><div><div className="eyebrow">Режим сотрудника</div><h1>Моя самооценка компетенций</h1><p>Самооценка помогает подготовиться к разговору: зафиксировать результаты, профессиональные навыки, сильные стороны и зоны развития.</p></div><label className="demo-user"><span>Демо-профиль</span><select value={selectedId} onChange={(event) => onSelect(event.target.value)}>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label></div>
    {managerReview?.status === "completed" ? <EmployeeResult review={managerReview} /> : <SelfReviewForm employeeId={employee.id} review={review} onUpdate={onUpdate} notify={notify} />}
  </div>;
}

function SelfReviewForm({ employeeId, review, onUpdate, notify }: { employeeId: string; review: SelfReview; onUpdate: (review: SelfReview) => void; notify: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SelfReview>(key: K, value: SelfReview[K]) => onUpdate({ ...review, [key]: value });
  const setRating = (competencyId: string, rating: Rating) => set("competencyRatings", { ...review.competencyRatings, [competencyId]: rating });
  const setLeadershipNA = (checked: boolean) => {
    const nextRatings = { ...review.competencyRatings };
    if (checked) byBlock("leadership").forEach((competency) => { nextRatings[competency.id] = "not_applicable"; });
    set("leadershipNotApplicable", checked);
    set("competencyRatings", nextRatings);
  };
  const suggestedStrengths = competencies.filter((item) => review.competencyRatings[item.id] === "above").map((item) => item.id).slice(0, 3);
  const suggestedDevelopment = competencies.filter((item) => review.competencyRatings[item.id] === "below").map((item) => item.id).slice(0, 2);
  const fillDemo = () => onUpdate({ ...review, accomplishments: ["Автоматизировал еженедельный отчёт и сократил ручную работу команды.", "Подготовил аналитику для решения по приоритизации продукта."], hardStrengths: ["data", "sql", "stakeholders"], hardDevelopment: ["presentations"], competencyRatings: Object.fromEntries(competencies.map((item) => [item.id, item.block === "leadership" ? "not_applicable" : item.block === "technology" ? "above" : "meets"])) as Record<string, Rating>, leadershipNotApplicable: true, corporateStrengths: ["technology.workWithData", "team.collaborate"], corporateDevelopment: ["result.findNewMeanings"], developmentFocus: "Быстрее проверять гипотезы и понятнее презентовать выводы руководителям." });
  const save = () => { setSaving(true); window.setTimeout(() => { onUpdate(review); setSaving(false); notify("Черновик сохранён"); }, 350); };
  const submit = () => {
    const nextErrors = validateSelf(review);
    setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...review, status: "submitted" }); notify("Самооценка отправлена"); }
  };
  if (review.status === "submitted") return <Card className="success-state"><div className="success-state__icon">✓</div><Badge status="submitted" /><h2>Самооценка отправлена руководителю</h2><p>После завершения оценки руководителем здесь появится итоговая обратная связь.</p></Card>;
  return <>
    <Card className="intro-card"><div className="intro-card__row"><div><Badge status={review.status} /><h2>Самооценка за 2026 год</h2><p>Оцените каждую компетенцию относительно ожиданий к текущей роли. Если лидерские компетенции не относятся к роли, отметьте их как “не актуально”.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
    <div className="stepper">{["Результаты", "Hard skills", "Компетенции", "Итоговый выбор"].map((title, index) => <button type="button" key={title} className={index === step ? "is-active" : index < step ? "is-done" : ""} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span>{title}</button>)}</div>
    {errors.length > 0 && <ErrorBox title="Проверьте обязательные поля" errors={errors} />}
    {step === 0 && <Card title="Ключевые результаты" eyebrow="Шаг 1 из 4" description="Добавьте 1–3 результата, которыми вы хотите поделиться на встрече.">
      {review.accomplishments.map((value, index) => <div className="result-row" key={index}><span>{index + 1}</span><textarea value={value} rows={3} maxLength={500} placeholder="Опишите результат и его эффект" onChange={(event) => set("accomplishments", review.accomplishments.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />{review.accomplishments.length > 1 && <button type="button" onClick={() => set("accomplishments", review.accomplishments.filter((_, itemIndex) => itemIndex !== index))}>×</button>}</div>)}
      {review.accomplishments.length < 3 && <Button variant="secondary" onClick={() => set("accomplishments", [...review.accomplishments, ""])}>+ Добавить результат</Button>}
    </Card>}
    {step === 1 && <Card title="Профессиональные навыки" eyebrow="Шаг 2 из 4" description="Hard skills остаются выбором навыков: что помогло достичь результата и что стоит развивать.">
      <div className="subsection"><h3>Что помогло</h3><SkillPicker selected={review.hardStrengths} onChange={(items) => set("hardStrengths", items)} tone="strength" exclude={review.hardDevelopment} /></div>
      <div className="subsection"><h3>Что развивать</h3><SkillPicker selected={review.hardDevelopment} onChange={(items) => set("hardDevelopment", items)} tone="development" exclude={review.hardStrengths} /></div>
    </Card>}
    {step === 2 && <Card title="Оценка компетенций" eyebrow="Шаг 3 из 4" description="Описания и индикаторы доступны рядом с каждой компетенцией. Блоки используются только для группировки.">
      <label className="switch leadership-switch"><input type="checkbox" checked={review.leadershipNotApplicable} onChange={(event) => setLeadershipNA(event.target.checked)} /><span />Лидерские компетенции не актуальны для моей роли</label>
      <div className="competency-rating-grid">{Object.entries(blockNames).map(([block, title]) => <div key={block} className="competency-block"><h3>{title}</h3>{byBlock(block).map((competency) => <CompetencyRatingCard key={competency.id} competency={competency} value={review.competencyRatings[competency.id] ?? ""} options={isLeadership(competency) ? leadershipSelfOptions : employeeRatingOptions} onChange={(rating) => setRating(competency.id, rating)} />)}</div>)}</div>
    </Card>}
    {step === 3 && <Card title="Итоговые сильные стороны и зоны развития" eyebrow="Шаг 4 из 4" description="На основе оценок предложены возможные сильные стороны и зоны развития. Вы можете скорректировать выбор.">
      <SuggestionLine title="Предложенные сильные стороны" ids={suggestedStrengths} onApply={() => set("corporateStrengths", suggestedStrengths)} />
      <CompetencyPicker selected={review.corporateStrengths} onChange={(items) => set("corporateStrengths", items)} tone="strength" exclude={review.corporateDevelopment} limit={3} />
      <div className="divider" />
      <SuggestionLine title="Предложенные зоны развития" ids={suggestedDevelopment} onApply={() => set("corporateDevelopment", suggestedDevelopment)} />
      <CompetencyPicker selected={review.corporateDevelopment} onChange={(items) => set("corporateDevelopment", items)} tone="development" exclude={review.corporateStrengths} limit={2} />
      <Textarea required label="Фокус развития" value={review.developmentFocus} onChange={(value) => set("developmentFocus", value)} maxLength={700} />
      <Textarea label="Комментарий" value={review.notes} onChange={(value) => set("notes", value)} maxLength={700} />
    </Card>}
    <div className="form-footer"><Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</Button><div>{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}{step < 3 ? <Button onClick={() => setStep(step + 1)}>Продолжить</Button> : <Button onClick={submit}>Отправить руководителю</Button>}</div></div>
  </>;
}

function SuggestionLine({ title, ids, onApply }: { title: string; ids: string[]; onApply: () => void }) {
  return <div className="suggestion-line"><div><strong>{title}</strong><span>{ids.length ? ids.map(itemTitle).join(", ") : "Нет автопредложения, выберите вручную"}</span></div><Button variant="ghost" onClick={onApply}>Применить</Button></div>;
}

function EmployeeResult({ review }: { review: ManagerReview }) {
  const [showRatings, setShowRatings] = useState(false);
  return <><Card className="result-hero"><div><div className="eyebrow">Итоговая обратная связь</div><h2>Оценка руководителя завершена</h2><p>По умолчанию показана только итоговая обратная связь без HR-аналитики.</p></div><div className="category"><span>Итоговая категория</span><strong>{review.category || "—"}</strong></div></Card>
    <div className="result-grid"><Card title="Сильные стороны"><p className="feedback">{review.strengthsText}</p></Card><Card title="Зоны развития"><p className="feedback">{review.developmentText}</p></Card><Card title="Согласованный фокус развития"><p className="feedback">{review.agreedFocus}</p></Card><Card title="Комментарий руководителя"><p className="feedback">{review.finalComment}</p></Card></div>
    <Card><label className="switch"><input type="checkbox" checked={showRatings} onChange={(event) => setShowRatings(event.target.checked)} /><span />Показать экспериментально оценки по компетенциям</label>{showRatings && <div className="mini-rating-list">{competencies.map((competency) => <div key={competency.id}><span>{competency.title}</span><strong>{ratingLabel[review.competencyRatings[competency.id] ?? ""]}</strong></div>)}</div>}</Card></>;
}

function TeamReviewPage({ mode, onModeChange, selfReviews, managerReviews, onUpdate, notify }: { mode: TeamReviewMode; onModeChange: (mode: TeamReviewMode) => void; selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onUpdate: (review: ManagerReview) => void; notify: (message: string) => void }) {
  return <div className="page">
    <div className="page-header"><div><div className="eyebrow">Режим руководителя</div><h1>Командная оценка компетенций</h1><p>Используйте самооценки сотрудников как контекст: подтвердите, скорректируйте или укажите, что недостаточно информации.</p></div><Segmented value={mode} options={[{ value: "employees", label: "По сотрудникам" }, { value: "competencies", label: "По компетенциям" }]} onChange={onModeChange} /></div>
    {mode === "employees" ? <TeamByEmployees selfReviews={selfReviews} managerReviews={managerReviews} onUpdate={onUpdate} notify={notify} /> : <TeamByCompetencies selfReviews={selfReviews} managerReviews={managerReviews} onUpdate={onUpdate} notify={notify} />}
  </div>;
}

function TeamByEmployees({ selfReviews, managerReviews, onUpdate, notify }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onUpdate: (review: ManagerReview) => void; notify: (message: string) => void }) {
  const [openId, setOpenId] = useState("boris");
  return <div className="team-stack">{employees.map((employee) => {
    const self = selfReviews.find((item) => item.employeeId === employee.id) ?? createEmptySelfReview(employee.id);
    const manager = managerReviews.find((item) => item.employeeId === employee.id) ?? createEmptyManagerReview(employee.id);
    const indices = employeeIndices(self, manager);
    return <Card key={employee.id} className="team-card">
      <button type="button" className="team-card__head" onClick={() => setOpenId(openId === employee.id ? "" : employee.id)}><Avatar employeeId={employee.id} /><div><h2>{employee.fullName}</h2><p>{employee.position} · {employee.department}</p></div><Badge status={manager.status === "completed" ? "completed" : self.status === "submitted" ? "submitted" : "draft"} /><div className="team-index"><span>Self</span><b>{formatIndex(indices.selfCorporate)}</b></div><div className="team-index"><span>Manager</span><b>{formatIndex(indices.managerCorporate)}</b></div><div className="team-index"><span>Gap</span><b>{formatIndex(indices.gap)}</b></div></button>
      {openId === employee.id && <EmployeeReviewPanel employeeId={employee.id} self={self} manager={manager} onUpdate={onUpdate} notify={notify} />}
    </Card>;
  })}</div>;
}

function EmployeeReviewPanel({ employeeId, self, manager, onUpdate, notify }: { employeeId: string; self: SelfReview; manager: ManagerReview; onUpdate: (review: ManagerReview) => void; notify: (message: string) => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const setReview = (next: ManagerReview) => onUpdate(next);
  const setRating = (competencyId: string, rating: Rating) => setReview({ ...manager, competencyRatings: { ...manager.competencyRatings, [competencyId]: rating } });
  const fillBySelf = () => setReview({ ...manager, competencyRatings: { ...manager.competencyRatings, ...self.competencyRatings }, hardStrengths: [...new Set([...manager.hardStrengths, ...self.hardStrengths])].slice(0, 3), hardDevelopment: [...new Set([...manager.hardDevelopment, ...self.hardDevelopment])].slice(0, 3), corporateStrengths: self.corporateStrengths.slice(0, 3), corporateDevelopment: self.corporateDevelopment.slice(0, 2), agreedFocus: manager.agreedFocus || self.developmentFocus });
  const setWithDraft = (changes: Partial<ManagerReview>) => { const next = { ...manager, ...changes }; setReview({ ...next, ...generateFeedbackDraft(next) }); };
  const autoStrengths = competencies.filter((item) => manager.competencyRatings[item.id] === "above").map((item) => item.id).slice(0, 3);
  const autoDevelopment = competencies.filter((item) => manager.competencyRatings[item.id] === "below").map((item) => item.id).slice(0, 2);
  const complete = () => {
    const nextErrors = validateManager(manager);
    setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...manager, status: "completed" }); notify("Оценка руководителя завершена"); }
  };
  const hints = managerHints(manager, self);
  return <div className="employee-review-panel">
    {errors.length > 0 && <ErrorBox title="Не хватает данных для завершения" errors={errors} />}
    <div className="review-actions"><Button variant="secondary" onClick={fillBySelf}>Заполнить по самооценке</Button><Button variant="ghost" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button></div>
    <div className="competency-table">{Object.entries(blockNames).map(([block, title]) => <div key={block} className="matrix-block"><h3>{title}</h3>{byBlock(block).map((competency) => <div key={competency.id} className="matrix-row"><div><strong>{competency.title}</strong><CompetencyDetails competency={competency} /></div><div className="rating-cell"><span>Самооценка</span><b>{ratingLabel[self.competencyRatings[competency.id] ?? ""]}</b></div><div className="rating-cell rating-cell--wide"><span>Руководитель</span><RatingControl value={manager.competencyRatings[competency.id] ?? ""} options={isLeadership(competency) ? managerLeadershipOptions : managerBaseOptions} onChange={(rating) => setRating(competency.id, rating)} /></div><div className="rating-cell"><span>Gap</span><b>{formatGap(gapForCompetency(self.competencyRatings[competency.id], manager.competencyRatings[competency.id]))}</b></div></div>)}</div>)}</div>
    {hints.length > 0 && <div className="hints">{hints.map((hint) => <p key={hint}>{hint}</p>)}</div>}
    <Card title="Итоговая обратная связь" description="Автопредложения строятся из компетенций, где руководитель поставил “выше” или “ниже ожиданий”.">
      <label className="demo-user category-select"><span>Категория A/B/C/D</span><select value={manager.category} onChange={(event) => onUpdate({ ...manager, category: event.target.value as ManagerReview["category"] })}><option value="">Не выбрано</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <SuggestionLine title="Сильные компетенции по оценке руководителя" ids={autoStrengths} onApply={() => setWithDraft({ corporateStrengths: autoStrengths })} />
      <CompetencyPicker selected={manager.corporateStrengths} onChange={(items) => setWithDraft({ corporateStrengths: items })} tone="manager-strength" exclude={manager.corporateDevelopment} limit={3} />
      <div className="divider" />
      <SuggestionLine title="Компетенции для развития по оценке руководителя" ids={autoDevelopment} onApply={() => setWithDraft({ corporateDevelopment: autoDevelopment })} />
      <CompetencyPicker selected={manager.corporateDevelopment} onChange={(items) => setWithDraft({ corporateDevelopment: items })} tone="manager-development" exclude={manager.corporateStrengths} limit={2} />
      <div className="divider" />
      <h3>Профессиональные сильные стороны</h3><SkillPicker selected={manager.hardStrengths} onChange={(items) => setWithDraft({ hardStrengths: items })} tone="manager-strength" exclude={manager.hardDevelopment} limit={3} />
      <h3>Профессиональные зоны развития</h3><SkillPicker selected={manager.hardDevelopment} onChange={(items) => setWithDraft({ hardDevelopment: items })} tone="manager-development" exclude={manager.hardStrengths} limit={3} />
      <Textarea label="Ключевые сильные стороны сотрудника" value={manager.strengthsText} onChange={(value) => onUpdate({ ...manager, strengthsText: value })} maxLength={1000} />
      <Textarea label="Ключевые зоны развития" value={manager.developmentText} onChange={(value) => onUpdate({ ...manager, developmentText: value })} maxLength={1000} />
      <Textarea required label="Как компетенции связаны с итоговой категорией A/B/C/D" value={manager.categoryRationale} onChange={(value) => onUpdate({ ...manager, categoryRationale: value })} maxLength={1000} />
      <Textarea required label="Согласованный фокус развития" value={manager.agreedFocus} onChange={(value) => onUpdate({ ...manager, agreedFocus: value })} maxLength={1000} />
      <Textarea required label="Итоговый комментарий руководителя" value={manager.finalComment} onChange={(value) => onUpdate({ ...manager, finalComment: value })} maxLength={1500} />
      <div className="form-footer"><span /><div><Button variant="secondary" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button><Button onClick={complete}>Завершить оценку</Button></div></div>
    </Card>
  </div>;
}

function TeamByCompetencies({ selfReviews, managerReviews, onUpdate, notify }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[]; onUpdate: (review: ManagerReview) => void; notify: (message: string) => void }) {
  const [competencyId, setCompetencyId] = useState(competencies[0].id);
  const competency = competencies.find((item) => item.id === competencyId) ?? competencies[0];
  const confirmAll = () => {
    employees.forEach((employee) => {
      const self = selfReviews.find((item) => item.employeeId === employee.id);
      const manager = managerReviews.find((item) => item.employeeId === employee.id) ?? createEmptyManagerReview(employee.id);
      onUpdate({ ...manager, competencyRatings: { ...manager.competencyRatings, [competency.id]: self?.competencyRatings[competency.id] || "no_info" } });
    });
    notify("Оценки по компетенции обновлены");
  };
  return <Card title="Калибровка по компетенции" description="Этот режим помогает сравнить команду по одной компетенции и быстро подтвердить самооценки.">
    <div className="competency-mode-head"><label className="demo-user"><span>Компетенция</span><select value={competencyId} onChange={(event) => setCompetencyId(event.target.value)}>{Object.entries(blockNames).map(([block, title]) => <optgroup key={block} label={title}>{byBlock(block).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}</select></label><Button variant="secondary" onClick={confirmAll}>Подтвердить самооценку всем</Button></div>
    <CompetencyDetails competency={competency} />
    <div className="matrix-block">{employees.map((employee) => {
      const self = selfReviews.find((item) => item.employeeId === employee.id) ?? createEmptySelfReview(employee.id);
      const manager = managerReviews.find((item) => item.employeeId === employee.id) ?? createEmptyManagerReview(employee.id);
      const updateRating = (rating: Rating) => onUpdate({ ...manager, competencyRatings: { ...manager.competencyRatings, [competency.id]: rating } });
      return <div key={employee.id} className="matrix-row matrix-row--competency"><div className="employee-mini"><Avatar employeeId={employee.id} /><div><strong>{employee.fullName}</strong><span>{employee.position}</span></div></div><div className="rating-cell"><span>Самооценка</span><b>{ratingLabel[self.competencyRatings[competency.id] ?? ""]}</b></div><div className="rating-cell rating-cell--wide"><span>Руководитель</span><RatingControl value={manager.competencyRatings[competency.id] ?? ""} options={isLeadership(competency) ? managerLeadershipOptions : managerBaseOptions} onChange={updateRating} /></div><div className="rating-cell"><span>Gap</span><b>{formatGap(gapForCompetency(self.competencyRatings[competency.id], manager.competencyRatings[competency.id]))}</b></div><Button variant="ghost" onClick={() => updateRating(self.competencyRatings[competency.id] || "no_info")}>Подтвердить</Button></div>;
    })}</div>
  </Card>;
}

function Analytics({ selfReviews, managerReviews }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[] }) {
  const completed = managerReviews.filter((review) => review.status === "completed");
  const employeeRows = employees.map((employee) => {
    const self = selfReviews.find((item) => item.employeeId === employee.id);
    const manager = managerReviews.find((item) => item.employeeId === employee.id);
    const indices = employeeIndices(self, manager);
    const disagreements = competencies.filter((competency) => {
      const gap = gapForCompetency(self?.competencyRatings[competency.id], manager?.competencyRatings[competency.id]);
      return gap !== null && Math.abs(gap) >= 1;
    }).length;
    return { employee, self, manager, indices, disagreements };
  });
  const avg = (values: (number | null)[]) => {
    const filtered = values.filter((value): value is number => value !== null);
    return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : null;
  };
  const metrics = [
    ["Manager Corporate", avg(employeeRows.map((row) => row.indices.managerCorporate))], ["Self Corporate", avg(employeeRows.map((row) => row.indices.selfCorporate))],
    ["Gap Index", avg(employeeRows.map((row) => row.indices.gap))], ["Manager Result", avg(employeeRows.map((row) => row.indices.managerResult))],
    ["Manager Technology", avg(employeeRows.map((row) => row.indices.managerTechnology))], ["Manager Team", avg(employeeRows.map((row) => row.indices.managerTeam))],
    ["Manager Leadership", avg(employeeRows.map((row) => row.indices.managerLeadership))],
  ] as const;
  const stats = competencyStats(selfReviews, managerReviews);
  const strongGaps = employeeRows.flatMap((row) => competencies.map((competency) => ({ row, competency, gap: gapForCompetency(row.self?.competencyRatings[competency.id], row.manager?.competencyRatings[competency.id]) })).filter((item) => item.gap !== null && Math.abs(item.gap) >= 1));
  return <div className="page"><div className="page-header"><div><div className="eyebrow">HR-аналитика</div><h1>Аналитика по компетенциям и gap</h1><p>Самооценка и оценка руководителя показываются отдельно. Блоки считаются только как агрегаты компетенций.</p></div></div>
    <div className="metric-grid">{metrics.map(([label, value]) => <Card key={label}><span>{label}</span><b>{formatIndex(value)}</b><small>{indexLabel(value)}</small></Card>)}<Card><span>Завершено</span><b>{completed.length}</b><small>оценок</small></Card><Card><span>Не завершено</span><b>{employees.length - completed.length}</b><small>оценок</small></Card></div>
    <Card title="Таблица по компетенциям"><div className="table-wrap"><table><thead><tr><th>Блок</th><th>Компетенция</th><th>Self avg</th><th>Manager avg</th><th>Gap</th><th>Ниже по руководителю</th><th>Выше по руководителю</th><th>No info</th></tr></thead><tbody>{stats.map((stat) => <tr key={stat.competency.id}><td>{blockNames[stat.competency.block]}</td><td>{stat.competency.title}</td><td>{formatIndex(stat.selfAvg)}</td><td>{formatIndex(stat.managerAvg)}</td><td>{formatIndex(stat.gap)}</td><td>{stat.managerBelow}</td><td>{stat.managerAbove}</td><td>{stat.noInfo}</td></tr>)}</tbody></table></div></Card>
    <Card title="Таблица по сотрудникам"><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Категория</th><th>Self Index</th><th>Manager Index</th><th>Gap</th><th>Расхождения</th><th>Статус</th></tr></thead><tbody>{employeeRows.map((row) => <tr key={row.employee.id}><td><strong>{row.employee.fullName}</strong><span>{row.employee.position}</span></td><td>{row.manager?.category || "—"}</td><td>{formatIndex(row.indices.selfCorporate)}</td><td>{formatIndex(row.indices.managerCorporate)}</td><td>{formatIndex(row.indices.gap)}</td><td>{row.disagreements}</td><td><Badge status={row.manager?.status === "completed" ? "completed" : "draft"} /></td></tr>)}</tbody></table></div></Card>
    <Card title="Gap-аналитика"><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Компетенция</th><th>Самооценка</th><th>Руководитель</th><th>Gap</th></tr></thead><tbody>{strongGaps.length ? strongGaps.map((item) => <tr key={`${item.row.employee.id}-${item.competency.id}`}><td>{item.row.employee.fullName}</td><td>{item.competency.title}</td><td>{ratingLabel[item.row.self?.competencyRatings[item.competency.id] ?? ""]}</td><td>{ratingLabel[item.row.manager?.competencyRatings[item.competency.id] ?? ""]}</td><td>{formatGap(item.gap)}</td></tr>) : <tr><td colSpan={5}>Сильных расхождений пока нет</td></tr>}</tbody></table></div></Card>
  </div>;
}

function ErrorBox({ title, errors }: { title: string; errors: string[] }) {
  return <div className="error-box"><strong>{title}</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>;
}

function formatGap(gap: number | null) {
  return gap === null ? "—" : `${gap > 0 ? "+" : ""}${gap}`;
}
