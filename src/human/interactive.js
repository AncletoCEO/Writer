// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'

const CYTOSCAPE = readFileSync(new URL('./vendor/cytoscape.min.js', import.meta.url), 'utf8')
  .replace(/\/\/# sourceMappingURL=.*$/m, '')
  .replace(/<\/script/gi, '<\\/script')

const COLORS = {
  csharp: '#8b5cf6',
  js: '#f59e0b',
  ts: '#38bdf8',
  php: '#a78bfa',
  python: '#22c55e',
  go: '#06b6d4',
  rust: '#fb7185',
  c: '#94a3b8',
  cpp: '#f472b6',
  java: '#ef4444',
  ruby: '#f43f5e',
  swift: '#f97316',
  kotlin: '#eab308'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function formatNumber(value) {
  return String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function dominantLanguage(files, fileByPath) {
  const counts = new Map()
  for (const file of files) {
    const lang = fileByPath.get(file)?.lang
    if (!lang) continue
    counts.set(lang, (counts.get(lang) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? 'unknown'
}

function buildGraph(model, limits) {
  const { graph, facts } = model
  const fileByPath = new Map(
    graph.nodes.filter((node) => node.kind === 'file').map((node) => [node.path, node])
  )
  const communities = [...facts.communities]
    .sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    .slice(0, limits.maxCommunities)
  const selected = new Set(communities.map((community) => community.id))
  const communityByPath = new Map()
  for (const community of facts.communities) {
    for (const file of community.files) communityByPath.set(file, community.id)
  }

  const nodes = communities.map((community) => {
    const files = [...community.files].sort()
    return {
      data: {
        id: community.id,
        label: `${community.id} · ${community.size}`,
        size: community.size,
        cohesion: community.cohesion,
        lang: dominantLanguage(files, fileByPath),
        files
      }
    }
  })

  const weights = new Map()
  for (const edge of graph.edges) {
    if (edge.kind !== 'import') continue
    const from = communityByPath.get(edge.from.replace(/^file:/, ''))
    const to = communityByPath.get(edge.to.replace(/^file:/, ''))
    if (!from || !to || from === to || !selected.has(from) || !selected.has(to)) continue
    const key = `${from}|${to}`
    weights.set(key, (weights.get(key) ?? 0) + 1)
  }

  const edges = [...weights.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, weight]) => {
      const [source, target] = key.split('|')
      return { data: { id: `e:${key}`, source, target, weight } }
    })

  return { nodes, edges, communities }
}

function styles() {
  return `
:root{color-scheme:dark;--bg:#08111f;--panel:#0f1b2d;--line:#22314a;--ink:#e2e8f0;--muted:#94a3b8}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:radial-gradient(circle at 20% 10%,#1d4ed833,transparent 38%),radial-gradient(circle at 85% 85%,#0f766e2e,transparent 45%),var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
.app{display:grid;grid-template-columns:330px 1fr;height:100vh}
aside{padding:22px;border-right:1px solid var(--line);background:#08111fdd;backdrop-filter:blur(10px);overflow:auto}
h1{font-size:20px;margin:0 0 4px;letter-spacing:-.02em}.sub{color:var(--muted);font-size:12px;margin-bottom:16px}
.back{display:inline-block;color:#7dd3fc;text-decoration:none;font-size:12px;margin-bottom:14px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px}.stat span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.stat strong{font-size:19px}
.control{margin:12px 0}label{display:block;font-size:11px;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em}
input,select,button{width:100%;background:#0c1728;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:9px 10px;font:inherit;font-size:13px}button{cursor:pointer;background:#1d4ed8;border-color:#2563eb}button.secondary{background:#122038;border-color:var(--line)}button:hover{filter:brightness(1.12)}
.legend{display:flex;flex-wrap:wrap;gap:6px}.pill{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);background:#0c1728;border:1px solid var(--line);border-radius:999px;padding:4px 8px}.dot{width:8px;height:8px;border-radius:50%}
#graph{height:100vh}#hover{position:fixed;pointer-events:none;display:none;max-width:420px;background:#0b172af0;border:1px solid #334155;color:#e2e8f0;padding:9px 11px;border-radius:8px;font-size:12px;box-shadow:0 10px 30px #0009;z-index:10}
#details{font-size:12px;color:var(--muted);margin-top:12px;line-height:1.55}#details code{color:#cbd5e1;word-break:break-all}
@media(max-width:800px){.app{grid-template-columns:1fr;grid-template-rows:auto 1fr}aside{max-height:46vh}}
`
}

export function renderInteractiveHtml(model, limits) {
  const { manifest } = model
  const { nodes, edges } = buildGraph(model, limits)
  const languages = [...new Set(nodes.map((node) => node.data.lang))].sort()
  const payload = {
    nodes,
    edges,
    colors: COLORS,
    limits: { maxCommunities: limits.maxCommunities }
  }

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="ancleto-writer">
<title>Writer — Interactive architecture</title>
<style>${styles()}</style></head><body>
<div class="app"><aside>
<a class="back" href="index.html">← Volver al reporte</a>
<h1>Writer — Architecture map</h1>
<div class="sub">Comunidades · Writer ${escapeHtml(manifest.writerVersion)} · schema ${escapeHtml(manifest.schemaVersion)}</div>
<div class="stats">
  <div class="stat"><span>Comunidades</span><strong>${formatNumber(nodes.length)}</strong></div>
  <div class="stat"><span>Conexiones</span><strong>${formatNumber(edges.length)}</strong></div>
  <div class="stat"><span>Archivos</span><strong>${formatNumber(nodes.reduce((total, node) => total + node.data.size, 0))}</strong></div>
  <div class="stat"><span>Lenguajes</span><strong>${formatNumber(languages.length)}</strong></div>
</div>
<div class="control"><label for="search">Buscar comunidad</label><input id="search" placeholder="c1, 694…"></div>
<div class="control"><label for="lang">Lenguaje dominante</label><select id="lang"><option value="">Todos</option>${languages.map((lang) => `<option value="${escapeHtml(lang)}">${escapeHtml(lang)}</option>`).join('')}</select></div>
<div class="control"><label for="layout">Layout</label><select id="layout"><option value="cose">Fuerza (cose)</option><option value="concentric">Concéntrico</option><option value="circle">Círculo</option><option value="grid">Grilla</option></select></div>
<div class="control"><button id="fit">Ajustar</button><button id="reset" class="secondary" style="margin-top:8px">Reset</button></div>
<div class="control"><label>Leyenda</label><div class="legend">${languages.map((lang) => `<span class="pill"><i class="dot" style="background:${COLORS[lang] || '#94a3b8'}"></i>${escapeHtml(lang)}</span>`).join('')}</div></div>
<div id="details">Click en una comunidad para ver archivos.</div>
</aside><div id="graph"></div></div><div id="hover"></div>
<script id="writer-data" type="application/json">${safeJson(payload)}</script>
<script>${CYTOSCAPE}</script>
<script>
(() => {
  const data = JSON.parse(document.getElementById('writer-data').textContent);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cy = cytoscape({
    container: document.getElementById('graph'),
    elements: [...data.nodes, ...data.edges],
    style: [
      { selector: 'node', style: {
        'background-color': (ele) => data.colors[ele.data('lang')] || '#94a3b8',
        label: 'data(label)', 'font-size': 10, color: '#dbeafe', 'text-valign': 'center', 'text-halign': 'center',
        width: (ele) => Math.min(96, 32 + Math.sqrt(ele.data('size')) * 2.2),
        height: (ele) => Math.min(96, 32 + Math.sqrt(ele.data('size')) * 2.2),
        'border-width': 1, 'border-color': '#0b1120', 'overlay-opacity': 0
      }},
      { selector: 'edge', style: { width: (ele) => Math.min(4, 0.5 + Math.log10(ele.data('weight') + 1) * 1.3), 'line-color': '#64748b', 'target-arrow-color': '#64748b', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', opacity: 0.35, 'arrow-scale': 0.8 }},
      { selector: '.dimmed', style: { opacity: 0.08, 'text-opacity': 0.05 } },
      { selector: 'edge.highlight', style: { opacity: 0.95, 'line-color': '#38bdf8', 'target-arrow-color': '#38bdf8' } },
      { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#f8fafc' } }
    ],
    layout: { name: 'cose', animate: false, fit: true, padding: 50, nodeOverlap: 30, idealEdgeLength: 130, nodeRepulsion: 8000, gravity: 0.3 },
    wheelSensitivity: 0.25
  });
  const hover = document.getElementById('hover');
  cy.on('mouseover', 'node', (event) => {
    const node = event.target;
    hover.style.display = 'block';
    hover.textContent = node.id() + ' · ' + node.data('size') + ' archivos · cohesión ' + Number(node.data('cohesion')).toFixed(2) + ' · ' + node.data('lang');
  });
  cy.on('mousemove', (event) => {
    hover.style.left = (event.renderedPosition.x + 18) + 'px';
    hover.style.top = (event.renderedPosition.y + 18) + 'px';
  });
  cy.on('mouseout', 'node', () => { hover.style.display = 'none'; });
  cy.on('tap', 'node', (event) => {
    const node = event.target;
    const neighborhood = node.closedNeighborhood();
    cy.elements().difference(neighborhood).addClass('dimmed');
    neighborhood.edges().addClass('highlight');
    const files = [...node.data('files')].sort();
    document.getElementById('details').innerHTML =
      '<strong>' + escapeHtml(node.id()) + '</strong> · ' + node.data('size') + ' archivos · ' +
      Number(node.data('cohesion')).toFixed(2) + ' cohesión<br>' +
      files.slice(0, 12).map((file) => '<code>' + escapeHtml(file) + '</code>').join('<br>') +
      (files.length > 12 ? '<br>…' : '');
  });
  const applyFilters = () => {
    const query = document.getElementById('search').value.toLowerCase();
    const lang = document.getElementById('lang').value;
    cy.nodes().forEach((node) => {
      const ok = (!query || node.id().toLowerCase().includes(query) || String(node.data('size')).includes(query)) &&
        (!lang || node.data('lang') === lang);
      node.style('display', ok ? 'element' : 'none');
    });
    cy.edges().forEach((edge) => {
      edge.style('display', edge.source().visible() && edge.target().visible() ? 'element' : 'none');
    });
  };
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('lang').addEventListener('change', applyFilters);
  document.getElementById('layout').addEventListener('change', (event) => {
    cy.layout({ name: event.target.value, animate: false, fit: true, padding: 50, nodeOverlap: 30, idealEdgeLength: 130, nodeRepulsion: 8000, gravity: 0.3 }).run();
  });
  document.getElementById('fit').addEventListener('click', () => cy.fit(undefined, 42));
  document.getElementById('reset').addEventListener('click', () => {
    cy.elements().removeClass('dimmed highlight');
    document.getElementById('search').value = '';
    document.getElementById('lang').value = '';
    applyFilters();
    cy.fit(undefined, 42);
  });
})();
</script>
</body></html>`

  return html
}
