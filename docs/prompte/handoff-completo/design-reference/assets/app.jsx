/* app.jsx — protótipo da proposta de layout do prompte. */

const { useState, useEffect, useRef, useMemo, Fragment } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C9F24D",
  "nav": "sidebar",
  "type": "tecnica",
  "dark": true
}/*EDITMODE-END*/;

const ACCENTS = ["#C9F24D", "#FBBF45", "#FF8264", "#C9A6FF", "#6FE3D2"];
const TYPE_FONTS = {
  tecnica:    { d: "'Space Grotesk', system-ui, sans-serif", u: "'Space Grotesk', system-ui, sans-serif" },
  neutra:     { d: "'Hanken Grotesk', system-ui, sans-serif", u: "'Hanken Grotesk', system-ui, sans-serif" },
  geometrica: { d: "'Sora', system-ui, sans-serif",           u: "'Sora', system-ui, sans-serif" },
};

const SEED_HISTORY = [
  { name: 'Revisão e correção', group: 'Código direto', when: 'há 2h', snip: 'Revise e corrija o seguinte codigo TypeScript: function auth(token)...' },
  { name: 'IA / Machine Learning', group: 'Domínios avançados', when: 'ontem', snip: 'Revise o codigo do repositorio org/ml-pipeline, com foco em train.py...' },
  { name: 'Foco em performance', group: 'Melhoria com diff', when: '2 dias', snip: 'Analise o arquivo src/query.ts no repositorio org/api com FOCO EM PERFORMANCE...' },
];

/* normaliza dados crus do form para o build() */
function normalize(tpl, data) {
  const d = {};
  for (const f of tpl.fields) {
    const v = data[f.id];
    if (f.type === 'checkbox') d[f.id] = !!v;
    else if (f.type === 'select') d[f.id] = v != null ? String(v) : f.options[0];
    else d[f.id] = v != null ? String(v).trim() : '';
  }
  return d;
}
function buildPreview(tpl, data) {
  try { return tpl.build(normalize(tpl, data)); } catch (e) { return ''; }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { TEMPLATES, GROUPS, INTENTS } = window.PROMPTE;

  const [route, setRoute] = useState('home');       // home | gen
  const [mode, setMode] = useState('direto');        // direto | avancado
  const [tplKey, setTplKey] = useState('revisao-correcao');
  const [formMap, setFormMap] = useState({});
  const [openGroups, setOpenGroups] = useState(() => new Set(['codigo']));
  const [search, setSearch] = useState('');
  const [previewOn, setPreviewOn] = useState(true);
  const [result, setResult] = useState(null);
  const [resultName, setResultName] = useState('');
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [lib, setLib] = useState(() => window.loadLib());
  const [saveDialog, setSaveDialog] = useState(null); // { name, text, templateKey, group, mode }
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prompte_hist')) || SEED_HISTORY; } catch { return SEED_HISTORY; }
  });

  const tpl = TEMPLATES.find((x) => x.key === tplKey) || TEMPLATES[0];
  const form = formMap[tplKey] || {};
  const setField = (id, v) => setFormMap((m) => ({ ...m, [tplKey]: { ...(m[tplKey] || {}), [id]: v } }));
  const groupsForMode = GROUPS.filter((g) => g.mode === mode);

  /* ---- aplicar tweaks ao documento ---- */
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent);
    r.style.setProperty('--accent-ink', '#17160d');
    const fonts = TYPE_FONTS[t.type] || TYPE_FONTS.tecnica;
    r.style.setProperty('--font-display', fonts.d);
    r.style.setProperty('--font-ui', fonts.u);
    document.body.setAttribute('data-nav', t.nav);
  }, [t]);

  /* tema: alterna a classe na raiz */
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', !t.dark);
  }, [t.dark]);

  const toastMsg = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  /* ---- atalhos ---- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === 'Escape') { setPaletteOpen(false); setResult(null); setHandoffOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && route === 'gen') { e.preventDefault(); generate(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function openTemplate(key, m, group) {
    const tt = TEMPLATES.find((x) => x.key === key);
    const useMode = m || (GROUPS.find((g) => g.id === tt.group)?.mode);
    setMode(useMode);
    setTplKey(key);
    setOpenGroups((s) => new Set(s).add(tt.group));
    setRoute('gen');
    setResult(null); setEditing(false);
    setPaletteOpen(false);
    window.scrollTo(0, 0);
  }

  function switchMode(m) {
    setMode(m);
    const firstGroup = GROUPS.find((g) => g.mode === m);
    const firstTpl = TEMPLATES.find((x) => x.group === firstGroup.id);
    setTplKey(firstTpl.key);
    setOpenGroups(new Set([firstGroup.id]));
    setResult(null); setEditing(false);
  }

  function generate() {
    const missing = tpl.fields.filter((f) => f.required && !(form[f.id] && String(form[f.id]).trim()));
    if (missing.length) { toastMsg(`Preencha: ${missing.map((f) => f.label).join(', ')}`); return; }
    const out = buildPreview(tpl, form);
    setResult(out); setResultName(tpl.name); setEditing(false);
    const entry = { name: tpl.name, group: GROUPS.find((g) => g.id === tpl.group)?.label, when: 'agora', snip: out.slice(0, 110) };
    const next = [entry, ...history].slice(0, 9);
    setHistory(next);
    try { localStorage.setItem('prompte_hist', JSON.stringify(next)); } catch {}
  }

  function copy(text) {
    navigator.clipboard?.writeText(text).then(() => toastMsg('Prompt copiado para a área de transferência'), () => toastMsg('Prompt copiado'));
  }

  /* navegação que limpa overlays abertos */
  function navigate(r) {
    setResult(null); setSaveDialog(null); setHandoffOpen(false); setPaletteOpen(false);
    setRoute(r); window.scrollTo(0, 0);
  }

  /* ---- biblioteca ---- */
  function openSaveDialog() {
    setSaveDialog({ name: resultName, text: result, templateKey: tpl.key, group: GROUPS.find((g) => g.id === tpl.group)?.label, mode });
  }
  function addCollection(name) {
    const id = 'c-' + Date.now();
    const next = { ...lib, collections: [...lib.collections, { id, name }] };
    setLib(next); window.saveLib(next);
    return id;
  }
  function commitSave(meta) {
    const entry = {
      id: 'p-' + Date.now(), text: saveDialog.text, templateKey: saveDialog.templateKey,
      group: saveDialog.group, mode: saveDialog.mode, favorite: false, createdAt: Date.now(),
      name: meta.name, collection: meta.collection, tags: meta.tags,
    };
    const next = { ...lib, prompts: [entry, ...lib.prompts] };
    setLib(next); window.saveLib(next);
    setSaveDialog(null);
    toastMsg('Salvo na biblioteca');
  }
  function openSavedPrompt(p) {
    setResult(p.text); setResultName(p.name); setEditing(false); setRoute('biblioteca');
  }

  const livePrompt = buildPreview(tpl, form);

  return (
    <div className="app-root">
      <Topbar t={t} setTweak={setTweak} route={route} onNav={navigate} onPalette={() => setPaletteOpen(true)} />
      {route === 'home' &&
        <Home intents={INTENTS} history={history} onIntent={openTemplate} onPalette={() => setPaletteOpen(true)}
          onOpenGen={() => { switchMode('direto'); setRoute('gen'); }} libCount={lib.prompts.length} onLibrary={() => setRoute('biblioteca')} />}
      {route === 'gen' &&
        <Workspace
          t={t} mode={mode} groupsForMode={groupsForMode} TEMPLATES={TEMPLATES} GROUPS={GROUPS}
          tpl={tpl} tplKey={tplKey} form={form} setField={setField}
          openGroups={openGroups} setOpenGroups={setOpenGroups}
          search={search} setSearch={setSearch} switchMode={switchMode}
          openTemplate={openTemplate} onBack={() => setRoute('home')}
          previewOn={previewOn} setPreviewOn={setPreviewOn}
          livePrompt={livePrompt} generate={generate} copy={copy} />}
      {route === 'biblioteca' &&
        <Library lib={lib} setLib={setLib} copy={copy} toastMsg={toastMsg}
          onOpenPrompt={openSavedPrompt} onNewPrompt={() => { switchMode('direto'); setRoute('gen'); }} />}

      {result != null && (
        <ResultModal name={resultName} setName={setResultName} text={result} editing={editing} setEditing={setEditing}
          setText={setResult} onClose={() => setResult(null)} copy={copy} toastMsg={toastMsg} onSave={openSaveDialog}
          analyze={(txt) => window.analyzePrompt(tpl, form, txt)}
          handoffOpen={handoffOpen} setHandoffOpen={setHandoffOpen} />
      )}
      {saveDialog && (
        <SaveDialog draft={saveDialog} collections={lib.collections}
          onSave={commitSave} onAddCollection={addCollection} onClose={() => setSaveDialog(null)} />
      )}
      {paletteOpen && <CommandPalette TEMPLATES={TEMPLATES} GROUPS={GROUPS} onPick={openTemplate} onClose={() => setPaletteOpen(false)} />}
      <Toast msg={toast} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identidade" />
        <TweakColor label="Cor de destaque" value={t.accent} options={ACCENTS} onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Tipografia" value={t.type}
          options={[{ value: 'tecnica', label: 'Técnica' }, { value: 'neutra', label: 'Neutra' }, { value: 'geometrica', label: 'Geom.' }]}
          onChange={(v) => setTweak('type', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Navegação" value={t.nav}
          options={[{ value: 'sidebar', label: 'Lateral' }, { value: 'top', label: 'Topo' }]}
          onChange={(v) => setTweak('nav', v)} />
        <TweakToggle label="Tema escuro" value={t.dark} onChange={(v) => setTweak('dark', v)} />
      </TweaksPanel>
    </div>
  );
}

/* ============ TOPBAR ============ */
function Topbar({ t, setTweak, route, onNav, onPalette }) {
  const nav = [
    { id: 'home', label: 'Início', icon: IconHome },
    { id: 'gen', label: 'Gerador', icon: IconBolt },
    { id: 'biblioteca', label: 'Biblioteca', icon: IconLibrary },
  ];
  return (
    <header className="topbar">
      <div className="brand" onClick={() => onNav('home')}>
        <span className="brand-mark">p</span>
        <span className="brand-name"><span className="pe">prompte</span></span>
      </div>
      <nav className="topnav" aria-label="Navegação principal">
        {nav.map((n) => {
          const I = n.icon;
          return (
            <button key={n.id} className={'topnav-item' + (route === n.id ? ' on' : '')}
              aria-current={route === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>
              <I width="15" height="15" /> <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
      <button className="cmd-launch" onClick={onPalette} aria-label="Abrir busca de comandos">
        <span className="ico"><IconSearch width="16" height="16" /></span>
        <span className="ph">Buscar template ou lente…</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Alternar tema" onClick={() => setTweak('dark', !t.dark)}>
          {t.dark ? <IconSun /> : <IconMoon />}
        </button>
        <button className="topbar-cta" onClick={() => onNav('gen')}><IconBolt width="15" height="15" /> Novo prompt</button>
      </div>
    </header>
  );
}

/* ============ HOME ============ */
function Home({ intents, history, onIntent, onPalette, onOpenGen, libCount, onLibrary }) {
  const [q, setQ] = useState('');
  return (
    <main className="home">
      <section className="hero">
        <span className="kicker">Comece pela tarefa, não pela lista</span>
        <h1>O que você quer que a <span className="hl">IA</span> faça com seu código?</h1>
        <p>Diga em uma frase ou escolha um ponto de partida. O prompte monta o prompt certo — estruturado, no padrão do seu projeto e pronto para copiar.</p>
        <form className="hero-cmd" onClick={(e) => e.currentTarget.querySelector('input').focus()}
          onSubmit={(e) => { e.preventDefault(); onPalette(); }}>
          <span className="ico"><IconSparkle width="20" height="20" /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: revisar auth.ts em busca de falhas de segurança" />
          <button type="submit" className="go">Começar <IconArrow width="15" height="15" /></button>
        </form>
      </section>

      <div className="sec-label">Pontos de partida</div>
      <section className="intents">
        {intents.map((it) => (
          <button key={it.id} className="intent" onClick={() => onIntent(it.template, it.mode, it.group)}>
            <div className="intent-top">
              <span className="intent-ico"><GroupIcon name={it.icon} /></span>
              <span className="intent-tag">{it.tag}</span>
            </div>
            <h3>{it.title}</h3>
            <p>{it.sub}</p>
            <span className="arrow">Abrir <IconArrow width="15" height="15" /></span>
          </button>
        ))}
      </section>

      <div className="sec-label">Continue de onde parou</div>
      <section className="recent">
        {history.length === 0 ? <div className="recent-empty">Seus prompts gerados aparecerão aqui.</div>
          : history.slice(0, 3).map((h, i) => (
            <button key={i} className="recent-card" onClick={onOpenGen}>
              <div className="rc-meta"><span>{h.group}</span><span>{h.when}</span></div>
              <div className="rc-name">{h.name}</div>
              <div className="rc-snip">{h.snip}</div>
            </button>
          ))}
      </section>

      <button className="lib-banner" onClick={onLibrary}>
        <span className="lib-banner-ico"><IconLibrary width="22" height="22" /></span>
        <span className="lib-banner-txt">
          <strong>Sua biblioteca</strong>
          <span>{libCount} {libCount === 1 ? 'prompt salvo' : 'prompts salvos'}, organizados por coleção e tags</span>
        </span>
        <span className="arrow">Abrir <IconArrow width="15" height="15" /></span>
      </button>
    </main>
  );
}

/* ============ WORKSPACE ============ */
function Workspace(props) {
  const { mode, groupsForMode, TEMPLATES, GROUPS, tpl, tplKey, form, setField,
    openGroups, setOpenGroups, search, setSearch, switchMode, openTemplate, onBack,
    previewOn, setPreviewOn, livePrompt, generate, copy } = props;

  const [qualityOpen, setQualityOpen] = useState(false);
  const analysis = window.analyzePrompt(tpl, form, livePrompt);
  const toggleGroup = (id) => setOpenGroups((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const q = search.trim().toLowerCase();
  const filteredTpls = (gid) => TEMPLATES.filter((x) => x.group === gid && (!q || x.name.toLowerCase().includes(q) || x.desc.toLowerCase().includes(q)));
  const groupLabel = GROUPS.find((g) => g.id === tpl.group)?.label;

  const textFields = tpl.fields.filter((f) => f.type !== 'checkbox');
  const checkFields = tpl.fields.filter((f) => f.type === 'checkbox');

  return (
    <div className="workspace" data-preview={previewOn ? 'on' : 'off'}>
      {/* nav rail */}
      <aside className="rail">
        <button className="back-link" onClick={onBack}><IconBack /> Início</button>
        <div className="mode-toggle" role="tablist">
          <button className={mode === 'direto' ? 'on' : ''} onClick={() => switchMode('direto')}>Direto</button>
          <button className={mode === 'avancado' ? 'on' : ''} onClick={() => switchMode('avancado')}>Avançado</button>
        </div>
        <p className="mode-hint">{mode === 'direto' ? 'Cole um trecho e gere — sem repositório.' : 'Análise de repo, diffs e lentes de especialista.'}</p>
        <div className="rail-search">
          <IconSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrar templates…" />
        </div>
        <div className="rail-groups">
          {groupsForMode.map((g) => {
            const items = filteredTpls(g.id);
            if (q && items.length === 0) return null;
            const open = openGroups.has(g.id) || !!q;
            return (
              <div key={g.id} className={'rail-group' + (open ? ' open' : '')}>
                <button className="rail-group-hd" onClick={() => toggleGroup(g.id)}>
                  <span className="gi"><GroupIcon name={g.icon} /></span>
                  <span className="gname">{g.label}</span>
                  <span className="chev"><IconChevron /></span>
                </button>
                {open && <div className="rail-group-blurb">{g.blurb}</div>}
                {open && (
                  <div className="rail-items">
                    {items.map((x) => (
                      <button key={x.key} className={'rail-item' + (x.key === tplKey ? ' on' : '')} onClick={() => openTemplate(x.key)}>{x.name}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* form column */}
      <main className="form-col">
        <div className="tpl-head">
          <div className="tpl-crumb">{mode === 'direto' ? 'Direto' : 'Avançado'} <span className="accent">/</span> {groupLabel}</div>
          <h2>{tpl.name}</h2>
          <p className="template-description"><GlossaryText text={tpl.desc} /></p>
        </div>

        {textFields.map((f) => <Field key={f.id} f={f} value={form[f.id]} onChange={(v) => setField(f.id, v)} />)}

        {checkFields.length > 0 && (
          <div className="field">
            <div className="check-label-group">Foco da análise</div>
            <div className="check-grid">
              {checkFields.map((f) => <Field key={f.id} f={f} value={form[f.id]} onChange={(v) => setField(f.id, v)} />)}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn-generate" onClick={generate}><IconBolt /> Gerar prompt</button>
          <span className="shortcut-hint"><kbd>⌘</kbd> <kbd>↵</kbd> para gerar</span>
          {!previewOn && <button className="mini-btn" style={{ marginLeft: 'auto' }} onClick={() => setPreviewOn(true)}>Mostrar prévia</button>}
        </div>
      </main>

      {/* preview column */}
      {previewOn && (
        <aside className="preview-col">
          <div className="preview-hd">
            <span className="ttl"><span className="live"><span className="dot" /> prévia ao vivo</span></span>
            <div className="acts">
              <button className="mini-btn" onClick={() => copy(livePrompt)}><IconCopy /> Copiar</button>
              <button className="mini-btn" aria-label="Ocultar prévia" onClick={() => setPreviewOn(false)}><IconClose /></button>
            </div>
          </div>
          <div className="preview-body">
            {livePrompt.trim()
              ? <pre className="preview-pre">{livePrompt}</pre>
              : <div className="preview-empty">Preencha os campos à esquerda — o prompt aparece aqui em tempo real.</div>}
          </div>
          <QualityFooter analysis={analysis} expanded={qualityOpen} onToggle={() => setQualityOpen((o) => !o)} />
        </aside>
      )}
    </div>
  );
}

/* ============ RESULT MODAL ============ */
function ResultModal({ name, setName, text, setText, editing, setEditing, onClose, copy, toastMsg, onSave, analyze, handoffOpen, setHandoffOpen }) {
  const targets = [
    { id: 'chatgpt', label: 'ChatGPT', url: 'https://chat.openai.com/' },
    { id: 'claude', label: 'Claude', url: 'https://claude.ai/' },
    { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/' },
  ];
  const analysis = analyze ? analyze(text) : null;
  return (
    <div className="result-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="result-modal" role="dialog" aria-label="Prompt gerado">
        <div className="result-hd">
          <span className="chk"><IconCheck /></span>
          <div style={{ flex: 1 }}>
            <h3>{name}</h3>
            <p>Prompt gerado · {text.length} caracteres</p>
          </div>
          {analysis && <ScoreChip analysis={analysis} />}
          <button className="icon-btn x" onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className="result-body">
          {editing
            ? <textarea className="result-pre" style={{ width: '100%', minHeight: 320, resize: 'vertical' }} value={text} onChange={(e) => setText(e.target.value)} />
            : <pre className="result-pre" aria-live="polite">{text}</pre>}
        </div>
        <div className="result-foot">
          <button className="btn btn-primary" onClick={() => copy(text)}><IconCopy /> Copiar</button>
          <button className="btn" onClick={() => setEditing(!editing)}><IconEdit /> {editing ? 'Concluir edição' : 'Editar'}</button>
          <button className="btn" onClick={onSave}><IconSave /> Salvar</button>
          <span className="spring" />
          <div className="handoff-wrap">
            {handoffOpen && (
              <div className="handoff-menu">
                {targets.map((tg) => (
                  <button key={tg.id} onClick={() => { copy(text); window.open(tg.url, '_blank'); setHandoffOpen(false); }}>
                    <IconExternal width="14" height="14" /> Abrir no {tg.label}
                  </button>
                ))}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => setHandoffOpen((o) => !o)}><IconExternal /> Abrir na IA</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ COMMAND PALETTE ============ */
function CommandPalette({ TEMPLATES, GROUPS, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const ql = q.trim().toLowerCase();
  const results = TEMPLATES.filter((x) => !ql || x.name.toLowerCase().includes(ql) || x.desc.toLowerCase().includes(ql) || (GROUPS.find((g) => g.id === x.group)?.label.toLowerCase().includes(ql)));
  useEffect(() => { setActive(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) { e.preventDefault(); onPick(results[active].key); }
  };
  return (
    <div className="cp-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-box">
        <div className="cp-input-row">
          <IconSearch />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Buscar entre os 25 templates e lentes…" />
        </div>
        <ul className="cp-list">
          {results.length === 0 && <div className="cp-sec">Nenhum resultado</div>}
          {results.map((x, i) => {
            const g = GROUPS.find((gg) => gg.id === x.group);
            return (
              <li key={x.key} className={'cp-item' + (i === active ? ' active' : '')}
                onMouseEnter={() => setActive(i)} onClick={() => onPick(x.key)}>
                <span className="ci"><GroupIcon name={g.icon} /></span>
                <span className="cl"><div className="cn">{x.name}</div><div className="cg">{g.label}</div></span>
                <span className="ck">{g.mode === 'direto' ? 'Direto' : 'Avançado'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
