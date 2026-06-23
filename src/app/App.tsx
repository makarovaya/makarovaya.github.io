import { useState, type ReactNode } from "react";
import { competencies, createEmptyManagerReview, createEmptySelfReview, employees, skills } from "../data/mockData";
import { mappedSoftSkills } from "../data/softSkills";
import { loadState, resetState, saveManagerReviews, saveRole, saveSelectedEmployee, saveSelfReviews } from "../store/localStorageStore";
import type { Competency, Employee, EmployeeDevelopmentDirection, ManagementSituation, ManagerMainTrack, ManagerReview, Role, SelfReview, SkillMappedToCompetency } from "../types";
import { validateManager, validateSelf } from "../utils/validation";

const initial = loadState();
const roleOptions: { value: Role; label: string }[] = [{ value: "employee", label: "Я сотрудник" }, { value: "manager", label: "Я руководитель" }, { value: "analytics", label: "Аналитика HR" }];
const blockNames = { result: "Результат", technology: "Технологии", team: "Команда", leadership: "Лидерство" };
const categoryOptions = ["A", "B", "C", "D"] as const;
const managementSituations: { value: ManagementSituation; label: string; level: "level_1" | "level_2" | "level_3"; showLeadership: boolean }[] = [
  { value: "no_reports", label: "У меня нет подчинённых", level: "level_1", showLeadership: false },
  { value: "manages_specialists", label: "В подчинении специалисты", level: "level_1", showLeadership: true },
  { value: "manages_line_managers", label: "В подчинении линейные руководители", level: "level_2", showLeadership: true },
  { value: "manages_middle_managers", label: "В подчинении мидл-менеджеры", level: "level_3", showLeadership: true },
];
const employeeDirections: { value: EmployeeDevelopmentDirection; label: string }[] = [
  { value: "expertise", label: "Хочу усиливать экспертизу в своей области" },
  { value: "leadership", label: "Хочу развиваться в управленческой / лидерской роли" },
];
const managerTracks: { value: ManagerMainTrack; label: string }[] = [
  { value: "expert", label: "Экспертный трек" },
  { value: "management", label: "Управленческий трек" },
];

const getEmployee = (id: string) => employees.find((employee) => employee.id === id) ?? employees[0];
const itemTitle = (id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return skills.find((item) => item.id === id)?.title ?? mappedSoftSkills.find((item) => item.id === id)?.title ?? competencies.find((item) => item.id === id)?.title ?? id;
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

const softSkillsForSituation = (situation: ManagementSituation) => {
  const config = managementSituations.find((item) => item.value === situation);
  if (!config) return [];
  return mappedSoftSkills.filter((skill) => skill.level === config.level && (config.showLeadership || skill.blockId !== "leadership"));
};

function SelectionCounter({ strengths, growth }: { strengths: string[]; growth: string[] }) {
  return <div className="selection-counter"><span>Сильные стороны: <b>{strengths.length}</b> из 5</span><span>Зоны роста: <b>{growth.length}</b> из 5</span></div>;
}

function MappedSkillList({ mode, situation, strengths, growth, onChange, employeeStrengths = [], employeeGrowth = [] }: { mode: "employee" | "manager"; situation: ManagementSituation; strengths: string[]; growth: string[]; onChange: (next: { strengths: string[]; growth: string[] }) => void; employeeStrengths?: string[]; employeeGrowth?: string[] }) {
  const [info, setInfo] = useState<SkillMappedToCompetency | null>(null);
  const [query, setQuery] = useState("");
  const lowerQuery = query.trim().toLowerCase();
  const available = softSkillsForSituation(situation).filter((skill) => !lowerQuery || `${skill.title} ${skill.blockTitle} ${skill.competencyTitle}`.toLowerCase().includes(lowerQuery));
  const select = (id: string, target: "strength" | "growth") => {
    if (target === "strength") {
      const next = strengths.includes(id) ? strengths.filter((item) => item !== id) : strengths.length >= 5 ? strengths : [...strengths, id];
      onChange({ strengths: next, growth: growth.filter((item) => item !== id) });
    } else {
      const next = growth.includes(id) ? growth.filter((item) => item !== id) : growth.length >= 5 ? growth : [...growth, id];
      onChange({ strengths: strengths.filter((item) => item !== id), growth: next });
    }
  };
  if (!situation) return <div className="empty-note">Сначала выберите управленческую ситуацию, чтобы увидеть подходящий набор навыков.</div>;
  return <div className="mapped-skills">
    <SelectionCounter strengths={strengths} growth={growth} />
    <input className="skill-search" value={query} placeholder="Поиск по навыку, компетенции или блоку" onChange={(event) => setQuery(event.target.value)} />
    {Object.entries(blockNames).map(([block, blockTitle]) => {
      const blockItems = available.filter((skill) => skill.blockId === block);
      if (!blockItems.length) return null;
      const competencyIds = [...new Set(blockItems.map((skill) => skill.competencyId))];
      return <section className="mapped-block" key={block}><h3>{blockTitle}</h3>{competencyIds.map((competencyId) => {
        const items = blockItems.filter((skill) => skill.competencyId === competencyId);
        const first = items[0];
        return <div className="mapped-competency" key={competencyId}><div className="mapped-competency__head"><h4>{first.competencyTitle}</h4>{first.competencyShortDescription && <p>{first.competencyShortDescription}</p>}</div>{items.map((skill) => {
          const isStrength = strengths.includes(skill.id);
          const isGrowth = growth.includes(skill.id);
          const strengthDisabled = strengths.length >= 5 && !isStrength;
          const growthDisabled = growth.length >= 5 && !isGrowth;
          return <div className="mapped-skill-row" key={skill.id}><div><strong>{skill.title}</strong>{mode === "manager" && (employeeStrengths.includes(skill.id) || employeeGrowth.includes(skill.id)) && <span className="employee-choice">{employeeStrengths.includes(skill.id) ? "Выбор сотрудника: сильная сторона" : "Выбор сотрудника: зона роста"}</span>}</div><div className="mapped-skill-row__actions"><button type="button" disabled={strengthDisabled} className={isStrength ? "is-selected" : ""} onClick={() => select(skill.id, "strength")}>Сильная сторона</button><button type="button" disabled={growthDisabled} className={isGrowth ? "is-selected growth" : ""} onClick={() => select(skill.id, "growth")}>Зона роста</button><button type="button" className="info-button" onClick={() => setInfo(skill)}>i</button></div></div>;
        })}</div>;
      })}</section>;
    })}
    <SkillInfoSidePanel skill={info} mode={mode} onClose={() => setInfo(null)} />
  </div>;
}

function SkillInfoSidePanel({ skill, mode, onClose }: { skill: SkillMappedToCompetency | null; mode: "employee" | "manager"; onClose: () => void }) {
  const description = skill?.fullDescription || (mode === "employee" ? skill?.employeeHint : skill?.managerHint);
  return <div className={`side-panel-backdrop ${skill ? "is-open" : ""}`} onMouseDown={onClose}><aside className="side-panel" onMouseDown={(event) => event.stopPropagation()}>{skill && <><div className="eyebrow">{skill.blockTitle} · {skill.competencyTitle}</div><h2>{skill.title}</h2><p>{description}</p><Button onClick={onClose}>Закрыть</Button></>}</aside></div>;
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
  const setSoft = (next: { strengths: string[]; growth: string[] }) => onUpdate({ ...review, softStrengths: next.strengths, softGrowthAreas: next.growth, corporateStrengths: next.strengths, corporateDevelopment: next.growth });
  const changeSituation = (value: ManagementSituation) => {
    onUpdate({ ...review, managementSituation: value, softStrengths: [], softGrowthAreas: [], corporateStrengths: [], corporateDevelopment: [] });
  };
  const fillDemo = () => onUpdate({ ...review, status: "draft", accomplishments: [], hardStrengths: ["data", "stakeholders"], hardDevelopment: ["presentations"], managementSituation: "no_reports", softStrengths: ["result-sozdaet-luchshiy-opyt-level_1-analiz-situacii-klienta-zakazchika-i-konteksta"], softGrowthAreas: ["technology-vnedryaet-tehnologii-level_1-primenenie-ii"], corporateStrengths: ["result-sozdaet-luchshiy-opyt-level_1-analiz-situacii-klienta-zakazchika-i-konteksta"], corporateDevelopment: ["technology-vnedryaet-tehnologii-level_1-primenenie-ii"], preferredDevelopmentDirection: "expertise", interestedInMentoring: true, employeeComment: "Хочу развивать экспертизу и попробовать роль наставника.", developmentFocus: "", notes: "" });
  const save = () => { setSaving(true); window.setTimeout(() => { onUpdate(review); setSaving(false); notify("Черновик сохранён"); }, 400); };
  const submit = () => {
    const nextErrors = validateSelf(review); setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...review, status: "submitted" }); notify("Самооценка отправлена"); }
  };
  if (review.status === "submitted") return <Card className="success-state"><div className="success-state__icon">✓</div><Badge status="submitted" /><h2>Самооценка отправлена руководителю</h2><p>Данные сохранены. После завершения оценки руководителем здесь появится итоговая обратная связь.</p></Card>;
  return <>
    <Card className="intro-card"><div className="intro-card__row"><div><Badge status={review.status} /><h2>Самооценка за 2026 год</h2><p>Выберите hard skills, soft skills и направление развития. Категория не рассчитывается автоматически.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить примером</Button></div></Card>
    <div className="stepper stepper--three">{["Hard skills", "Soft skills", "Развитие"].map((title, index) => <button type="button" className={index === step ? "is-active" : index < step ? "is-done" : ""} key={title} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span>{title}</button>)}</div>
    {errors.length > 0 && <div className="error-box"><strong>Проверьте обязательные поля</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    {step === 0 && <Card title="Hard skills" eyebrow="Шаг 1 из 3" description="Выберите профессиональные навыки, знания или инструменты, которые вы считаете своими сильными сторонами, и те, которые являются зонами роста.">
      <div className="subsection"><h3>Сильные стороны <small>от 1 до 3</small></h3><SkillPicker selected={review.hardStrengths} onChange={(items) => set("hardStrengths", items.slice(0, 3))} tone="strength" exclude={review.hardDevelopment} /></div>
      <div className="subsection"><h3>Зоны роста <small>от 1 до 3</small></h3><SkillPicker selected={review.hardDevelopment} onChange={(items) => set("hardDevelopment", items.slice(0, 3))} tone="development" exclude={review.hardStrengths} /></div>
    </Card>}
    {step === 1 && <Card title="Soft skills" eyebrow="Шаг 2 из 3">
      <label className="field"><span className="field__label">Какая управленческая ситуация ближе всего описывает вашу роль?<b>*</b></span><select className="select-control" value={review.managementSituation} onChange={(event) => changeSituation(event.target.value as ManagementSituation)}><option value="">Выберите вариант</option>{managementSituations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      {review.managementSituation && <p className="soft-skill-instruction">Выберите навыки, которые вы считаете своими сильными сторонами, и навыки, которые являются зонами роста. Навыки сгруппированы по корпоративной модели компетенций.</p>}
      <MappedSkillList mode="employee" situation={review.managementSituation} strengths={review.softStrengths?.length ? review.softStrengths : review.corporateStrengths} growth={review.softGrowthAreas?.length ? review.softGrowthAreas : review.corporateDevelopment} onChange={setSoft} />
    </Card>}
    {step === 2 && <Card title="Развитие" eyebrow="Шаг 3 из 3" description="Выберите направление, в котором вам было бы интересно развиваться дальше. Руководитель увидит ваш выбор и сможет учесть его при обсуждении следующего периода.">
      <div className="radio-card-grid">{employeeDirections.map((item) => <button type="button" key={item.value} className={`radio-card ${review.preferredDevelopmentDirection === item.value ? "is-selected" : ""}`} onClick={() => set("preferredDevelopmentDirection", item.value)}>{item.label}</button>)}</div>
      <label className="check-row"><input type="checkbox" checked={!!review.interestedInMentoring} onChange={(event) => set("interestedInMentoring", event.target.checked)} /><span>Хочу развиваться в роли ментора / наставника</span><small>Можно выбрать независимо от основного направления развития.</small></label>
      <Textarea label="Комментарий" value={review.employeeComment} onChange={(value) => set("employeeComment", value)} maxLength={1000} hint="Можно добавить, почему вам интересен выбранный трек или какие задачи развития для вас важны." />
    </Card>}
    <div className="form-footer"><Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</Button><div>{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}{step < 2 ? <Button onClick={() => setStep(step + 1)}>Продолжить</Button> : <Button onClick={submit}>Отправить руководителю</Button>}</div></div>
  </>;
}

function EmployeeResult({ employee, review }: { employee: Employee; review: ManagerReview }) {
  const mainTrack = managerTracks.find((item) => item.value === review.mainTrack)?.label ?? "Не выбран";
  return <><Card className="result-hero"><div><div className="eyebrow">Итоговая обратная связь</div><h2>{employee.fullName}, оценка завершена</h2><p>Обсудите результат с руководителем и договоритесь о следующих шагах в выбранном треке.</p></div><div className="category"><span>Категория сотрудника на основе оценки результативности</span><strong>{review.category}</strong></div></Card>
    <div className="result-grid"><Card title="Hard skills · сильные стороны"><TagList ids={review.hardStrengths} tone="strength" /></Card><Card title="Hard skills · зоны роста"><TagList ids={review.hardDevelopment} tone="development" /></Card><Card title="Soft skills · сильные стороны"><TagList ids={review.corporateStrengths} tone="strength" /></Card><Card title="Soft skills · зоны роста"><TagList ids={review.corporateDevelopment} tone="development" /></Card><Card title="Трек на следующий период"><p className="feedback">{mainTrack}</p>{review.mentorTrack && <p className="feedback">Трек наставника / ментора</p>}{review.retentionTrack && <p className="feedback">Ключевой эксперт / трек удержания</p>}{review.successorTrack && <p className="feedback">Преемник на позицию{review.successorPosition ? `: ${review.successorPosition}` : ""}</p>}</Card><Card title="Комментарий руководителя"><p className="feedback">{review.managerComment || review.finalComment || "Комментарий не заполнен."}</p></Card></div></>;
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
  const employeeSoftStrengths = selfReview.softStrengths?.length ? selfReview.softStrengths : selfReview.corporateStrengths;
  const employeeSoftGrowth = selfReview.softGrowthAreas?.length ? selfReview.softGrowthAreas : selfReview.corporateDevelopment;
  const fillDemo = () => { const next = { ...review, category: "B" as const, hardStrengths: selfReview.hardStrengths.length ? selfReview.hardStrengths.slice(0, 3) : ["data"], hardDevelopment: selfReview.hardDevelopment.length ? selfReview.hardDevelopment.slice(0, 3) : ["presentations"], corporateStrengths: employeeSoftStrengths.slice(0, 5), corporateDevelopment: employeeSoftGrowth.slice(0, 5), mainTrack: selfReview.preferredDevelopmentDirection === "leadership" ? "management" as const : "expert" as const, mentorTrack: selfReview.interestedInMentoring, retentionTrack: false, successorTrack: false, managerComment: "Трек выбран с учётом самооценки сотрудника.", finalComment: "Трек выбран с учётом самооценки сотрудника." }; onUpdate(next); };
  const complete = () => { const nextErrors = validateManager(review); setErrors(nextErrors); if (!nextErrors.length) { onUpdate({ ...review, status: "completed" }); notify("Оценка руководителя завершена"); onComplete(); } };
  return <div className="manager-page">
    <div className="manager-header"><Button variant="ghost" onClick={onBack}>← Вернуться к списку</Button><div><h1>{employee.fullName}</h1><p>{employee.position} · {employee.department}</p></div><Badge status={review.status} /></div>
    {errors.length > 0 && <div className="error-box error-box--floating"><strong>Не хватает данных для завершения</strong>{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    <div className="split">
      <aside className="split__left">
        <div className="panel-title"><div><div className="eyebrow">Самооценка сотрудника</div><h2>Контекст для оценки</h2></div><Badge status={selfReview.status} /></div>
        {selfReview.status === "draft" && <div className="empty-note">Самооценка ещё не отправлена. Можно открыть карточку, но завершать оценку лучше после получения контекста.</div>}
        <SummaryTags title="Hard skills · сильные стороны" items={selfReview.hardStrengths.map(itemTitle)} tone="strength" />
        <SummaryTags title="Hard skills · зоны роста" items={selfReview.hardDevelopment.map(itemTitle)} tone="development" />
        <SummaryTags title="Soft skills · сильные стороны" items={employeeSoftStrengths.map(itemTitle)} tone="strength" />
        <SummaryTags title="Soft skills · зоны роста" items={employeeSoftGrowth.map(itemTitle)} tone="development" />
        <SummaryTags title="Предпочтения в развитии" items={[employeeDirections.find((item) => item.value === selfReview.preferredDevelopmentDirection)?.label ?? "Не выбрано", selfReview.interestedInMentoring ? "Интерес к роли ментора / наставника" : ""].filter(Boolean)} />
        {selfReview.employeeComment && <SummaryTags title="Комментарий сотрудника" items={[selfReview.employeeComment]} />}
      </aside>
      <section className="split__right">
        <Card className="manager-intro"><div className="intro-card__row"><div><div className="eyebrow">Управленческая оценка</div><h2>Выбор навыков и трека развития</h2><p>Используйте самооценку как контекст: подтвердите выбор сотрудника, скорректируйте его или добавьте свои наблюдения.</p></div><Button variant="secondary" onClick={fillDemo}>Заполнить по самооценке</Button></div></Card>
        <Card title="Категория сотрудника на основе оценки результативности" description="Категория не рассчитывается автоматически из компетенций. Выберите её на основе результата за период.">
          <Segmented value={review.category} options={categoryOptions.map((value) => ({ value, label: value }))} onChange={(value) => set("category", value)} compact />
        </Card>
        <Card title="Профессиональные навыки" description="Быстро подтвердите выбор сотрудника или добавьте свои наблюдения.">
          <QuickCopy label="Подтвердить навыки, которые помогали результату" onClick={() => setWithDraft({ hardStrengths: [...new Set([...review.hardStrengths, ...selfReview.hardStrengths])].slice(0, 3) })} /><SkillPicker selected={review.hardStrengths} onChange={(items) => setWithDraft({ hardStrengths: items.slice(0, 3) })} tone="manager-strength" exclude={review.hardDevelopment} />
          <div className="divider" /><QuickCopy label="Подтвердить навыки, которые стоит усилить" onClick={() => setWithDraft({ hardDevelopment: [...new Set([...review.hardDevelopment, ...selfReview.hardDevelopment])].slice(0, 3) })} /><SkillPicker selected={review.hardDevelopment} onChange={(items) => setWithDraft({ hardDevelopment: items.slice(0, 3) })} tone="manager-development" exclude={review.hardStrengths} />
        </Card>
        <Card title="Soft skills" description="Выберите навыки, которые вы считаете сильными сторонами сотрудника, и навыки, которые являются зонами роста. Вы можете подтвердить выбор сотрудника или скорректировать его.">
          <QuickCopy label="Подтвердить выбор сотрудника" onClick={() => setWithDraft({ corporateStrengths: employeeSoftStrengths.slice(0, 5), corporateDevelopment: employeeSoftGrowth.slice(0, 5) })} />
          <MappedSkillList mode="manager" situation={selfReview.managementSituation || "no_reports"} strengths={review.corporateStrengths} growth={review.corporateDevelopment} employeeStrengths={employeeSoftStrengths} employeeGrowth={employeeSoftGrowth} onChange={(next) => setWithDraft({ corporateStrengths: next.strengths, corporateDevelopment: next.growth })} />
        </Card>
        <Card title="Трек сотрудника на следующий период" description="Выберите трек, который считаете приоритетным для сотрудника на следующий период. Вы можете учесть предпочтение сотрудника или скорректировать его.">
          <div className="preference-note"><strong>Выбор сотрудника:</strong> {employeeDirections.find((item) => item.value === selfReview.preferredDevelopmentDirection)?.label ?? "не выбран"}{selfReview.interestedInMentoring ? " · интерес к менторству" : ""}</div>
          <div className="radio-card-grid">{managerTracks.map((item) => <button type="button" key={item.value} className={`radio-card ${review.mainTrack === item.value ? "is-selected" : ""}`} onClick={() => set("mainTrack", item.value)}>{item.label}</button>)}</div>
          <h3 className="additional-tracks-title">Также можно выбрать дополнительные треки</h3>
          <label className="check-row"><input type="checkbox" checked={!!review.mentorTrack} onChange={(event) => set("mentorTrack", event.target.checked)} /><span>Трек наставника / ментора</span></label>
          <label className="check-row"><input type="checkbox" checked={!!review.retentionTrack} onChange={(event) => set("retentionTrack", event.target.checked)} /><span>Ключевой эксперт / трек удержания</span><small>Для сотрудников с редкой экспертизой или высоким риском потери ценных знаний.</small></label>
          <label className="check-row"><input type="checkbox" checked={!!review.successorTrack} onChange={(event) => set("successorTrack", event.target.checked)} /><span>Преемник на позицию</span><small>Для сотрудников, которых можно рассматривать как потенциальных преемников на позицию от 8 грейда.</small></label>
          {review.successorTrack && <label className="field"><span className="field__label">Позиция, на которую рассматривается сотрудник<b>*</b></span><input value={review.successorPosition} placeholder="Например: Руководитель направления, Директор департамента" onChange={(event) => set("successorPosition", event.target.value)} /></label>}
          <Textarea label="Комментарий руководителя" value={review.managerComment || review.finalComment} onChange={(value) => onUpdate({ ...review, managerComment: value, finalComment: value })} maxLength={1500} hint="Можно пояснить выбранный трек или добавить рекомендации для обсуждения с сотрудником." />
        </Card>
        <div className="form-footer"><Button variant="ghost" onClick={onBack}>Вернуться к списку</Button><div><Button variant="secondary" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button><Button onClick={complete}>Завершить оценку</Button></div></div>
      </section>
    </div>
  </div>;
}

function QuickCopy({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" className="quick-copy" onClick={onClick}>+ {label}</button>; }
function SummaryTags({ title, items, tone = "default" }: { title: string; items: string[]; tone?: string }) {
  return <div className="summary-section"><h3>{title}</h3>{items.length ? <div className="summary-section__items">{items.map((item) => <span className={`summary-pill summary-pill--${tone}`} key={item}>{item}</span>)}</div> : <p className="muted">Пока не заполнено</p>}</div>;
}

const mainTrackLabel = (value: ManagerMainTrack) => managerTracks.find((item) => item.value === value)?.label ?? "—";
const directionLabel = (value: EmployeeDevelopmentDirection) => employeeDirections.find((item) => item.value === value)?.label ?? "—";
const isTrackAligned = (self?: SelfReview, manager?: ManagerReview) => {
  if (!self?.preferredDevelopmentDirection || !manager?.mainTrack) return false;
  return (self.preferredDevelopmentDirection === "expertise" && manager.mainTrack === "expert") || (self.preferredDevelopmentDirection === "leadership" && manager.mainTrack === "management");
};

function Analytics({ selfReviews, managerReviews }: { selfReviews: SelfReview[]; managerReviews: ManagerReview[] }) {
  const completed = managerReviews.filter((review) => review.status === "completed");
  const frequency = (lists: string[][]) => {
    const counts = new Map<string, number>(); lists.flat().forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const selfStrengths = (review: SelfReview) => review.softStrengths?.length ? review.softStrengths : review.corporateStrengths;
  const selfGrowth = (review: SelfReview) => review.softGrowthAreas?.length ? review.softGrowthAreas : review.corporateDevelopment;
  const mainTrackCounts = [
    { track: "Экспертный трек", count: managerReviews.filter((review) => review.mainTrack === "expert").length },
    { track: "Управленческий трек", count: managerReviews.filter((review) => review.mainTrack === "management").length },
    { track: "Трек наставника / ментора", count: managerReviews.filter((review) => review.mentorTrack).length },
    { track: "Ключевой эксперт / трек удержания", count: managerReviews.filter((review) => review.retentionTrack).length },
    { track: "Преемник на позицию", count: managerReviews.filter((review) => review.successorTrack).length },
  ];
  const preferenceCounts = [
    { preference: "Экспертиза", count: selfReviews.filter((review) => review.preferredDevelopmentDirection === "expertise").length },
    { preference: "Управление / лидерство", count: selfReviews.filter((review) => review.preferredDevelopmentDirection === "leadership").length },
    { preference: "Интерес к менторству", count: selfReviews.filter((review) => review.interestedInMentoring).length },
  ];
  const alignedCount = employees.filter((employee) => isTrackAligned(selfReviews.find((item) => item.employeeId === employee.id), managerReviews.find((item) => item.employeeId === employee.id))).length;
  return <div className="page"><div className="page-header"><div><div className="eyebrow">HR-аналитика</div><h1>Сводка по циклу оценки</h1><p>Самооценка и оценка руководителя разделены. Аналитика показывает выбранные навыки и треки без расчёта категории.</p></div><div className="deadline"><span>Цикл</span><strong>Performance Review 2026</strong></div></div>
    <div className="metric-grid"><Card><span>Завершено</span><b>{completed.length}</b><small>из {employees.length} оценок</small></Card><Card><span>В работе</span><b>{employees.length - completed.length}</b><small>требуют внимания</small></Card><Card><span>Основной трек выбран</span><b>{managerReviews.filter((review) => review.mainTrack).length}</b><small>сотрудников</small></Card><Card><span>Совпадение треков</span><b>{alignedCount}</b><small>самооценка и руководитель</small></Card></div>
    <div className="analytics-grid"><Card title="Распределение треков руководителя"><div className="table-wrap"><table><thead><tr><th>Трек</th><th>Количество сотрудников</th></tr></thead><tbody>{mainTrackCounts.map((row) => <tr key={row.track}><td>{row.track}</td><td>{row.count}</td></tr>)}</tbody></table></div></Card><Card title="Предпочтения сотрудников"><div className="table-wrap"><table><thead><tr><th>Предпочтение</th><th>Количество сотрудников</th></tr></thead><tbody>{preferenceCounts.map((row) => <tr key={row.preference}><td>{row.preference}</td><td>{row.count}</td></tr>)}</tbody></table></div></Card></div>
    <Card title="Сотрудники"><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Категория</th><th>Выбор сотрудника</th><th>Выбор руководителя</th><th>Совпадение</th><th>Статус</th></tr></thead><tbody>{employees.map((employee) => { const self = selfReviews.find((item) => item.employeeId === employee.id); const review = managerReviews.find((item) => item.employeeId === employee.id); const aligned = isTrackAligned(self, review); return <tr key={employee.id}><td><strong>{employee.fullName}</strong><span>{employee.position}</span></td><td>{review?.category || "—"}</td><td>{directionLabel(self?.preferredDevelopmentDirection ?? "")}</td><td>{mainTrackLabel(review?.mainTrack ?? "")}</td><td>{self?.preferredDevelopmentDirection && review?.mainTrack ? aligned ? "Да" : "Нет" : "—"}</td><td><Badge status={review?.status === "completed" ? "completed" : "draft"} /></td></tr>; })}</tbody></table></div></Card>
    <div className="analytics-grid"><FrequencyCard title="Навыки по самооценке" subtitle="Топ выборов сотрудников" strengths={frequency(selfReviews.map(selfStrengths))} development={frequency(selfReviews.map(selfGrowth))} /><FrequencyCard title="Навыки по оценке руководителей" subtitle="Топ выборов руководителей" strengths={frequency(managerReviews.map((item) => item.corporateStrengths))} development={frequency(managerReviews.map((item) => item.corporateDevelopment))} /></div>
  </div>;
}

function FrequencyCard({ title, subtitle, strengths, development }: { title: string; subtitle: string; strengths: [string, number][]; development: [string, number][] }) {
  return <Card title={title} description={subtitle}><h3 className="frequency-title">Помогали результату</h3><div className="frequency">{strengths.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div><h3 className="frequency-title">Стоит усилить</h3><div className="frequency">{development.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div></Card>;
}
