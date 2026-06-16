# Handoff: Biblioteca de Prompts + Assistente de Qualidade

> Pacote para implementação no repositório **`danzeroum/prompte`** (pasta `frontend/`) usando Claude Code.
> Cobre duas features: **(A) Biblioteca de prompts salvos** e **(B) Assistente de Qualidade do prompt ("ESLint para prompts")**.

---

## 1. Visão geral

Duas adições ao produto, ambas atacando a dor nº1 do usuário (*"abro a ferramenta e não entendo como usá-la da melhor forma, fico perdido nas opções"*):

- **A. Biblioteca** — uma área dedicada para **gravar, organizar e reencontrar** prompts gerados: coleções (pastas), favoritos, tags, busca e ordenação. Mais um item de **navegação primária persistente** (Início · Gerador · Biblioteca) para que as três áreas estejam sempre a um clique.
- **B. Assistente de Qualidade** — um avaliador **ao vivo** que pontua o prompt (0–100 + nota Fraco/Bom/Forte) contra boas práticas de engenharia de prompt e mostra a próxima melhoria acionável. Transforma o gerador de passivo em **coach ativo**.

---

## 2. Sobre os arquivos de design (LEIA PRIMEIRO)

Os arquivos em **`design-reference/`** são **referências de design feitas em HTML/React** — protótipos que mostram aparência e comportamento pretendidos. **Não são código de produção para copiar diretamente.**

O repositório real **não é React**: é **HTML + JavaScript vanilla em módulos ES** (`frontend/assets/js/*.js`), empacotado com **Vite**, com i18n, tema claro/escuro, telemetria e Supabase. A tarefa é **recriar o comportamento dos protótipos dentro dessa arquitetura existente**, reaproveitando os módulos que já existem (ver §4). O protótipo React serve apenas como especificação visual e de interação.

**Arquivos de referência incluídos:**
| Arquivo | O que é |
|---|---|
| `design-reference/Proposta de Layout - prompte.html` | Protótipo navegável (abra no navegador para sentir o fluxo) |
| `design-reference/assets/library.jsx` | Biblioteca: lógica + UI (cards, coleções, save dialog, confirm) |
| `design-reference/assets/assistant.jsx` | **Algoritmo do Assistente de Qualidade** — a função `analyzePrompt()` é JS puro, portável quase verbatim |
| `design-reference/assets/app.jsx` | Como as features se integram (nav, rotas, modal de resultado) |
| `design-reference/assets/data.js` | Catálogo de templates portado do repo (referência de metadados de campo) |
| `design-reference/assets/prompte.css` | Estilos do protótipo (referência visual) |
| `design-reference/tokens.css` | Design tokens (cores/tipo/espaço) caso adotem o redesign visual |

---

## 3. Fidelidade

**Alta (hi-fi).** Cores, tipografia, espaçamento e interações estão resolvidos. Recriar a UI fielmente usando o CSS/tema **existente do repo** (`theme.css`).

> **Nota de escopo visual:** o protótipo usa uma direção visual nova (tinta quente, acento lime, Space Grotesk). **Este handoff é sobre a FUNCIONALIDADE das duas features.** Implemente a lógica e a estrutura usando as **CSS custom properties já existentes** do repo (ex.: `--bg`, `--accent` do `theme.css`). A migração para o visual novo é uma **trilha separada** (coberta por outro handoff de tokens). As duas features funcionam em qualquer tema — não dependem do restyle.

---

## 4. Contexto do repositório — o que JÁ EXISTE (NÃO reimplementar)

> Esta é a seção mais importante. Várias peças já estão prontas no repo. **Construa sobre elas.**

### `assets/js/savedPrompts.js` — persistência de prompts salvos
Já implementa estratégia **nuvem-primeiro (Supabase) com fallback local (localStorage)**. Exporta:

```js
// Salva. Retorna { ok, where:'cloud'|'local', error?, needsAuth? }
savePrompt({ template, content, title })
// Lista. nuvem: { id, template, title, content, created_at } | local: { template, title, content, ts }
listSavedPrompts()  // → Promise<Array>
// Remove. nuvem: id (uuid) | local: ts
deleteSavedPrompt(id)
```
- Chave local: `localStorage['pe:saved-prompts']`, teto `MAX_LOCAL = 50`.
- Tabela nuvem: `public.saved_prompts` (colunas: `id, user_id, template, title, content, created_at`) com **RLS por `user_id`**.

### `assets/js/resultPanel.js` — painel de resultado (Copiar/Editar/Salvar/Abrir na IA)
`renderResultPanel(container, { id, prompt, title })` já renderiza as ações e **já chama `savePrompt()`** no botão Salvar. Também exporta `aiUrl(provider, prompt)` e `AI_PROVIDERS` ([chatgpt, claude, gemini]) — **o "Abrir na IA" já existe**, com prefill `?q=` para ChatGPT/Claude e cópia-para-clipboard como fallback (Gemini).

### `assets/js/promptHistory.js` — histórico efêmero
`addPromptToHistory(id, text)` (MAX=20). Distinto da Biblioteca (que é intencional/permanente).

### Outros módulos relevantes
| Módulo | Uso no handoff |
|---|---|
| `generators.js` | `buildPrompt(key, data)`, `generatorTemplates`, `collectFormData()` — fonte do texto do prompt e dos metadados de campo (necessários ao Assistente de Qualidade) |
| `validation.js` | `showToast(title, msg, type)` — usar para feedback |
| `i18n.js` | `t(key)` + `data-i18n` — **toda string nova precisa de chave i18n** (pt-BR e en) |
| `telemetry.js` | `track(event, props)` — instrumentar ações novas |
| `theme.js` | tokens de tema (claro/escuro) — usar as CSS vars existentes |
| `commandPalette.js` | ⌘K já existe |
| `glossary.js` | glossário inline já existe |
| `app.js` | ponto de entrada; expõe `window.PE` e roda `init()` por página |

---

## 5. Feature A — Biblioteca de prompts

### 5.1 Objetivo
Dar ao usuário um lugar para **gravar prompts gerados e reencontrá-los**, organizados por coleção, favoritos e tags.

### 5.2 Mudanças no modelo de dados (extensão do que existe)
A `savedPrompts.js` atual guarda `template, title, content`. A Biblioteca precisa de **3 campos novos**: `collection`, `tags`, `favorite` — e de uma noção de **coleções**.

**A) Migração Supabase** (`saved_prompts`):
```sql
alter table public.saved_prompts
  add column if not exists collection uuid references public.collections(id) on delete set null,
  add column if not exists tags text[] default '{}',
  add column if not exists favorite boolean default false;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
alter table public.collections enable row level security;
create policy "collections_owner" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**B) Fallback local** — bumpar o schema dos objetos salvos para incluir `collection`, `tags[]`, `favorite`, e adicionar uma chave nova para coleções:
- `localStorage['pe:saved-prompts']` → cada item ganha `{ ...existente, collection, tags, favorite }`
- `localStorage['pe:collections']` → `[{ id, name, ts }]`
- **Migração defensiva:** ao ler itens antigos sem os campos, default `collection:null, tags:[], favorite:false` (não quebrar dados existentes).

### 5.3 Funções a adicionar em `savedPrompts.js`
Estender mantendo o padrão nuvem/local:
```js
savePrompt({ template, content, title, collection, tags, favorite })   // estender assinatura
updateSavedPrompt(id, patch)   // patch parcial: { favorite } | { collection } | { title, tags } — UPDATE na nuvem, reescrita no local
// coleções:
listCollections()              // → Promise<Array<{id,name}>>
createCollection(name)         // → { id }
renameCollection(id, name)
deleteCollection(id)           // prompts da coleção viram collection:null (não apaga prompts)
```

### 5.4 Novos arquivos
- **`assets/js/library.js`** — módulo que renderiza a tela Biblioteca (rail de coleções/favoritos/tags + grid de cards + toolbar de busca/ordenação). Espelha `design-reference/assets/library.jsx` (remover JSX → criar DOM com template strings, como `resultPanel.js` faz).
- **`assets/js/saveDialog.js`** (ou função em `library.js`) — o diálogo "Salvar na biblioteca" (nome, coleção + criar nova, tags). Substitui o save direto do `resultPanel.js` por este fluxo (ver 5.8).
- **`assets/css/library.css`** — estilos da tela (seguir convenções de `index.css`/`generator.css`).
- **`library.html`** — nova página (ou seção dentro de `index.html`; preferir página própria para manter o padrão multi-página atual do repo).

### 5.5 Navegação primária persistente
Adicionar à topbar (em `common.js → injectTopbarControls()`, que já injeta controles) um grupo de nav: **Início · Gerador · Biblioteca**, com item ativo destacado via `aria-current="page"`. Em telas estreitas vira faixa horizontal (ver responsivo).

### 5.6 Telas / componentes (hi-fi)

#### Tela: **Biblioteca** (`library.html`)
Layout em 2 colunas: **rail 264px** + **conteúdo fluido**. (Ver protótipo: classe `.lib`.)

**Rail esquerdo** (`.lib-rail`, borda direita `1px solid var(--line)`):
- Seção "Biblioteca": **Todos** (ícone grid) e **Favoritos** (estrela), cada um com contador à direita (mono, `--text-3`).
- Seção "Coleções": lista de coleções (ícone pasta) + contador; botão **"Nova coleção"** (ghost) que abre input inline (Enter cria, Esc cancela).
- Seção "Tags": nuvem de chips `#tag` (mono, 11.5px). Clicar filtra; clicar de novo limpa. Chip ativo: fundo `--accent-soft`, borda `--accent-line`.
- Item de nav ativo: fundo `--accent-soft`, texto `--text` 600, ícone `--accent`.

**Conteúdo** (`.lib-main`, padding fluido 24–44px):
- **Cabeçalho**: título da visão atual (Todos / Favoritos / nome da coleção) + subtítulo "N prompts salvos [· #tag]"; à direita botão **"Novo prompt"** (CTA, leva ao Gerador).
- **Toolbar**: busca (cresce) + segmented **Recentes / A–Z**.
- **Grid de cards**: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px`.
- **Estado vazio**: ícone biblioteca + título + texto convidando a gerar o primeiro prompt + CTA.

#### Componente: **Card de prompt** (`.lib-card`)
Borda `1px solid var(--line)`, raio `--r` (14px), hover: `translateY(-2px)` + `--shadow-sm` + borda `--line-2`.
- **Topo**: selo do grupo (mono 10.5px, pill) — variante "direto" usa acento; à direita **estrela** de favorito (preenchida = `--accent`).
- **Corpo** (clicável → abre o prompt): nome (display 16px 600) + trecho do texto (mono 11.5px, `-webkit-line-clamp:3`).
- **Tags**: `#tag` (mono 11px, `--text-3`).
- **Rodapé**: meta (coleção com ícone pasta · tempo relativo) + ações: **dropdown mover para coleção**, **copiar**, **abrir**, **excluir** (hover vermelho). Botões 30×30, raio 7px.

#### Componente: **Diálogo Salvar** (modal)
Largura `min(520px, 96vw)`, raio 18px. Campos: **Nome*** (auto-focus + select-all), **Coleção** (select + botão "Nova" → input inline "Criar"), **Tags** (input, separadas por vírgula, help text). Rodapé: Cancelar (ghost) + **Salvar** (primary). Enter no nome salva.

#### Componente: **Confirmação de exclusão** (alertdialog)
`role="alertdialog"`, largura `min(420px,94vw)`. Título "Remover da biblioteca?", corpo com nome em negrito + aviso de irreversível. Ações: Cancelar (ghost) + **Remover** (vermelho/destrutivo). *(O repo já confirma ações destrutivas — seguir o mesmo padrão.)*

#### Componente: **Banner na Home**
Faixa clicável "Sua biblioteca · N prompts salvos, organizados por coleção e tags" → leva à Biblioteca. Ícone em quadro `--accent-soft`.

### 5.7 Interações & comportamento
- **Filtros** compõem: visão (todos/fav/coleção) **E** tag ativa **E** busca textual (nome/conteúdo/tags).
- **Ordenação**: Recentes (por `created_at`/`ts` desc) ou A–Z (nome).
- **Favoritar**: toggle otimista → `updateSavedPrompt(id, { favorite })`.
- **Mover de coleção**: dropdown no card → `updateSavedPrompt(id, { collection })`.
- **Excluir**: abre confirmação → `deleteSavedPrompt(id)` → toast.
- **Abrir prompt**: abre visualização (reusar `renderResultPanel` com o texto salvo, ou um modal de leitura) — permite copiar / abrir na IA / editar.
- **Navegação dismissa overlays**: trocar de área fecha modais abertos.
- **Persistência**: tudo sobrevive a reload (nuvem se logado; senão local).

### 5.8 Fluxo de salvar (alterar o existente)
Hoje `resultPanel.js` no botão **Salvar** chama `savePrompt()` direto (só `template/title/content`). **Mudança:** o botão Salvar passa a abrir o **Diálogo Salvar** (5.6) para coletar **nome + coleção + tags**; ao confirmar, chama `savePrompt({ template, content, title:nome, collection, tags, favorite:false })`. Manter o comportamento de auth (`res.needsAuth → ensureAuth()`) e os toasts existentes (`result.saved.cloud|local`).

### 5.9 Estado
- `view` (`'all' | 'fav' | <collectionId>`), `activeTag`, `query`, `sort` (`'recent'|'name'`).
- `prompts[]`, `collections[]` — carregados via `listSavedPrompts()` / `listCollections()` no mount; re-fetch (ou atualização otimista) após mutações.
- Diálogo salvar: `{ name, collection, tags }`; confirmação: prompt-alvo.

---

## 6. Feature B — Assistente de Qualidade ("ESLint para prompts")

### 6.1 Objetivo
Avaliar o prompt **ao vivo** contra boas práticas e devolver **score 0–100 + nota + checagens acionáveis**. Net-new — não há equivalente no repo.

### 6.2 Novo módulo: `assets/js/promptQuality.js` (JS puro, testável)
**Portar a função `analyzePrompt()` de `design-reference/assets/assistant.jsx`** — ela é JS puro (sem React). Assinatura:

```js
analyzePrompt(template, formData, builtText)
//  template  : entrada de generatorTemplates (tem .fields com {id,label,type})
//  formData  : { [fieldId]: value } coletado via collectFormData()
//  builtText : saída de buildPrompt(key, formData)
//  → { score:0..100, grade:'—'|'Fraco'|'Bom'|'Forte', checks:[...], empty, topTip, issues }
```

**As 7 checagens** (cada uma → `status: 'pass' | 'warn' | 'fail'` + `label`, `ref` (nome da boa prática), `tip` (dica acionável)):

| # | Checagem | Heurística (resumo) |
|---|---|---|
| 1 | **Objetivo e papel definidos** | `pass` se há texto (templates sempre abrem com verbo de tarefa); `fail` se vazio |
| 2 | **Contexto suficiente** | campos cujo label casa `/contexto\|requisito\|perfil\|objetivo\|gargalo\|funcionalidade\|o que/i`: soma de chars ≥60 `pass`, ≥15 `warn`, senão `fail`; sem tais campos → `pass` |
| 3 | **Entrada concreta fornecida** | campos `/código\|arquivo\|reposit\|componente\|erro\|diff\|trecho/i`: algum preenchido `pass`, senão `fail`; sem tais campos → `pass` |
| 4 | **Formato de saída especificado** | `pass` se o texto contém `/formato de resposta\|entregue\|faça:\|fazer:\|formato/i` **ou** lista numerada `\n\d+\.`; senão `warn` |
| 5 | **Restrições e critérios** | `pass` se há checkbox marcado **ou** texto casa `/restri\|regras\|obrigat\|sla\|critério\|severidade\|priorize\|mantenha\|evite\|compatib/i`; senão `warn` |
| 6 | **Sem termos vagos** | procura, nos campos do usuário, termos da lista `VAGUE_TERMS` (melhor, bom, rápido, eficiente, otimizado, moderno, robusto, escalável, limpo, simples, adequado…). Nenhum → `pass`; algum → `warn` com dica citando os termos |
| 7 | **Detalhamento adequado** | nº de palavras do texto: ≥80 `pass`, ≥35 `warn`, senão `fail` |

**Score:** `pass=1, warn=0.5, fail=0`; `score = round(100 * Σ / 7)`. Vazio → score 0, grade `—`.
**Grade:** ≥80 `Forte`, ≥55 `Bom`, senão `Fraco`. **`topTip`** = primeira checagem não-`pass` (fails antes de warns). **`issues`** = nº de não-`pass`.

> O algoritmo completo (incl. regexes e `VAGUE_TERMS`) está em `design-reference/assets/assistant.jsx` linhas da função `analyzePrompt`. Copiar a lógica e **localizar as strings via i18n** (`label`, `tip`, `ref` precisam de chaves pt/en).

### 6.3 Integração na UI

**a) Rodapé do painel de prévia (ao vivo)** — onde o gerador mostra o prompt sendo montado, adicionar um rodapé fixo `.quality`:
- **Anel de score** (SVG circular, raio interno, `stroke-dashoffset` proporcional ao score; cor por grade) + **"Qualidade: <grade>"** + **a `topTip`** (próxima melhoria) + contador de `issues`.
- Clicável → expande a **lista de checagens**: cada linha com ícone de status (✓ verde / ! âmbar / ✗ vermelho), `label`, o nome da prática (`ref`, mono pequeno) e a `tip`.
- **Recalcular** a cada mudança de campo (mesmo gatilho que atualiza a prévia). Função pura → barato.

**b) Chip no resultado** — no cabeçalho de `resultPanel.js`, adicionar um **chip compacto** com anel + grade, para o usuário ver a qualidade **antes** de levar o prompt à IA.

**Cores por grade:** Forte → `--accent`; Bom → `oklch(0.8 0.13 80)` (âmbar); Fraco → `oklch(0.66 0.19 28)` (vermelho); `—` → `--text-3`. Status: pass usa acento, warn âmbar, fail vermelho (ver `.q-ic` no `prompte.css`).

### 6.4 Instrumentação
`track('prompt_quality', { template, score, grade })` ao gerar; opcional: `track('quality_expand')` ao abrir a checklist.

---

## 7. Design tokens
Usar as CSS custom properties **já existentes** no `theme.css` do repo (claro/escuro). Caso adotem o redesign visual, `design-reference/tokens.css` traz a paleta nova (tinta quente, acento lime `#C9F24D`, Space Grotesk + JetBrains Mono) — mas **as features não dependem disso**. Valores-chave usados nos protótipos:
- Raios: `--r-sm:9px`, `--r:14px`, modal `18px`.
- Sombras: `--shadow-sm` (cards), `--shadow` (modais).
- Espaçamento: escala de 4px.
- Tipo: display/UI grotesca; mono para prompt, tags, score, `kbd`.
- Acento de status fail/warn: `oklch(0.66 0.19 28)` / `oklch(0.8 0.13 80)`.

---

## 8. Critérios de aceite

**Biblioteca**
- [ ] Nav primária (Início · Gerador · Biblioteca) visível em todas as páginas, item ativo destacado, acessível por teclado.
- [ ] Salvar a partir do resultado abre o diálogo (nome/coleção/tags) e persiste; sobrevive a reload (nuvem logado / local deslogado).
- [ ] Coleções: criar, renomear, excluir (sem apagar prompts); contadores corretos.
- [ ] Favoritar, mover de coleção, copiar, abrir, excluir (com confirmação) funcionam por card.
- [ ] Filtros (visão + tag + busca) e ordenação (Recentes/A–Z) compõem corretamente.
- [ ] Estado vazio e banner da home presentes.
- [ ] Migração não quebra `saved_prompts` existentes (campos default).
- [ ] Strings em pt-BR e en (i18n); ações com `track()`.
- [ ] Responsivo: rail vira faixa horizontal; grid colapsa para 1 coluna.

**Assistente de Qualidade**
- [ ] `promptQuality.js` é função pura com testes unitários das 7 checagens + scoring.
- [ ] Score/nota/topTip atualizam ao vivo conforme os campos mudam.
- [ ] Preencher campos sobe o score (ex.: ~50 → ~86 no template "Revisão e correção" ao adicionar contexto, código e problemas).
- [ ] Checklist expansível com status correto por checagem.
- [ ] Chip de score no cabeçalho do resultado.
- [ ] Strings i18n; sem termos vagos hardcoded fora da lista.

---

## 9. Ordem de implementação sugerida (PRs)
1. **PR1 — Dados:** migração Supabase (`collections` + colunas) + extensão de `savedPrompts.js` (`updateSavedPrompt`, coleções, schema local + migração defensiva). *Sem UI.* Com testes.
2. **PR2 — Nav primária:** item Biblioteca + rota/página vazia. Pequeno, desbloqueia o resto.
3. **PR3 — Biblioteca (leitura):** `library.html` + `library.js` + `library.css` renderizando cards/rail/filtros a partir de `listSavedPrompts()`/`listCollections()`. Banner na home.
4. **PR4 — Biblioteca (escrita):** diálogo Salvar (altera `resultPanel.js`), favoritar/mover/excluir, criar coleção.
5. **PR5 — Assistente de Qualidade:** `promptQuality.js` (pura, testada) + integração no rodapé da prévia + chip no resultado.

Cada PR independente e revisável. PR5 não depende de 1–4.

---

## 10. Arquivos neste pacote
```
design_handoff_biblioteca_e_qualidade/
├── README.md                          ← este documento (auto-suficiente)
└── design-reference/
    ├── Proposta de Layout - prompte.html   ← protótipo navegável
    ├── tokens.css                          ← design tokens (opcional, redesign)
    └── assets/
        ├── library.jsx                     ← Biblioteca: lógica + UI de referência
        ├── assistant.jsx                   ← analyzePrompt(): PORTAR para promptQuality.js
        ├── app.jsx                         ← integração (nav, rotas, modal)
        ├── components.jsx                  ← ícones e campos de referência
        ├── data.js                         ← catálogo de templates (metadados de campo)
        └── prompte.css                     ← estilos de referência
```

**Abra o protótipo** (`Proposta de Layout - prompte.html`) no navegador para experimentar o fluxo antes de implementar: vá ao **Gerador**, preencha campos (veja o score subir no rodapé), clique **Gerar prompt → Salvar**, e visite a **Biblioteca**.
