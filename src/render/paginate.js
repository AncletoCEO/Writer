// SPDX-License-Identifier: AGPL-3.0-only

const PAGE_LIMIT = 500

function chunkLines(lines, size) {
  const chunks = []
  let current = []
  let inFence = false

  for (const line of lines) {
    if (line.startsWith('```')) inFence = !inFence
    current.push(line)
    if (current.length >= size && !inFence) {
      chunks.push(current)
      current = []
    }
  }

  if (current.length > 0) chunks.push(current)
  if (chunks.length === 0) chunks.push([])
  return chunks
}

export function paginate(baseName, title, bodyLines) {
  const chunks = chunkLines(bodyLines, PAGE_LIMIT - 6)
  const pages = {}

  chunks.forEach((chunk, index) => {
    const page = index + 1
    const name = page === 1 ? `${baseName}.md` : `${baseName}_p${page}.md`
    const lines = [`# ${title}${page > 1 ? ` (página ${page})` : ''}`, '']

    if (page > 1) {
      const previous = page === 2 ? `${baseName}.md` : `${baseName}_p${page - 1}.md`
      lines.push(`[← Página anterior](./${previous})`, '')
    }

    lines.push(...chunk)

    if (page < chunks.length) {
      lines.push('', `[Página siguiente →](./${baseName}_p${page + 1}.md)`)
    }

    pages[name] = `${lines.join('\n')}\n`
  })

  return pages
}
