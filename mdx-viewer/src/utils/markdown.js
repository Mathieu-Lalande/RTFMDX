/**
 * Parse le bloc frontmatter YAML d'un fichier Markdown.
 * @param {string} content
 * @returns {{ frontmatter: Record<string, any>, body: string }}
 */
export function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { frontmatter: {}, body: content }
  const fm = {}
  m[1].split('\n').forEach(line => {
    const sep = line.indexOf(':')
    if (sep === -1) return
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 1).trim()
    // tableau [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
    }
    if (key) fm[key] = val
  })
  return { frontmatter: fm, body: content.slice(m[0].length) }
}

/**
 * Extrait les tags d'un contenu Markdown (frontmatter + inline #tag).
 * @param {string} content
 * @returns {string[]}
 */
export function extractTags(content) {
  const tags = new Set()
  const { frontmatter } = parseFrontmatter(content)
  if (frontmatter.tags) {
    const t = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags]
    t.forEach(tag => tags.add(String(tag).toLowerCase()))
  }
  // Tags inline #tag (hors blocs de code)
  const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
  const matches = withoutCode.matchAll(/#([\w-]+)/g)
  for (const m of matches) tags.add(m[1].toLowerCase())
  return [...tags]
}
