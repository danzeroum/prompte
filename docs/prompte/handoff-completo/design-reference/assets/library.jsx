/* library.jsx — Biblioteca de prompts salvos: coleções, favoritos, tags, busca.
   + SaveDialog (salvar da tela de resultado) + ConfirmDialog.
   Exporta para window. */

const { useState: useStateLib, useEffect: useEffectLib, useRef: useRefLib, useMemo: useMemoLib } = React;

/* ---------- persistência ---------- */
const LIB_KEY = 'prompte_lib_v1';
const SEED_LIB = {
  collections: [
    { id: 'c-seg', name: 'Segurança' },
    { id: 'c-refactor', name: 'Refactor diário' },
    { id: 'c-okr', name: 'Rituais ágeis' },
  ],
  prompts: [
    { id: 'p1', name: 'Auditoria de auth.ts', text: 'Revise e corrija o seguinte codigo TypeScript:\n\n```\nfunction auth(token) { ... }\n```\n\nContexto: middleware de autenticacao da API publica.\n\nPara cada correcao:\n1. Descreva o problema\n2. Justifique a solucao\n3. Forneça o trecho corrigido\n4. Codigo completo corrigido ao final',
      templateKey: 'revisao-correcao', group: 'Código direto', mode: 'direto', collection: 'c-seg',
      tags: ['typescript', 'auth'], favorite: true, createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'p2', name: 'Cloud review — main.tf produção', text: 'Analise detalhadamente o repositorio org/infra, com foco em main.tf.\n\nPROVEDOR DE NUVEM: AWS\nDOMINIO: Cloud Computing\n...', 
      templateKey: 'cloud-review', group: 'Domínios avançados', mode: 'avancado', collection: 'c-seg',
      tags: ['aws', 'terraform', 'lgpd'], favorite: true, createdAt: Date.now() - 1000 * 60 * 60 * 26 },
    { id: 'p3', name: 'Refactor do Button (diff)', text: 'Analise e melhore o componente src/Button.tsx no repositorio org/web.\n\nCONTEXTO DO PROJETO:\n- Framework: React\n- Estilo: Tailwind\n...', 
      templateKey: 'diff-react', group: 'Melhoria com diff', mode: 'avancado', collection: 'c-refactor',
      tags: ['react', 'a11y'], favorite: false, createdAt: Date.now() - 1000 * 60 * 60 * 50 },
    { id: 'p4', name: 'OKRs do time — Q2', text: 'Analise o repositorio org/app sob a lente de metricas e OKRs.\n\nDOMINIO: Metricas e OKRs para Times de Tecnologia\n...', 
      templateKey: 'metricas-okr', group: 'Domínios avançados', mode: 'avancado', collection: 'c-okr',
      tags: ['okr', 'fluxo'], favorite: false, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
    { id: 'p5', name: 'Debug do erro de hidratação', text: 'Este codigo esta gerando o seguinte erro:\n\n```\nHydration failed because the initial UI...\n```\n...', 
      templateKey: 'debug-erros', group: 'Código direto', mode: 'direto', collection: null,
      tags: ['next', 'ssr'], favorite: false, createdAt: Date.now() - 1000 * 60 * 30 },
  ],
};

function loadLib() {
  try { const v = JSON.parse(localStorage.getItem(LIB_KEY)); if (v && v.prompts) return v; } catch {}
  return SEED_LIB;
}
function saveLib(lib) { try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch {} }

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60); if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  const w = Math.floor(d / 7); if (w < 5) return `há ${w} sem`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

/* ============ BIBLIOTECA ============ */
function Library({ lib, setLib, copy, toastMsg, onOpenPrompt, onNewPrompt }) {
  const [filter, setFilter] = useStateLib('all'); // all | fav | <collectionId>
  const [activeTag, setActiveTag] = useStateLib(null);
  const [q, setQ] = useStateLib('');
  const [sort, setSort] = useStateLib('recent'); // recent | name
  const [newColl, setNewColl] = useStateLib('');
  const [addingColl, setAddingColl] = useStateLib(false);
  const [confirm, setConfirm] = useStateLib(null);

  const { collections, prompts } = lib;
  const allTags = useMemoLib(() => {
    const s = new Set(); prompts.forEach((p) => p.tags.forEach((t) => s.add(t))); return [...s].sort();
  }, [prompts]);

  const counts = useMemoLib(() => {
    const c = { all: prompts.length, fav: prompts.filter((p) => p.favorite).length };
    collections.forEach((col) => (c[col.id] = prompts.filter((p) => p.collection === col.id).length));
    return c;
  }, [prompts, collections]);

  let list = prompts.slice();
  if (filter === 'fav') list = list.filter((p) => p.favorite);
  else if (filter !== 'all') list = list.filter((p) => p.collection === filter);
  if (activeTag) list = list.filter((p) => p.tags.includes(activeTag));
  const ql = q.trim().toLowerCase();
  if (ql) list = list.filter((p) => p.name.toLowerCase().includes(ql) || p.text.toLowerCase().includes(ql) || p.tags.some((t) => t.includes(ql)));
  list.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : b.createdAt - a.createdAt));

  const update = (next) => { setLib(next); saveLib(next); };
  const toggleFav = (id) => update({ ...lib, prompts: prompts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) });
  const move = (id, coll) => update({ ...lib, prompts: prompts.map((p) => (p.id === id ? { ...p, collection: coll } : p)) });
  const remove = (id) => { update({ ...lib, prompts: prompts.filter((p) => p.id !== id) }); setConfirm(null); toastMsg('Prompt removido da biblioteca'); };
  const addCollection = () => {
    const name = newColl.trim(); if (!name) return;
    const id = 'c-' + Date.now();
    update({ ...lib, collections: [...collections, { id, name }] });
    setNewColl(''); setAddingColl(false); setFilter(id);
  };

  const filterTitle = filter === 'all' ? 'Todos os prompts' : filter === 'fav' ? 'Favoritos' : (collections.find((c) => c.id === filter)?.name || 'Coleção');

  return (
    <div className="lib">
      {/* rail de coleções */}
      <aside className="lib-rail">
        <div className="lib-rail-sec">Biblioteca</div>
        <button className={'lib-nav' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>
          <IconGrid width="16" height="16" /> <span>Todos</span> <span className="cnt">{counts.all}</span>
        </button>
        <button className={'lib-nav' + (filter === 'fav' ? ' on' : '')} onClick={() => setFilter('fav')}>
          <IconStar width="16" height="16" /> <span>Favoritos</span> <span className="cnt">{counts.fav}</span>
        </button>

        <div className="lib-rail-sec" style={{ marginTop: 18 }}>Coleções</div>
        {collections.map((c) => (
          <button key={c.id} className={'lib-nav' + (filter === c.id ? ' on' : '')} onClick={() => setFilter(c.id)}>
            <IconFolder width="16" height="16" /> <span>{c.name}</span> <span className="cnt">{counts[c.id] || 0}</span>
          </button>
        ))}
        {addingColl ? (
          <div className="lib-newcoll">
            <input autoFocus value={newColl} onChange={(e) => setNewColl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCollection(); if (e.key === 'Escape') { setAddingColl(false); setNewColl(''); } }}
              placeholder="Nome da coleção" />
            <button className="mini-btn primary" onClick={addCollection}>OK</button>
          </div>
        ) : (
          <button className="lib-nav ghost" onClick={() => setAddingColl(true)}><IconFolderPlus width="16" height="16" /> <span>Nova coleção</span></button>
        )}

        {allTags.length > 0 && (
          <div className="lib-tags-sec">
            <div className="lib-rail-sec">Tags</div>
            <div className="lib-tagcloud">
              {allTags.map((tg) => (
                <button key={tg} className={'lib-tagchip' + (activeTag === tg ? ' on' : '')}
                  onClick={() => setActiveTag(activeTag === tg ? null : tg)}>#{tg}</button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* conteúdo */}
      <main className="lib-main">
        <div className="lib-head">
          <div>
            <h2>{filterTitle}</h2>
            <p className="lib-sub">{list.length} {list.length === 1 ? 'prompt salvo' : 'prompts salvos'}{activeTag ? ` · #${activeTag}` : ''}</p>
          </div>
          <button className="btn-generate sm" onClick={onNewPrompt}><IconPlus width="16" height="16" /> Novo prompt</button>
        </div>

        <div className="lib-toolbar">
          <div className="rail-search grow">
            <IconSearch /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar na biblioteca…" />
          </div>
          <div className="lib-sort">
            <button className={sort === 'recent' ? 'on' : ''} onClick={() => setSort('recent')}>Recentes</button>
            <button className={sort === 'name' ? 'on' : ''} onClick={() => setSort('name')}>A–Z</button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="lib-empty">
            <span className="lib-empty-ico"><IconLibrary width="30" height="30" /></span>
            <h3>{ql || activeTag ? 'Nada encontrado' : 'Coleção vazia'}</h3>
            <p>{ql || activeTag ? 'Ajuste a busca ou os filtros.' : 'Gere um prompt e toque em “Salvar” para guardá-lo aqui, organizado por coleção e tags.'}</p>
            {!(ql || activeTag) && <button className="btn-generate sm" onClick={onNewPrompt}><IconBolt width="15" height="15" /> Gerar um prompt</button>}
          </div>
        ) : (
          <div className="lib-grid">
            {list.map((p) => (
              <PromptCard key={p.id} p={p} collections={collections}
                onFav={() => toggleFav(p.id)} onMove={(c) => move(p.id, c)}
                onOpen={() => onOpenPrompt(p)} onCopy={() => copy(p.text)}
                onDelete={() => setConfirm(p)} />
            ))}
          </div>
        )}
      </main>

      {confirm && (
        <ConfirmDialog
          title="Remover da biblioteca?"
          body={<span>“<b>{confirm.name}</b>” será removido permanentemente. Esta ação não pode ser desfeita.</span>}
          confirmLabel="Remover" onConfirm={() => remove(confirm.id)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

function PromptCard({ p, collections, onFav, onMove, onOpen, onCopy, onDelete }) {
  const collName = collections.find((c) => c.id === p.collection)?.name;
  return (
    <article className="lib-card">
      <div className="lc-top">
        <span className={'lc-badge ' + (p.mode === 'direto' ? 'd' : 'a')}>{p.group}</span>
        <button className={'lc-star' + (p.favorite ? ' on' : '')} aria-label={p.favorite ? 'Desfavoritar' : 'Favoritar'} onClick={onFav}>
          {p.favorite ? <IconStarFill width="17" height="17" /> : <IconStar width="17" height="17" />}
        </button>
      </div>
      <button className="lc-body" onClick={onOpen}>
        <h3 className="lc-name">{p.name}</h3>
        <pre className="lc-snip">{p.text}</pre>
      </button>
      <div className="lc-tags">
        {p.tags.map((t) => <span key={t} className="lc-tag">#{t}</span>)}
      </div>
      <div className="lc-foot">
        <span className="lc-meta">{collName ? <span className="lc-coll"><IconFolder width="12" height="12" /> {collName}</span> : <span className="lc-coll dim">Sem coleção</span>} · {relTime(p.createdAt)}</span>
        <div className="lc-acts">
          <select className="lc-move" value={p.collection || ''} onChange={(e) => onMove(e.target.value || null)} aria-label="Mover para coleção" title="Mover para coleção">
            <option value="">Sem coleção</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="lc-act" aria-label="Copiar" title="Copiar" onClick={onCopy}><IconCopy width="14" height="14" /></button>
          <button className="lc-act" aria-label="Abrir" title="Abrir" onClick={onOpen}><IconExternal width="14" height="14" /></button>
          <button className="lc-act danger" aria-label="Remover" title="Remover" onClick={onDelete}><IconTrash width="14" height="14" /></button>
        </div>
      </div>
    </article>
  );
}

/* ============ SAVE DIALOG ============ */
function SaveDialog({ draft, collections, onSave, onAddCollection, onClose }) {
  const [name, setName] = useStateLib(draft.name || '');
  const [collection, setCollection] = useStateLib(draft.collection || '');
  const [tags, setTags] = useStateLib((draft.tags || []).join(', '));
  const [newColl, setNewColl] = useStateLib('');
  const [creating, setCreating] = useStateLib(false);
  const inputRef = useRefLib(null);
  useEffectLib(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const doCreate = () => {
    const nm = newColl.trim(); if (!nm) return;
    const id = onAddCollection(nm); setCollection(id); setCreating(false); setNewColl('');
  };
  const submit = () => {
    if (!name.trim()) { inputRef.current?.focus(); return; }
    onSave({
      name: name.trim(),
      collection: collection || null,
      tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
    });
  };

  return (
    <div className="result-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="save-modal" role="dialog" aria-label="Salvar na biblioteca">
        <div className="result-hd">
          <span className="chk"><IconSave width="18" height="18" /></span>
          <div style={{ flex: 1 }}><h3>Salvar na biblioteca</h3><p>Nomeie, escolha uma coleção e adicione tags.</p></div>
          <button className="icon-btn x" onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className="save-body">
          <div className="field">
            <label className="field-label" htmlFor="sv-name">Nome <span className="req">*</span></label>
            <input id="sv-name" ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="ex.: Auditoria de auth.ts" />
          </div>
          <div className="field">
            <label className="field-label">Coleção</label>
            {creating ? (
              <div className="lib-newcoll inline">
                <input autoFocus value={newColl} onChange={(e) => setNewColl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') doCreate(); if (e.key === 'Escape') setCreating(false); }} placeholder="Nome da nova coleção" />
                <button className="mini-btn primary" onClick={doCreate}>Criar</button>
                <button className="mini-btn" onClick={() => setCreating(false)}>Cancelar</button>
              </div>
            ) : (
              <div className="save-coll-row">
                <select value={collection} onChange={(e) => setCollection(e.target.value)}>
                  <option value="">Sem coleção</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="mini-btn" onClick={() => setCreating(true)}><IconFolderPlus width="14" height="14" /> Nova</button>
              </div>
            )}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="sv-tags">Tags</label>
            <div className="help">Separe por vírgula — ex.: typescript, auth, segurança</div>
            <input id="sv-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="typescript, auth" />
          </div>
        </div>
        <div className="result-foot">
          <span className="spring" />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit}><IconSave width="15" height="15" /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ============ CONFIRM ============ */
function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="result-overlay" style={{ zIndex: 260 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="confirm-modal" role="alertdialog" aria-label={title}>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="confirm-acts">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}><IconTrash width="15" height="15" /> {confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Library, SaveDialog, ConfirmDialog, loadLib, saveLib, relTime });
