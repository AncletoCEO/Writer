import test from 'node:test'
import assert from 'node:assert/strict'
import { renderUml } from '../src/render/uml.js'

function symbol(name, symbolKind, path, line, extra = {}) {
  return {
    id: `sym:${path}#${name}@${line}`,
    kind: 'symbol',
    path,
    name,
    symbolKind,
    exported: true,
    line,
    endLine: line + 2,
    signature: `${name}()`,
    owner: null,
    ...extra
  }
}

function fixture() {
  const base = symbol('Base', 'class', 'src/a.ts', 1)
  const ifoo = symbol('IFoo', 'interface', 'src/a.ts', 5)
  const child = symbol('Child', 'class', 'src/a.ts', 9)
  const run = symbol('run', 'method', 'src/a.ts', 10, {
    owner: 'Child',
    signature: 'run(x)'
  })
  const area = symbol('area', 'method', 'src/a.ts', 6, {
    owner: 'IFoo',
    signature: 'area()'
  })

  return {
    nodes: [base, ifoo, child, run, area],
    edges: [
      { from: child.id, to: base.id, kind: 'inherits', inheritsKind: 'extends' },
      { from: child.id, to: ifoo.id, kind: 'inherits', inheritsKind: 'implements' }
    ]
  }
}

test('genera classDiagram con clases, interfaz, métodos y relaciones', () => {
  const { nodes, edges } = fixture()
  const diagrams = renderUml({ nodes, edges })

  assert.equal(diagrams.length, 1)
  const diagram = diagrams[0]
  assert.match(diagram, /classDiagram/)
  assert.match(diagram, /class Base/)
  assert.match(diagram, /class Child/)
  assert.match(diagram, /class IFoo/)
  assert.match(diagram, /<<interface>>/)
  assert.match(diagram, /\+run\(x\)/)
  assert.match(diagram, /\+area\(\)/)
  assert.match(diagram, /Base <\|-- Child/)
  assert.match(diagram, /IFoo <\|\.\. Child/)
})

test('divide por maxClasses', () => {
  const { nodes, edges } = fixture()
  const diagrams = renderUml({ nodes, edges }, { maxClasses: 1 })

  assert.equal(diagrams.length, 3)
  for (const diagram of diagrams) assert.match(diagram, /^classDiagram/)
})

test('sin clases devuelve vacío y es determinista', () => {
  assert.deepEqual(renderUml({ nodes: [], edges: [] }), [])

  const { nodes, edges } = fixture()
  assert.deepEqual(
    renderUml({ nodes: [...nodes].reverse(), edges: [...edges].reverse() }),
    renderUml({ nodes, edges })
  )
})
