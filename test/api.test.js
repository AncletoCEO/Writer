import test from 'node:test'
import assert from 'node:assert/strict'
import { renderApi } from '../src/render/api.js'

function symbol(path, name, line, extra = {}) {
  return {
    id: `sym:${path}#${name}@${line}`,
    kind: 'symbol',
    path,
    name,
    symbolKind: 'function',
    exported: true,
    summary: null,
    line,
    endLine: line + 1,
    signature: `${name}()`,
    ...extra
  }
}

test('API.md incluye solo exportados, firma y summary', () => {
  const graph = {
    nodes: [
      symbol('src/a.js', 'run', 1, { summary: 'Runs the app.' }),
      symbol('src/a.js', 'hidden', 5, { exported: false }),
      symbol('src/b.js', 'load', 2)
    ]
  }
  const pages = renderApi(graph)
  const api = pages['API.md']

  assert.match(api, /^# API/m)
  assert.match(api, /## src\/a\.js/)
  assert.match(api, /- \`run\` — run\(\) — Runs the app\./)
  assert.doesNotMatch(api, /hidden/)
  assert.match(api, /## src\/b\.js/)
  assert.match(api, /- \`load\` — load\(\)/)
})

test('sin exportados y deshabilitado', () => {
  const empty = renderApi({ nodes: [symbol('src/a.js', 'hidden', 1, { exported: false })] })
  assert.match(empty['API.md'], /Sin símbolos exportados/)
  assert.deepEqual(renderApi({ nodes: [] }, { enabled: false }), {})
})

test('pagina API.md', () => {
  const nodes = Array.from({ length: 600 }, (_, index) =>
    symbol('src/a.js', `fn${index}`, index + 1)
  )
  const pages = renderApi({ nodes })

  assert.ok(pages['API.md'])
  assert.ok(pages['API_p2.md'])
  for (const content of Object.values(pages)) {
    assert.ok(content.split('\n').length <= 500)
  }
  assert.match(pages['API.md'], /Página siguiente/)
  assert.match(pages['API_p2.md'], /Página anterior/)
})
