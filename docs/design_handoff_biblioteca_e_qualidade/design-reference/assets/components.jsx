/* components.jsx — ícones, campos e blocos compartilhados do protótipo prompte.
   Exporta tudo para window (escopo separado por script Babel). */

const { useState, useRef, useEffect, Fragment } = React;

/* ---------- ícones (SVG simples: traços e formas básicas) ---------- */
const S = (p) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', ...p });
const IconSearch = (p) => <svg {...S(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
const IconCode = (p) => <svg {...S(p)}><path d="m8 6-6 6 6 6" /><path d="m16 6 6 6-6 6" /></svg>;
const IconRepo = (p) => <svg {...S(p)}><rect x="3" y="4" width="18" height="5" rx="1.5" /><rect x="3" y="11" width="18" height="5" rx="1.5" /><path d="M7 6.5h.01M7 13.5h.01" /></svg>;
const IconDiff = (p) => <svg {...S(p)}><path d="M12 4v6m-3-3h6" /><path d="M9 17h6" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>;
const IconDomain = (p) => <svg {...S(p)}><path d="M12 3 3 8.5 12 14l9-5.5L12 3Z" /><path d="m3 15.5 9 5.5 9-5.5" /></svg>;
const IconArrow = (p) => <svg {...S(p)}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
const IconBack = (p) => <svg {...S(p)}><path d="M19 12H5m6 6-6-6 6-6" /></svg>;
const IconCheck = (p) => <svg {...S(p)}><path d="M20 6 9 17l-5-5" /></svg>;
const IconBolt = (p) => <svg {...S(p)}><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" /></svg>;
const IconCopy = (p) => <svg {...S(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const IconSave = (p) => <svg {...S(p)}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>;
const IconEdit = (p) => <svg {...S(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
const IconExternal = (p) => <svg {...S(p)}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>;
const IconClose = (p) => <svg {...S(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>;
const IconSun = (p) => <svg {...S(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const IconMoon = (p) => <svg {...S(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
const IconChevron = (p) => <svg {...S(p)}><path d="m9 18 6-6-6-6" /></svg>;
const IconSliders = (p) => <svg {...S(p)}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>;
const IconHistory = (p) => <svg {...S(p)}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>;
const IconSparkle = (p) => <svg {...S(p)}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5 10.1 11.9 4.5 10l5.6-1.4L12 3Z" /></svg>;
const IconStar = (p) => <svg {...S(p)}><path d="M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 21.4l1.6-6.6L2.6 9.8l6.8-.5L12 3Z" /></svg>;
const IconStarFill = (p) => <svg {...S(p)} fill="currentColor" stroke="none"><path d="M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 21.4l1.6-6.6L2.6 9.8l6.8-.5L12 3Z" /></svg>;
const IconFolder = (p) => <svg {...S(p)}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>;
const IconFolderPlus = (p) => <svg {...S(p)}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M12 11v5m-2.5-2.5h5" /></svg>;
const IconTrash = (p) => <svg {...S(p)}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" /></svg>;
const IconPlus = (p) => <svg {...S(p)}><path d="M12 5v14m-7-7h14" /></svg>;
const IconLibrary = (p) => <svg {...S(p)}><rect x="3" y="4" width="6" height="16" rx="1.5" /><rect x="11" y="4" width="6" height="16" rx="1.5" /><path d="M20 6l1.6 13.6" /></svg>;
const IconTag = (p) => <svg {...S(p)}><path d="M3 11.5V5a2 2 0 0 1 2-2h6.5L21 12.5 12.5 21 3 11.5Z" /><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" /></svg>;
const IconHome = (p) => <svg {...S(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>;
const IconGrid = (p) => <svg {...S(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;

const GROUP_ICON = { code: IconCode, repo: IconRepo, diff: IconDiff, domain: IconDomain };
function GroupIcon({ name, ...p }) { const I = GROUP_ICON[name] || IconCode; return <I {...p} />; }

/* ---------- glossário inline: decora a 1ª ocorrência de um termo ---------- */
function GlossaryText({ text }) {
  const G = window.PROMPTE.GLOSSARY;
  const terms = Object.keys(G).sort((a, b) => b.length - a.length);
  let hitTerm = null, hitIdx = -1;
  for (const t of terms) {
    const i = text.toLowerCase().indexOf(t.toLowerCase());
    if (i >= 0 && (hitIdx === -1 || i < hitIdx)) { hitTerm = t; hitIdx = i; }
  }
  if (!hitTerm) return <span>{text}</span>;
  const before = text.slice(0, hitIdx);
  const matched = text.slice(hitIdx, hitIdx + hitTerm.length);
  const after = text.slice(hitIdx + hitTerm.length);
  return (
    <span>
      {before}
      <GlossTerm term={matched} def={G[hitTerm]} />
      <GlossaryText text={after} />
    </span>
  );
}
function GlossTerm({ term, def }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="pe-gloss-wrap">
      <button type="button" className="pe-gloss" aria-expanded={open}
        aria-label={'Definição de ' + term} onClick={() => setOpen(!open)}>
        {term}<span className="pe-gloss-mark" aria-hidden="true">ⓘ</span>
      </button>
      {open && <span className="pe-gloss-pop" role="tooltip">{def}</span>}
    </span>
  );
}

/* ---------- campo de formulário ---------- */
function Field({ f, value, onChange }) {
  if (f.type === 'checkbox') {
    return (
      <label className={'check' + (value ? ' on' : '')}>
        <span className="box"><IconCheck width="12" height="12" /></span>
        <input type="checkbox" checked={!!value} style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.checked)} />
        {f.label}
      </label>
    );
  }
  const id = 'fld-' + f.id;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {f.label}{f.required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {f.help && <div className="help">{f.help}</div>}
      {f.type === 'textarea' ? (
        <textarea id={id} value={value || ''} placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)} />
      ) : f.type === 'select' ? (
        <select id={id} value={value || f.options[0]} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} type="text" value={value || ''} placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

/* ---------- toast ---------- */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="toast-wrap">
      <div className="toast" role="status"><IconCheck /> {msg}</div>
    </div>
  );
}

Object.assign(window, {
  IconSearch, IconCode, IconRepo, IconDiff, IconDomain, IconArrow, IconBack, IconCheck,
  IconBolt, IconCopy, IconSave, IconEdit, IconExternal, IconClose, IconSun, IconMoon,
  IconChevron, IconSliders, IconHistory, IconSparkle, GroupIcon,
  IconStar, IconStarFill, IconFolder, IconFolderPlus, IconTrash, IconPlus, IconLibrary, IconTag, IconHome, IconGrid,
  GlossaryText, Field, Toast,
});
