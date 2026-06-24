import { useState, type ReactNode } from "react";
import { competencies, createEmptyManagerReview, createEmptySelfReview, employees, skills } from "../data/mockData";
import { mappedSoftSkills } from "../data/softSkillsMapping";
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
const managerTracks: { value: ManagerMainTrack; label: string; description: string }[] = [
  { value: "expert", label: "Экспертный трек", description: "Развитие глубокой экспертизы и профессионального влияния" },
  { value: "management", label: "Управленческий трек", description: "Развитие управленческих компетенций и лидерских навыков" },
];
const mappedSoftSkillIds = new Set(mappedSoftSkills.map((skill) => skill.id));

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

function Textarea({ label, value, onChange, maxLength = 1000, hint, required = false, rows = 4, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; hint?: string; required?: boolean; rows?: number; placeholder?: string }) {
  return <label className="field"><span className="field__label">{label}{required && <b>*</b>}</span>{hint && <span className="field__hint">{hint}</span>}<textarea rows={rows} maxLength={maxLength} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /><span className="field__count">{value.length} / {maxLength}</span></label>;
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
const softSelectionFromReview = (primary: string[] = [], fallback: string[] = []) => {
  const source = primary.some((id) => mappedSoftSkillIds.has(id)) ? primary : fallback;
  return source.filter((id) => mappedSoftSkillIds.has(id));
};
type SoftInfoPanelContent = {
  eyebrow: string;
  title: string;
  description?: string;
  details?: { label: string; value: string }[];
};

function SelectionCounter({ strengths, growth }: { strengths: string[]; growth: string[] }) {
  return <div className="selection-counter"><span>Сильные стороны: <b>{strengths.length}</b> из 5</span><span>Зоны роста: <b>{growth.length}</b> из 5</span></div>;
}

function MappedSkillList({ mode, situation, strengths, growth, onChange, employeeStrengths = [], employeeGrowth = [], notify = () => undefined }: { mode: "employee" | "manager"; situation: ManagementSituation; strengths: string[]; growth: string[]; onChange: (next: { strengths: string[]; growth: string[] }) => void; employeeStrengths?: string[]; employeeGrowth?: string[]; notify?: (message: string) => void }) {
  const [info, setInfo] = useState<SoftInfoPanelContent | null>(null);
  const [activeTarget, setActiveTarget] = useState<"strength" | "growth">("strength");
  const [query, setQuery] = useState("");
  const lowerQuery = query.trim().toLowerCase();
  const selectedIds = new Set([...strengths, ...growth, ...employeeStrengths, ...employeeGrowth]);
  const situationSkills = softSkillsForSituation(situation);
  const situationConfig = managementSituations.find((item) => item.value === situation);
  const outsideSituationSkills = mappedSoftSkills.filter((skill) => selectedIds.has(skill.id) && (situationConfig?.showLeadership || skill.blockId !== "leadership") && !situationSkills.some((item) => item.id === skill.id));
  const searched = [...situationSkills, ...outsideSituationSkills].filter((skill) => !lowerQuery || `${skill.title} ${skill.blockTitle} ${skill.competencyTitle}`.toLowerCase().includes(lowerQuery));
  const select = (id: string) => {
    if (activeTarget === "strength") {
      if (growth.includes(id)) return notify("Навык уже выбран как зона роста. Сначала удалите его из зон роста.");
      if (!strengths.includes(id) && strengths.length >= 5) return notify("Можно выбрать не больше 5 навыков.");
      onChange({ strengths: strengths.includes(id) ? strengths.filter((item) => item !== id) : [...strengths, id], growth });
    } else {
      if (strengths.includes(id)) return notify("Навык уже выбран как сильная сторона. Сначала удалите его из сильных сторон.");
      if (!growth.includes(id) && growth.length >= 5) return notify("Можно выбрать не больше 5 навыков.");
      onChange({ strengths, growth: growth.includes(id) ? growth.filter((item) => item !== id) : [...growth, id] });
    }
  };
  const skillInfo = (skill: SkillMappedToCompetency): SoftInfoPanelContent => ({ eyebrow: "Описание навыка", title: skill.title, details: [{ label: "Блок", value: skill.blockTitle }, { label: "Компетенция", value: skill.competencyTitle }], description: skill.fullDescription || skill.employeeHint || skill.managerHint });
  const competencyInfo = (skill: SkillMappedToCompetency): SoftInfoPanelContent => ({ eyebrow: skill.blockTitle, title: skill.competencyTitle, description: skill.competencyShortDescription || "Описание компетенции не заполнено." });
  const chipState = (skill: SkillMappedToCompetency) => {
    const employeeStrength = employeeStrengths.includes(skill.id);
    const employeeGrowthSelected = employeeGrowth.includes(skill.id);
    const managerStrength = strengths.includes(skill.id);
    const managerGrowth = growth.includes(skill.id);
    return {
      employeeStrength,
      employeeGrowth: employeeGrowthSelected,
      managerStrength,
      managerGrowth,
      match: (employeeStrength && managerStrength) || (employeeGrowthSelected && managerGrowth),
      conflict: (employeeStrength && managerGrowth) || (employeeGrowthSelected && managerStrength),
    };
  };
  const renderChip = (skill: SkillMappedToCompetency) => {
    const state = chipState(skill);
    const selectedAsStrength = strengths.includes(skill.id);
    const selectedAsGrowth = growth.includes(skill.id);
    return <button type="button" key={skill.id} className={`soft-chip ${selectedAsStrength ? "is-strength" : ""} ${selectedAsGrowth ? "is-growth" : ""} ${mode === "manager" && (state.employeeStrength || state.employeeGrowth) ? "is-employee" : ""} ${state.match ? "is-match" : ""} ${state.conflict ? "is-conflict" : ""}`} onClick={() => select(skill.id)} title={state.match ? "Совпадает с выбором сотрудника" : state.conflict ? "Расхождение с выбором сотрудника" : undefined}>
      <span>{skill.title}</span>
      {mode === "manager" && (state.employeeStrength || state.employeeGrowth) && <small>сотр.</small>}
      {state.match && <small>✓</small>}
      {state.conflict && <small>!</small>}
      <span className="soft-chip__info" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setInfo(skillInfo(skill)); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setInfo(skillInfo(skill)); } }}>i</span>
    </button>;
  };
  const renderCompetencies = (items: SkillMappedToCompetency[]) => [...new Set(items.map((skill) => skill.competencyId))].map((competencyId) => {
    const competencyItems = items.filter((skill) => skill.competencyId === competencyId);
    const first = competencyItems[0];
    return <div className="soft-competency-card" key={competencyId}><div className="soft-competency-card__head"><h4>{first.competencyTitle}</h4><button type="button" className="info-button" aria-label={`Описание компетенции ${first.competencyTitle}`} onClick={() => setInfo(competencyInfo(first))}>i</button></div><div className="soft-chip-list">{competencyItems.map(renderChip)}</div></div>;
  });
  const renderBlock = (block: "result" | "technology" | "team" | "leadership") => {
    const blockItems = searched.filter((skill) => skill.blockId === block);
    if (!blockItems.length) return null;
    return <section className={`soft-block-column soft-block-column--${block}`} key={block}><h3>{blockNames[block]}</h3>{renderCompetencies(blockItems)}</section>;
  };
  if (!situation) return <div className="empty-note">Сначала выберите управленческую ситуацию, чтобы увидеть подходящий набор навыков.</div>;
  return <div className="mapped-skills">
    <div className="soft-skills-top"><div><div className="soft-mode-toggle"><button type="button" className={activeTarget === "strength" ? "is-active" : ""} onClick={() => setActiveTarget("strength")}>Сильные стороны {strengths.length}/5</button><button type="button" className={activeTarget === "growth" ? "is-active growth" : ""} onClick={() => setActiveTarget("growth")}>Зоны роста {growth.length}/5</button></div><input className="skill-search" value={query} placeholder="Поиск по навыку, компетенции или блоку" onChange={(event) => setQuery(event.target.value)} /></div><SelectedSoftSummary strengths={strengths} growth={growth} /></div>
    {mode === "manager" && <div className="soft-legend"><span>сотр. выбрал сотрудник</span><span>✓ совпадает</span><span>! расхождение</span></div>}
    {!searched.length && <div className="empty-note">По вашему поиску ничего не найдено.</div>}
    <div className="soft-block-grid">{(["result", "technology", "team"] as const).map(renderBlock)}</div>
    {renderBlock("leadership")}
    <SkillInfoSidePanel skill={info} mode={mode} onClose={() => setInfo(null)} />
  </div>;
}

function SelectedSoftSummary({ strengths, growth }: { strengths: string[]; growth: string[] }) {
  const empty = !strengths.length && !growth.length;
  return <aside className="selected-soft-summary"><strong>Выбрано</strong>{empty ? <p>Не выбрано</p> : <><span>Сильные стороны:</span><div>{strengths.slice(0, 4).map((id) => <em key={id}>{itemTitle(id)}</em>)}{strengths.length > 4 && <small>+ ещё {strengths.length - 4}</small>}</div><span>Зоны роста:</span><div>{growth.slice(0, 4).map((id) => <em className="growth" key={id}>{itemTitle(id)}</em>)}{growth.length > 4 && <small>+ ещё {growth.length - 4}</small>}</div></>}</aside>;
}

function SkillInfoSidePanel({ skill, onClose }: { skill: SoftInfoPanelContent | null; mode: "employee" | "manager"; onClose: () => void }) {
  return <div className={`side-panel-backdrop ${skill ? "is-open" : ""}`} onMouseDown={onClose}><aside className="side-panel" onMouseDown={(event) => event.stopPropagation()}>{skill && <><div className="eyebrow">{skill.eyebrow}</div><h2>{skill.title}</h2>{skill.details?.map((item) => <p className="side-panel__meta" key={item.label}><strong>{item.label}:</strong> {item.value}</p>)}<h3>Описание:</h3><p>{skill.description}</p><Button onClick={onClose}>Закрыть</Button></>}</aside></div>;
}

function Avatar({ employee }: { employee: Employee }) {
  return <div className="avatar">{employee.avatarInitials}</div>;
}

function Toast({ message }: { message: string }) {
  return message ? <div className="toast">{message}</div> : null;
}

function ConfirmDialog({ message, confirmLabel, cancelLabel = "Отмена", onConfirm, onCancel }: { message: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal confirm-dialog" onMouseDown={(event) => event.stopPropagation()}><h2>Подтвердите действие</h2><p>{message}</p><div className="confirm-dialog__actions"><Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;
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
  const [pendingSituation, setPendingSituation] = useState<ManagementSituation | null>(null);
  const set = <K extends keyof SelfReview>(key: K, value: SelfReview[K]) => onUpdate({ ...review, [key]: value });
  const setSoft = (next: { strengths: string[]; growth: string[] }) => onUpdate({ ...review, softStrengths: next.strengths, softGrowthAreas: next.growth, corporateStrengths: next.strengths, corporateDevelopment: next.growth });
  const applySituation = (value: ManagementSituation) => {
    onUpdate({ ...review, managementSituation: value, softStrengths: [], softGrowthAreas: [], corporateStrengths: [], corporateDevelopment: [] });
  };
  const changeSituation = (value: ManagementSituation) => {
    if (value === review.managementSituation) return;
    const hasSelection = (review.softStrengths.length || review.softGrowthAreas.length || review.corporateStrengths.length || review.corporateDevelopment.length) > 0;
    if (hasSelection) return setPendingSituation(value);
    applySituation(value);
  };
  const fillDemo = () => onUpdate({ ...review, status: "draft", accomplishments: [], hardStrengths: ["data", "stakeholders"], hardDevelopment: ["presentations"], managementSituation: "no_reports", softStrengths: ["result-sozdaet-luchshiy-opyt-level_1-analiz-situacii-klienta-zakazchika-i-konteksta"], softGrowthAreas: ["technology-vnedryaet-tehnologii-level_1-primenenie-ii"], corporateStrengths: ["result-sozdaet-luchshiy-opyt-level_1-analiz-situacii-klienta-zakazchika-i-konteksta"], corporateDevelopment: ["technology-vnedryaet-tehnologii-level_1-primenenie-ii"], preferredDevelopmentDirection: "expertise", interestedInMentoring: true, employeeComment: "Хочу развивать экспертизу и попробовать роль наставника.", developmentFocus: "", notes: "" });
  const save = () => { setSaving(true); window.setTimeout(() => { onUpdate(review); setSaving(false); notify("Черновик сохранён"); }, 400); };
  const submit = () => {
    const nextErrors = validateSelf(review); setErrors(nextErrors);
    if (!nextErrors.length) { onUpdate({ ...review, status: "submitted" }); notify("Самооценка отправлена"); }
  };
  if (review.status === "submitted") return <Card className="success-state"><div className="success-state__icon">✓</div><Badge status="submitted" /><h2>Самооценка отправлена руководителю</h2><p>Встретьтесь с руководителем и обсудите вашу самооценку</p></Card>;
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
      <MappedSkillList mode="employee" situation={review.managementSituation} strengths={review.softStrengths?.length ? review.softStrengths : review.corporateStrengths} growth={review.softGrowthAreas?.length ? review.softGrowthAreas : review.corporateDevelopment} onChange={setSoft} notify={notify} />
    </Card>}
    {step === 2 && <Card title="Развитие" eyebrow="Шаг 3 из 3" description="Выберите направление, в котором вам было бы интересно развиваться дальше. Руководитель увидит ваш выбор и сможет учесть его при обсуждении следующего периода.">
      <h3>Какое направление развития вам ближе?</h3>
      <div className="radio-card-grid">{employeeDirections.map((item) => <button type="button" key={item.value} className={`radio-card ${review.preferredDevelopmentDirection === item.value ? "is-selected" : ""}`} onClick={() => set("preferredDevelopmentDirection", item.value)}>{item.label}</button>)}</div>
      <label className="check-row"><input type="checkbox" checked={!!review.interestedInMentoring} onChange={(event) => set("interestedInMentoring", event.target.checked)} /><span>Хочу развиваться в роли ментора / наставника</span><small>Можно выбрать независимо от основного направления развития.</small></label>
      <Textarea label="Комментарий" value={review.employeeComment} onChange={(value) => set("employeeComment", value)} maxLength={1000} hint="Можно добавить, почему вам интересен выбранный трек или какие задачи развития для вас важны." placeholder="Можно добавить, почему вам интересен выбранный трек или какие задачи развития для вас важны." />
    </Card>}
    <div className="form-footer"><Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</Button><div>{step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}{step < 2 ? <Button onClick={() => setStep(step + 1)}>Продолжить</Button> : <Button onClick={submit}>Отправить руководителю</Button>}</div></div>
    {pendingSituation && <ConfirmDialog message="При смене управленческой ситуации список навыков может измениться. Уже выбранные soft skills будут сброшены. Продолжить?" cancelLabel="Отмена" confirmLabel="Сменить и сбросить выбор" onCancel={() => setPendingSituation(null)} onConfirm={() => { applySituation(pendingSituation); setPendingSituation(null); }} />}
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
  const [hardDrawerOpen, setHardDrawerOpen] = useState(false);
  const [confirmHardReplace, setConfirmHardReplace] = useState(false);
  const [softDrawerOpen, setSoftDrawerOpen] = useState(false);
  const [confirmSoftReplace, setConfirmSoftReplace] = useState(false);
  const set = <K extends keyof ManagerReview>(key: K, value: ManagerReview[K]) => onUpdate({ ...review, [key]: value });
  const employeeSoftStrengths = softSelectionFromReview(selfReview.softStrengths, selfReview.corporateStrengths);
  const employeeSoftGrowth = softSelectionFromReview(selfReview.softGrowthAreas, selfReview.corporateDevelopment);
  const managerSituation = review.softManagementSituation || selfReview.managementSituation || "no_reports";
  const replaceWithEmployeeSoftSkills = () => {
    const nextStrengths = employeeSoftStrengths.slice(0, 5);
    const nextGrowth = employeeSoftGrowth.filter((id) => !nextStrengths.includes(id)).slice(0, 5);
    if (!nextStrengths.length && !nextGrowth.length) {
      notify("У сотрудника нет выбранных soft skills для подтверждения");
      return;
    }
    onUpdate({ ...review, corporateStrengths: nextStrengths, corporateDevelopment: nextGrowth, softManagementSituation: managerSituation });
    notify("Выбор сотрудника по soft skills подтверждён");
  };
  const confirmEmployeeSoftSkills = () => {
    if (review.corporateStrengths.length || review.corporateDevelopment.length) return setConfirmSoftReplace(true);
    replaceWithEmployeeSoftSkills();
  };
  const replaceWithEmployeeHardSkills = () => {
    onUpdate({ ...review, hardStrengths: selfReview.hardStrengths.slice(0, 3), hardDevelopment: selfReview.hardDevelopment.filter((id) => !selfReview.hardStrengths.includes(id)).slice(0, 3) });
    notify("Выбор сотрудника по hard skills подтверждён");
  };
  const confirmEmployeeHardSkills = () => {
    if (review.hardStrengths.length || review.hardDevelopment.length) return setConfirmHardReplace(true);
    replaceWithEmployeeHardSkills();
  };
  const fillDemo = () => { const next = { ...review, category: "B" as const, hardStrengths: selfReview.hardStrengths.length ? selfReview.hardStrengths.slice(0, 3) : ["data"], hardDevelopment: selfReview.hardDevelopment.length ? selfReview.hardDevelopment.slice(0, 3) : ["presentations"], corporateStrengths: employeeSoftStrengths.slice(0, 5), corporateDevelopment: employeeSoftGrowth.slice(0, 5), softManagementSituation: managerSituation, mainTrack: selfReview.preferredDevelopmentDirection === "leadership" ? "management" as const : "expert" as const, mentorTrack: selfReview.interestedInMentoring, retentionTrack: false, successorTrack: false, managerComment: "Трек выбран с учётом самооценки сотрудника.", finalComment: "Трек выбран с учётом самооценки сотрудника." }; onUpdate(next); };
  const complete = () => { const nextErrors = validateManager(review); setErrors(nextErrors); if (!nextErrors.length) { onUpdate({ ...review, status: "completed" }); notify("Оценка руководителя завершена"); onComplete(); } };
  const employeeTrack = selfReview.preferredDevelopmentDirection === "leadership" ? "management" : selfReview.preferredDevelopmentDirection === "expertise" ? "expert" : "";
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
        <ManagerHardSkillsSummary employeeStrengths={selfReview.hardStrengths} employeeGrowth={selfReview.hardDevelopment} managerStrengths={review.hardStrengths} managerGrowth={review.hardDevelopment} onConfirmEmployee={confirmEmployeeHardSkills} onEdit={() => setHardDrawerOpen(true)} />
        <ManagerSoftSkillsSummary employeeStrengths={employeeSoftStrengths} employeeGrowth={employeeSoftGrowth} managerStrengths={review.corporateStrengths} managerGrowth={review.corporateDevelopment} onConfirmEmployee={confirmEmployeeSoftSkills} onEdit={() => setSoftDrawerOpen(true)} />
        <Card title="Трек сотрудника на следующий период" description="Выберите трек, который считаете приоритетным для сотрудника на следующий период. Вы можете учесть предпочтение сотрудника или скорректировать его.">
          <div className="preference-note"><strong>Выбор сотрудника:</strong> {employeeDirections.find((item) => item.value === selfReview.preferredDevelopmentDirection)?.label ?? "не выбран"}{selfReview.interestedInMentoring ? " · интерес к менторству" : ""}</div>
          <h3 className="track-section-title">Выберите основной трек</h3>
          <div className="radio-card-grid">{managerTracks.map((item) => <button type="button" key={item.value} className={`radio-card ${review.mainTrack === item.value ? "is-selected" : ""}`} onClick={() => set("mainTrack", item.value)}><strong>{item.label}</strong><span>{item.description}</span>{employeeTrack === item.value && <em>совпадает с предпочтением сотрудника</em>}{employeeTrack && employeeTrack !== item.value && review.mainTrack === item.value && <em className="is-muted">отличается от предпочтения сотрудника</em>}</button>)}</div>
          <h3 className="track-section-title">Выберите дополнительные треки при необходимости</h3>
          <div className="checkbox-card-grid"><label className={`checkbox-card ${review.mentorTrack ? "is-selected" : ""}`}><input type="checkbox" checked={!!review.mentorTrack} onChange={(event) => set("mentorTrack", event.target.checked)} /><strong>Трек наставника / ментора</strong><span>Передача опыта и развитие наставнических навыков</span>{selfReview.interestedInMentoring && <em>интерес сотрудника</em>}</label><label className={`checkbox-card ${review.retentionTrack ? "is-selected" : ""}`}><input type="checkbox" checked={!!review.retentionTrack} onChange={(event) => set("retentionTrack", event.target.checked)} /><strong>Ключевой эксперт / трек удержания</strong><span>Укрепление экспертизы и ключевой роли в команде</span></label><label className={`checkbox-card ${review.successorTrack ? "is-selected" : ""}`}><input type="checkbox" checked={!!review.successorTrack} onChange={(event) => set("successorTrack", event.target.checked)} /><strong>Преемник на позицию</strong><span>Подготовка к занятию ключевой позиции</span></label></div>
          {review.successorTrack && <label className="field"><span className="field__label">Позиция, на которую рассматривается сотрудник<b>*</b></span><input value={review.successorPosition} placeholder="Например: Руководитель направления, Директор департамента" onChange={(event) => set("successorPosition", event.target.value)} /></label>}
          {review.successorTrack && <p className="field__hint">Используется для позиций от 8 грейда.</p>}
          <Textarea label="Комментарий руководителя" value={review.managerComment || review.finalComment} onChange={(value) => onUpdate({ ...review, managerComment: value, finalComment: value })} maxLength={1500} placeholder="Можно пояснить выбранный трек или добавить рекомендации для обсуждения с сотрудником." />
        </Card>
        <div className="form-footer"><Button variant="ghost" onClick={onBack}>Вернуться к списку</Button><div><Button variant="secondary" onClick={() => notify("Черновик сохранён")}>Сохранить черновик</Button><Button onClick={complete}>Завершить оценку</Button></div></div>
      </section>
    </div>
    {hardDrawerOpen && <ManagerHardSkillsDrawer strengths={review.hardStrengths} growth={review.hardDevelopment} employeeStrengths={selfReview.hardStrengths} employeeGrowth={selfReview.hardDevelopment} notify={notify} onCancel={() => setHardDrawerOpen(false)} onSave={(next) => { onUpdate({ ...review, hardStrengths: next.strengths, hardDevelopment: next.growth }); setHardDrawerOpen(false); notify("Выбор hard skills сохранён"); }} />}
    {softDrawerOpen && <ManagerSoftSkillsDrawer initialSituation={managerSituation} strengths={review.corporateStrengths} growth={review.corporateDevelopment} employeeStrengths={employeeSoftStrengths} employeeGrowth={employeeSoftGrowth} notify={notify} onCancel={() => setSoftDrawerOpen(false)} onSave={(next) => { onUpdate({ ...review, corporateStrengths: next.strengths, corporateDevelopment: next.growth, softManagementSituation: next.situation }); setSoftDrawerOpen(false); notify("Выбор soft skills сохранён"); }} />}
    {confirmHardReplace && <ConfirmDialog message="Выбор руководителя будет заменён выбором сотрудника. Продолжить?" cancelLabel="Отмена" confirmLabel="Подтвердить и заменить" onCancel={() => setConfirmHardReplace(false)} onConfirm={() => { replaceWithEmployeeHardSkills(); setConfirmHardReplace(false); }} />}
    {confirmSoftReplace && <ConfirmDialog message="Выбор руководителя будет заменён выбором сотрудника. Продолжить?" cancelLabel="Отмена" confirmLabel="Подтвердить и заменить" onCancel={() => setConfirmSoftReplace(false)} onConfirm={() => { replaceWithEmployeeSoftSkills(); setConfirmSoftReplace(false); }} />}
  </div>;
}

const softComparisonStats = (employeeStrengths: string[], employeeGrowth: string[], managerStrengths: string[], managerGrowth: string[]) => {
  const sameStrengths = managerStrengths.filter((id) => employeeStrengths.includes(id)).length;
  const sameGrowth = managerGrowth.filter((id) => employeeGrowth.includes(id)).length;
  const conflicts = managerStrengths.filter((id) => employeeGrowth.includes(id)).length + managerGrowth.filter((id) => employeeStrengths.includes(id)).length;
  const additions = managerStrengths.filter((id) => !employeeStrengths.includes(id) && !employeeGrowth.includes(id)).length + managerGrowth.filter((id) => !employeeStrengths.includes(id) && !employeeGrowth.includes(id)).length;
  const unconfirmed = employeeStrengths.filter((id) => !managerStrengths.includes(id) && !managerGrowth.includes(id)).length + employeeGrowth.filter((id) => !managerStrengths.includes(id) && !managerGrowth.includes(id)).length;
  return { matches: sameStrengths + sameGrowth, additions, conflicts, unconfirmed };
};

const isCustomSkill = (id: string) => id.startsWith("custom:");
const customSkillId = (title: string) => `custom:${title.trim()}`;

function HardChipGroup({ ids, tone }: { ids: string[]; tone: "strength" | "growth" }) {
  return ids.length ? <div className="soft-summary-chips">{ids.map((id) => <span className={`soft-summary-chip soft-summary-chip--${tone}`} key={id}>{itemTitle(id)}{isCustomSkill(id) && <small> свой</small>}</span>)}</div> : <p className="muted">Не выбрано</p>;
}

function ManagerHardSkillsSummary({ employeeStrengths, employeeGrowth, managerStrengths, managerGrowth, onConfirmEmployee, onEdit }: { employeeStrengths: string[]; employeeGrowth: string[]; managerStrengths: string[]; managerGrowth: string[]; onConfirmEmployee: () => void; onEdit: () => void }) {
  const stats = softComparisonStats(employeeStrengths, employeeGrowth, managerStrengths, managerGrowth);
  return <Card title="Hard skills" description="Просмотрите выбор сотрудника, подтвердите его или скорректируйте при необходимости."><div className="manager-soft-summary"><h3>Выбор hard skills</h3><section><h4>Сильные стороны сотрудника</h4><div className="soft-summary-row"><span>Сотрудник:</span><HardChipGroup ids={employeeStrengths} tone="strength" /></div><div className="soft-summary-row"><span>Руководитель:</span><HardChipGroup ids={managerStrengths} tone="strength" /></div></section><section><h4>Зоны роста сотрудника</h4><div className="soft-summary-row"><span>Сотрудник:</span><HardChipGroup ids={employeeGrowth} tone="growth" /></div><div className="soft-summary-row"><span>Руководитель:</span><HardChipGroup ids={managerGrowth} tone="growth" /></div></section><div className="soft-summary-stats"><span>Совпадает: {stats.matches}</span><span>Добавлено руководителем: {stats.additions}</span><span>Расхождения: {stats.conflicts}</span></div><div className="soft-summary-actions"><Button onClick={onEdit}>Изменить выбор</Button><Button variant="secondary" onClick={onConfirmEmployee}>Подтвердить выбор сотрудника</Button></div></div></Card>;
}

function ManagerHardSkillsDrawer({ strengths, growth, employeeStrengths, employeeGrowth, notify, onCancel, onSave }: { strengths: string[]; growth: string[]; employeeStrengths: string[]; employeeGrowth: string[]; notify: (message: string) => void; onCancel: () => void; onSave: (next: { strengths: string[]; growth: string[] }) => void }) {
  const [activeTarget, setActiveTarget] = useState<"strength" | "growth">("strength");
  const [draftStrengths, setDraftStrengths] = useState(strengths);
  const [draftGrowth, setDraftGrowth] = useState(growth);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [query, setQuery] = useState("");
  const allIds = [...skills.map((skill) => skill.id), ...[...new Set([...draftStrengths, ...draftGrowth, ...employeeStrengths, ...employeeGrowth].filter(isCustomSkill))]];
  const lowerQuery = query.trim().toLowerCase();
  const visibleIds = allIds.filter((id) => itemTitle(id).toLowerCase().includes(lowerQuery));
  const exactExists = allIds.some((id) => itemTitle(id).toLowerCase() === lowerQuery);
  const canAddCustom = !!query.trim() && !exactExists;
  const select = (id: string) => {
    if (activeTarget === "strength") {
      if (draftGrowth.includes(id)) return notify("Навык уже выбран как зона роста. Сначала удалите его из зон роста.");
      if (!draftStrengths.includes(id) && draftStrengths.length >= 3) return notify("Можно выбрать не больше 3 навыков.");
      setDraftStrengths((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    } else {
      if (draftStrengths.includes(id)) return notify("Навык уже выбран как сильная сторона. Сначала удалите его из сильных сторон.");
      if (!draftGrowth.includes(id) && draftGrowth.length >= 3) return notify("Можно выбрать не больше 3 навыков.");
      setDraftGrowth((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    }
  };
  const addCustom = () => {
    const title = query.trim();
    if (!title) return;
    select(customSkillId(title));
    setQuery("");
  };
  const applyEmployeeChoice = () => {
    setDraftStrengths(employeeStrengths.slice(0, 3));
    setDraftGrowth(employeeGrowth.filter((id) => !employeeStrengths.includes(id)).slice(0, 3));
    notify("Выбор сотрудника по hard skills подтверждён");
  };
  const confirmEmployeeChoice = () => {
    if (draftStrengths.length || draftGrowth.length) return setConfirmReplace(true);
    applyEmployeeChoice();
  };
  const renderHardChip = (id: string) => {
    const employeeStrength = employeeStrengths.includes(id);
    const employeeGrowthSelected = employeeGrowth.includes(id);
    const managerStrength = draftStrengths.includes(id);
    const managerGrowth = draftGrowth.includes(id);
    const match = (employeeStrength && managerStrength) || (employeeGrowthSelected && managerGrowth);
    const conflict = (employeeStrength && managerGrowth) || (employeeGrowthSelected && managerStrength);
    return <button type="button" key={id} className={`hard-chip ${managerStrength ? "is-strength" : ""} ${managerGrowth ? "is-growth" : ""} ${(employeeStrength || employeeGrowthSelected) && !managerStrength && !managerGrowth ? "is-employee" : ""} ${match ? "is-match" : ""} ${conflict ? "is-conflict" : ""}`} onClick={() => select(id)}>{(managerStrength || managerGrowth) && <small>✓</small>}<span>{itemTitle(id)}</span>{isCustomSkill(id) && <small>свой</small>}{(employeeStrength || employeeGrowthSelected) && <small>сотр.</small>}{conflict && <small>!</small>}{!managerStrength && !managerGrowth && !employeeStrength && !employeeGrowthSelected && <small>+</small>}</button>;
  };
  const hasEmployeeChoice = employeeStrengths.length > 0 || employeeGrowth.length > 0;
  return <div className="drawer-backdrop" onMouseDown={onCancel}><aside className="soft-drawer hard-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="soft-drawer__head"><div><h2>Изменение выбора hard skills</h2><p>Выберите навыки или добавьте свой вариант через поиск.</p></div><button type="button" onClick={onCancel}>×</button></div><div className="soft-mode-toggle"><button type="button" className={activeTarget === "strength" ? "is-active" : ""} onClick={() => setActiveTarget("strength")}>Сильные стороны {draftStrengths.length}/3</button><button type="button" className={activeTarget === "growth" ? "is-active growth" : ""} onClick={() => setActiveTarget("growth")}>Зоны роста {draftGrowth.length}/3</button></div><div className="hard-drawer-choice"><strong>Ваш выбор</strong><span>Сильные стороны:</span><HardChipGroup ids={draftStrengths} tone="strength" /><span>Зоны роста:</span><HardChipGroup ids={draftGrowth} tone="growth" /></div><div className="hard-drawer-choice hard-drawer-choice--employee"><strong>Выбор сотрудника</strong>{hasEmployeeChoice ? <><span>Сильные стороны:</span><HardChipGroup ids={employeeStrengths} tone="strength" /><span>Зоны роста:</span><HardChipGroup ids={employeeGrowth} tone="growth" /><Button variant="secondary" onClick={confirmEmployeeChoice}>Подтвердить выбор сотрудника</Button></> : <p className="muted">Самооценка ещё не заполнена. Вы можете выбрать навыки руководителя самостоятельно.</p>}</div><input className="skill-search" value={query} placeholder="Поиск hard skills или добавление своего навыка" onChange={(event) => setQuery(event.target.value)} />{canAddCustom && <button type="button" className="add-custom-skill" onClick={addCustom}>+ Добавить “{query.trim()}”</button>}<div className="hard-chip-list">{visibleIds.map(renderHardChip)}</div><div className="soft-drawer__footer"><Button variant="secondary" onClick={onCancel}>Отмена</Button><Button onClick={() => onSave({ strengths: draftStrengths, growth: draftGrowth })}>Сохранить выбор</Button></div>{confirmReplace && <ConfirmDialog message="Выбор руководителя будет заменён выбором сотрудника. Продолжить?" cancelLabel="Отмена" confirmLabel="Подтвердить и заменить" onCancel={() => setConfirmReplace(false)} onConfirm={() => { applyEmployeeChoice(); setConfirmReplace(false); }} />}</aside></div>;
}

function SoftChipGroup({ ids, tone }: { ids: string[]; tone: "strength" | "growth" }) {
  return ids.length ? <div className="soft-summary-chips">{ids.map((id) => <span className={`soft-summary-chip soft-summary-chip--${tone}`} key={id}>{itemTitle(id)}</span>)}</div> : <p className="muted">Не выбрано</p>;
}

function ManagerSoftSkillsSummary({ employeeStrengths, employeeGrowth, managerStrengths, managerGrowth, onConfirmEmployee, onEdit }: { employeeStrengths: string[]; employeeGrowth: string[]; managerStrengths: string[]; managerGrowth: string[]; onConfirmEmployee: () => void; onEdit: () => void }) {
  const stats = softComparisonStats(employeeStrengths, employeeGrowth, managerStrengths, managerGrowth);
  return <Card title="Soft skills" description="Просмотрите выбор сотрудника, подтвердите его или скорректируйте при необходимости."><div className="manager-soft-summary"><h3>Выбор soft skills</h3><section><h4>Сильные стороны</h4><div className="soft-summary-row"><span>Сотрудник:</span><SoftChipGroup ids={employeeStrengths} tone="strength" /></div><div className="soft-summary-row"><span>Руководитель:</span><SoftChipGroup ids={managerStrengths} tone="strength" /></div></section><section><h4>Зоны роста</h4><div className="soft-summary-row"><span>Сотрудник:</span><SoftChipGroup ids={employeeGrowth} tone="growth" /></div><div className="soft-summary-row"><span>Руководитель:</span><SoftChipGroup ids={managerGrowth} tone="growth" /></div></section><div className="soft-summary-stats"><span>Совпадает: {stats.matches}</span><span>Добавлено руководителем: {stats.additions}</span><span>Расхождения: {stats.conflicts}</span><span>Не подтверждено: {stats.unconfirmed}</span></div><div className="soft-summary-actions"><Button onClick={onEdit}>Изменить выбор</Button><Button variant="secondary" onClick={onConfirmEmployee}>Подтвердить выбор сотрудника</Button></div></div></Card>;
}

function ManagerSoftSkillsDrawer({ initialSituation, strengths, growth, employeeStrengths, employeeGrowth, notify, onCancel, onSave }: { initialSituation: ManagementSituation; strengths: string[]; growth: string[]; employeeStrengths: string[]; employeeGrowth: string[]; notify: (message: string) => void; onCancel: () => void; onSave: (next: { situation: ManagementSituation; strengths: string[]; growth: string[] }) => void }) {
  const [situation, setSituation] = useState<ManagementSituation>(initialSituation || "no_reports");
  const [draftStrengths, setDraftStrengths] = useState(strengths);
  const [draftGrowth, setDraftGrowth] = useState(growth);
  const [pendingSituation, setPendingSituation] = useState<ManagementSituation | null>(null);
  const applySituation = (value: ManagementSituation) => { setSituation(value); setDraftStrengths([]); setDraftGrowth([]); };
  const changeSituation = (value: ManagementSituation) => {
    if (value === situation) return;
    if (draftStrengths.length || draftGrowth.length) return setPendingSituation(value);
    applySituation(value);
  };
  return <div className="drawer-backdrop" onMouseDown={onCancel}><aside className="soft-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="soft-drawer__head"><div><h2>Изменение выбора soft skills</h2><p>Выберите навыки сотрудника в режиме сильных сторон или зон роста.</p></div><button type="button" onClick={onCancel}>×</button></div><label className="field"><span className="field__label">Управленческая ситуация сотрудника</span><select className="select-control" value={situation} onChange={(event) => changeSituation(event.target.value as ManagementSituation)}>{managementSituations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><MappedSkillList mode="manager" situation={situation} strengths={draftStrengths} growth={draftGrowth} employeeStrengths={employeeStrengths} employeeGrowth={employeeGrowth} notify={notify} onChange={(next) => { setDraftStrengths(next.strengths); setDraftGrowth(next.growth); }} /><div className="soft-drawer__footer"><Button variant="secondary" onClick={onCancel}>Отмена</Button><Button onClick={() => onSave({ situation, strengths: draftStrengths, growth: draftGrowth })}>Сохранить выбор</Button></div>{pendingSituation && <ConfirmDialog message="При смене управленческой ситуации список навыков изменится. Выбор soft skills руководителя будет сброшен. Продолжить?" cancelLabel="Отмена" confirmLabel="Сменить и сбросить выбор" onCancel={() => setPendingSituation(null)} onConfirm={() => { applySituation(pendingSituation); setPendingSituation(null); }} />}</aside></div>;
}

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
  const softStats = employees.map((employee) => {
    const self = selfReviews.find((item) => item.employeeId === employee.id);
    const manager = managerReviews.find((item) => item.employeeId === employee.id);
    return softComparisonStats(self ? selfStrengths(self) : [], self ? selfGrowth(self) : [], manager?.corporateStrengths ?? [], manager?.corporateDevelopment ?? []);
  }).reduce((acc, item) => ({ matches: acc.matches + item.matches, additions: acc.additions + item.additions, conflicts: acc.conflicts + item.conflicts, unconfirmed: acc.unconfirmed + item.unconfirmed }), { matches: 0, additions: 0, conflicts: 0, unconfirmed: 0 });
  return <div className="page"><div className="page-header"><div><div className="eyebrow">HR-аналитика</div><h1>Сводка по циклу оценки</h1><p>Самооценка и оценка руководителя разделены. Аналитика показывает выбранные навыки и треки без расчёта категории.</p></div><div className="deadline"><span>Цикл</span><strong>Performance Review 2026</strong></div></div>
    <div className="metric-grid"><Card><span>Завершено</span><b>{completed.length}</b><small>из {employees.length} оценок</small></Card><Card><span>В работе</span><b>{employees.length - completed.length}</b><small>требуют внимания</small></Card><Card><span>Основной трек выбран</span><b>{managerReviews.filter((review) => review.mainTrack).length}</b><small>сотрудников</small></Card><Card><span>Совпадение треков</span><b>{alignedCount}</b><small>самооценка и руководитель</small></Card></div>
    <div className="analytics-grid"><Card title="Распределение треков руководителя"><div className="table-wrap"><table><thead><tr><th>Трек</th><th>Количество сотрудников</th></tr></thead><tbody>{mainTrackCounts.map((row) => <tr key={row.track}><td>{row.track}</td><td>{row.count}</td></tr>)}</tbody></table></div></Card><Card title="Предпочтения сотрудников"><div className="table-wrap"><table><thead><tr><th>Предпочтение</th><th>Количество сотрудников</th></tr></thead><tbody>{preferenceCounts.map((row) => <tr key={row.preference}><td>{row.preference}</td><td>{row.count}</td></tr>)}</tbody></table></div></Card></div>
    <Card title="Совпадения и расхождения по soft skills"><div className="table-wrap"><table><thead><tr><th>Метрика</th><th>Количество</th></tr></thead><tbody><tr><td>Совпадает</td><td>{softStats.matches}</td></tr><tr><td>Добавлено руководителем</td><td>{softStats.additions}</td></tr><tr><td>Расхождения</td><td>{softStats.conflicts}</td></tr><tr><td>Не подтверждено</td><td>{softStats.unconfirmed}</td></tr></tbody></table></div></Card>
    <Card title="Сотрудники"><div className="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Категория</th><th>Выбор сотрудника</th><th>Выбор руководителя</th><th>Совпадение</th><th>Статус</th></tr></thead><tbody>{employees.map((employee) => { const self = selfReviews.find((item) => item.employeeId === employee.id); const review = managerReviews.find((item) => item.employeeId === employee.id); const aligned = isTrackAligned(self, review); return <tr key={employee.id}><td><strong>{employee.fullName}</strong><span>{employee.position}</span></td><td>{review?.category || "—"}</td><td>{directionLabel(self?.preferredDevelopmentDirection ?? "")}</td><td>{mainTrackLabel(review?.mainTrack ?? "")}</td><td>{self?.preferredDevelopmentDirection && review?.mainTrack ? aligned ? "Да" : "Нет" : "—"}</td><td><Badge status={review?.status === "completed" ? "completed" : "draft"} /></td></tr>; })}</tbody></table></div></Card>
    <div className="analytics-grid"><FrequencyCard title="Навыки по самооценке" subtitle="Топ выборов сотрудников" strengths={frequency(selfReviews.map(selfStrengths))} development={frequency(selfReviews.map(selfGrowth))} /><FrequencyCard title="Навыки по оценке руководителей" subtitle="Топ выборов руководителей" strengths={frequency(managerReviews.map((item) => item.corporateStrengths))} development={frequency(managerReviews.map((item) => item.corporateDevelopment))} /></div>
  </div>;
}

function FrequencyCard({ title, subtitle, strengths, development }: { title: string; subtitle: string; strengths: [string, number][]; development: [string, number][] }) {
  return <Card title={title} description={subtitle}><h3 className="frequency-title">Помогали результату</h3><div className="frequency">{strengths.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div><h3 className="frequency-title">Стоит усилить</h3><div className="frequency">{development.map(([id, count]) => <div key={id}><span>{itemTitle(id)}</span><b>{count}</b></div>)}</div></Card>;
}
