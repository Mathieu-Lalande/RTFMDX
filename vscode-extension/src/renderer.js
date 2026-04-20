const { marked } = require('marked')
const hljs = require('highlight.js')

// Configure marked avec highlight.js pour la coloration syntaxique
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
  headerIds: true,
})

// Extrait le frontmatter YAML et retourne { meta, body }
function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: source }
  const body = source.slice(match[0].length)
  const meta = {}
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    meta[key] = val
  })
  return { meta, body }
}

// Transforme les composants JSX/MXT en HTML
function preprocessComponents(content) {
  // <Callout type="info" title="Titre">...</Callout>
  content = content.replace(
    /<Callout\s+type="(\w+)"(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/Callout>/g,
    (_, type, title, inner) => {
      const icons = { info: 'ℹ️', warning: '⚠️', error: '❌', success: '✅', tip: '💡' }
      const icon = icons[type] || 'ℹ️'
      const label = title || type.charAt(0).toUpperCase() + type.slice(1)
      return `\n<div class="callout callout-${type}"><div class="callout-title">${icon} ${label}</div><div class="callout-body">\n\n${inner.trim()}\n\n</div></div>\n`
    }
  )

  // <Steps>...</Steps> — enfants sous forme de paragraphes
  content = content.replace(/<Steps>([\s\S]*?)<\/Steps>/g, (_, inner) => {
    return `\n<ol class="steps">${inner}</ol>\n`
  })

  // <Tab label="...">...</Tab> à l'intérieur de <Tabs>
  content = content.replace(
    /<Tabs[^>]*>([\s\S]*?)<\/Tabs>/g,
    (_, inner) => {
      let tabNum = 0
      const tabs = []
      const replaced = inner.replace(/<Tab\s+label="([^"]*)"[^>]*>([\s\S]*?)<\/Tab>/g, (_, label, body) => {
        tabs.push(label)
        tabNum++
        return `<div class="tab-panel"><div class="tab-label">${label}</div><div class="tab-body">\n\n${body.trim()}\n\n</div></div>`
      })
      return `\n<div class="tabs">${replaced}</div>\n`
    }
  )

  // <Card title="..." description="...">...</Card>
  content = content.replace(
    /<Card(?:\s+title="([^"]*)")?(?:\s+description="([^"]*)")?[^>]*>([\s\S]*?)<\/Card>/g,
    (_, title, desc, inner) => {
      const header = title ? `<div class="card-title">${title}</div>` : ''
      const subtext = desc ? `<div class="card-desc">${desc}</div>` : ''
      return `<div class="card">${header}${subtext}<div class="card-body">\n\n${inner.trim()}\n\n</div></div>`
    }
  )

  // <CardGrid>...</CardGrid>
  content = content.replace(/<CardGrid>([\s\S]*?)<\/CardGrid>/g, (_, inner) => {
    return `\n<div class="card-grid">${inner}</div>\n`
  })

  // <Badge variant="success">text</Badge>
  content = content.replace(
    /<Badge(?:\s+variant="(\w+)")?[^>]*>([\s\S]*?)<\/Badge>/g,
    (_, variant, inner) => `<span class="badge badge-${variant || 'default'}">${inner.trim()}</span>`
  )

  // <CodeBlock language="js">...</CodeBlock>
  content = content.replace(
    /<CodeBlock(?:\s+language="(\w+)")?[^>]*>([\s\S]*?)<\/CodeBlock>/g,
    (_, lang, code) => `\n\`\`\`${lang || ''}\n${code.trim()}\n\`\`\`\n`
  )

  // <WikiLink href="name">label</WikiLink>
  content = content.replace(
    /<WikiLink\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/WikiLink>/g,
    (_, href, label) => `[${label || href}](#${encodeURIComponent(href)})`
  )

  // Wiki links [[name|label]] or [[name]]
  content = content.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
    (_, name, label) => `[${label || name}](#${encodeURIComponent(name)})`
  )

  // Composants JSX auto-fermants restants → supprimer
  content = content.replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, '')

  // Autres composants JSX ouvrants/fermants → garder le contenu
  content = content.replace(/<([A-Z][A-Za-z]*)[^>]*>([\s\S]*?)<\/\1>/g, '$2')

  return content
}

// Génère le HTML du frontmatter (titre, date, auteur, tags)
function renderFrontmatterBadge(meta) {
  if (!Object.keys(meta).length) return ''
  const parts = []
  if (meta.date) parts.push(`<span class="fm-date">📅 ${meta.date}</span>`)
  if (meta.author) parts.push(`<span class="fm-author">👤 ${meta.author}</span>`)
  const tags = meta.tags ? String(meta.tags).split(/[,\s]+/).filter(Boolean) : []
  tags.forEach(t => parts.push(`<span class="fm-tag">#${t}</span>`))
  if (!parts.length) return ''
  return `<div class="frontmatter-badge">${parts.join('')}</div>`
}

async function renderMxt(source) {
  const { meta, body } = parseFrontmatter(source)
  const preprocessed = preprocessComponents(body)
  const html = marked.parse(preprocessed)
  const title = meta.title ? `<h1>${meta.title}</h1>` : ''
  const badge = renderFrontmatterBadge(meta)
  return `${title}${badge}${html}`
}

module.exports = { renderMxt }
