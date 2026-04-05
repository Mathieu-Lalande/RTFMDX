import { describe, it, expect } from 'vitest'
import { parseFrontmatter, extractTags } from '../utils/markdown.js'

// ─── parseFrontmatter ─────────────────────────────────────────────────────────

describe('parseFrontmatter', () => {
  it('retourne body complet si pas de frontmatter', () => {
    const content = '# Titre\n\nContenu'
    const { frontmatter, body } = parseFrontmatter(content)
    expect(frontmatter).toEqual({})
    expect(body).toBe(content)
  })

  it('parse un frontmatter simple', () => {
    const content = '---\ntitle: Mon document\nauthor: Mathieu\n---\n\n# Contenu'
    const { frontmatter, body } = parseFrontmatter(content)
    expect(frontmatter.title).toBe('Mon document')
    expect(frontmatter.author).toBe('Mathieu')
    expect(body).toBe('\n\n# Contenu')
  })

  it('parse un tableau de tags', () => {
    const content = '---\ntags: [react, javascript, electron]\n---\nContenu'
    const { frontmatter } = parseFrontmatter(content)
    expect(frontmatter.tags).toEqual(['react', 'javascript', 'electron'])
  })

  it('parse readonly: true', () => {
    const content = '---\nreadonly: true\n---\nContenu'
    const { frontmatter } = parseFrontmatter(content)
    expect(frontmatter.readonly).toBe('true')
  })

  it('ignore les lignes sans ":"', () => {
    const content = '---\ntitle: OK\nlignesanscolon\n---\nContenu'
    const { frontmatter } = parseFrontmatter(content)
    expect(frontmatter.title).toBe('OK')
    expect(Object.keys(frontmatter)).toHaveLength(1)
  })

  it('gère les retours chariot Windows (CRLF)', () => {
    const content = '---\r\ntitle: Windows\r\n---\r\nContenu'
    const { frontmatter } = parseFrontmatter(content)
    expect(frontmatter.title).toBe('Windows')
  })

  it('ne parse pas un frontmatter non fermé', () => {
    const content = '---\ntitle: Pas fermé\n\nContenu'
    const { frontmatter } = parseFrontmatter(content)
    expect(frontmatter).toEqual({})
  })
})

// ─── extractTags ──────────────────────────────────────────────────────────────

describe('extractTags', () => {
  it('retourne un tableau vide si pas de tags', () => {
    expect(extractTags('# Titre sans tag')).toEqual([])
  })

  it('extrait les tags inline #tag', () => {
    const tags = extractTags('Ceci est un texte avec #react et #electron')
    expect(tags).toContain('react')
    expect(tags).toContain('electron')
  })

  it('extrait les tags du frontmatter', () => {
    const content = '---\ntags: [vue, typescript]\n---\nContenu'
    const tags = extractTags(content)
    expect(tags).toContain('vue')
    expect(tags).toContain('typescript')
  })

  it('combine tags frontmatter et inline', () => {
    const content = '---\ntags: [frontend]\n---\nTexte avec #backend'
    const tags = extractTags(content)
    expect(tags).toContain('frontend')
    expect(tags).toContain('backend')
  })

  it('déduplique les tags (insensible à la casse)', () => {
    const tags = extractTags('---\ntags: [React]\n---\nTexte #react')
    const reactCount = tags.filter(t => t === 'react').length
    expect(reactCount).toBe(1)
  })

  it('ignore les tags dans les blocs de code', () => {
    const content = '```\n#ceci-est-du-code\n```\nTexte normal #vrai-tag'
    const tags = extractTags(content)
    expect(tags).not.toContain('ceci-est-du-code')
    expect(tags).toContain('vrai-tag')
  })

  it('ignore les tags dans le code inline', () => {
    const content = 'Texte `#pas-un-tag` et #vrai-tag'
    const tags = extractTags(content)
    expect(tags).not.toContain('pas-un-tag')
    expect(tags).toContain('vrai-tag')
  })

  it('convertit en minuscules', () => {
    const tags = extractTags('Texte avec #JavaScript')
    expect(tags).toContain('javascript')
  })
})
