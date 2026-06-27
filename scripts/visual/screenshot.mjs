// screenshot.mjs — reprodução visual de telas para QA de redesign.
// Captura screenshots + métricas de layout (overflow, alturas) de páginas do app,
// em viewports desktop e mobile, para comparar antes/depois de um PR.
//
// Pré-requisito: um servidor servindo o frontend já no ar. Ex.:
//   (cd frontend && npm run dev)         -> http://localhost:5173
//   (cd frontend && npm run preview)     -> http://localhost:4173 (build)
//
// Uso:
//   node screenshot.mjs --label before
//   node screenshot.mjs --label after --base http://localhost:4173 \
//        --pages library.html,generator.html --themes light,dark
//
// Saída: PNGs em ./out/ e um resumo JSON no stdout (compare before vs after).

import { existsSync, readdirSync, mkdirSync } from 'fs';
import { chromium } from 'playwright';

// ---- args ----
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
};
const base = arg('base', 'http://localhost:5173').replace(/\/$/, '');
const label = arg('label', 'shot');
const outDir = arg('out', new URL('./out', import.meta.url).pathname);
const pages = arg('pages', 'index.html,generator.html,manual.html,library.html,admin.html')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const themes = arg('themes', 'light').split(',').map((s) => s.trim());
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 740 },
];

mkdirSync(outDir, { recursive: true });

// ---- detecção do Chromium (env remoto traz o binário pré-instalado) ----
function findChromium() {
  if (process.env.PW_CHROMIUM && existsSync(process.env.PW_CHROMIUM)) return process.env.PW_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = readdirSync(root).find((d) => /^chromium-\d/.test(d));
    if (dir) {
      const p = `${root}/${dir}/chrome-linux/chrome`;
      if (existsSync(p)) return p;
    }
  } catch {
    /* cai no bundled do playwright */
  }
  return undefined;
}

// Medições genéricas úteis para QA de layout em qualquer tela.
function probeFn() {
  const de = document.documentElement;
  const h = (sel) => {
    const el = document.querySelector(sel);
    return el ? Math.round(el.getBoundingClientRect().height) : null;
  };
  // elementos que estouram horizontalmente o viewport (conteúdo cortado)
  const clipped = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
      clipped.push(el.className || el.tagName.toLowerCase());
    }
  });
  return {
    topbarH: h('.topbar'),
    vOverflow: de.scrollHeight - window.innerHeight, // >0 = scroll fantasma
    hOverflow: de.scrollWidth - de.clientWidth, // >0 = scroll horizontal
    clippedCount: clipped.length,
    clippedSample: [...new Set(clipped)].slice(0, 6),
  };
}

const browser = await chromium.launch({ executablePath: findChromium() });
const summary = [];
for (const page of pages) {
  for (const theme of themes) {
    for (const vp of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      });
      const p = await ctx.newPage();
      const url = `${base}/${page}`;
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await p.waitForTimeout(600); // deixa o JS injetar topbar/render
        const data = await p.evaluate(probeFn);
        const file = `${outDir}/${label}-${page.replace(/\.html$/, '')}-${theme}-${vp.name}.png`;
        await p.screenshot({ path: file });
        summary.push({ page, theme, vp: vp.name, ...data, file });
      } catch (e) {
        summary.push({ page, theme, vp: vp.name, error: String(e.message || e) });
      }
      await ctx.close();
    }
  }
}
await browser.close();

console.log(JSON.stringify({ base, label, results: summary }, null, 2));
const issues = summary.filter((r) => r.error || r.vOverflow > 0 || r.hOverflow > 0 || r.clippedCount > 0);
if (issues.length) {
  console.error(`\n⚠️  ${issues.length} alvo(s) com possível problema de layout (overflow/clip/erro).`);
}
