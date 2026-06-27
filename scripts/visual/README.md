# QA visual (Playwright)

Ferramenta para **reproduzir telas no navegador** e comparar **antes/depois** de um PR de
redesign: captura screenshots em desktop e mobile e mede problemas de layout (scroll fantasma,
overflow horizontal, elementos cortados, altura da topbar).

> Isolada de propósito: tem seu **próprio `package.json`** e **não** é dependência do
> `frontend/`. Assim o CI/build do app não instala Playwright. Rode sob demanda.

## Pré-requisitos

- Browser: no ambiente remoto o Chromium já vem em `/opt/pw-browsers` (detectado automaticamente).
  Localmente, defina `PW_CHROMIUM=/caminho/para/chrome` ou deixe o Playwright baixar o seu.
- Um servidor servindo o frontend no ar.

## Uso

```bash
# 1) instale as deps desta ferramenta (uma vez)
cd scripts/visual && npm install

# 2) suba o app (noutro terminal)
cd frontend && npm run dev          # http://localhost:5173
# ou, para testar o build de produção:
cd frontend && npm run preview      # http://localhost:4173

# 3) capture o estado ANTES da mudança
cd scripts/visual
node screenshot.mjs --label before

# 4) faça a mudança no código, depois capture o DEPOIS
node screenshot.mjs --label after

# compare os PNGs em scripts/visual/out/ e o resumo JSON impresso no stdout
```

### Opções

| Flag | Default | Descrição |
|---|---|---|
| `--label` | `shot` | prefixo dos arquivos (use `before`/`after`) |
| `--base` | `http://localhost:5173` | URL base do servidor |
| `--pages` | as 5 páginas | lista separada por vírgula (ex.: `library.html,generator.html`) |
| `--themes` | `light` | `light`, `dark` ou `light,dark` |
| `--out` | `./out` | diretório de saída (ignorado no git) |

O resumo JSON traz, por página × tema × viewport: `topbarH`, `vOverflow` (>0 = scroll fantasma),
`hOverflow` (>0 = scroll horizontal), `clippedCount`/`clippedSample` (conteúdo cortado). Sai com
aviso no stderr se algum alvo tiver overflow/clip/erro.
