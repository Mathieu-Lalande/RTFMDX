import { useState, useEffect, useRef, useMemo } from 'react'
import { useVault } from '../context/VaultContext.jsx'

// ─── Icônes SVG ──────────────────────────────────────────────────────────────
function PaletteIcon({ id }) {
  const props = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
  switch (id) {
    case 'eye':      return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'columns':  return <svg {...props}><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
    case 'edit':     return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    case 'file-new': return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
    case 'folder':   return <svg {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    case 'save':     return <svg {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    case 'file':     return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    case 'book':     return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'user':     return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'api':      return <svg {...props}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'layers':   return <svg {...props}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    case 'clock':    return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'example':  return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
    default:         return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  }
}

const BUILTIN_COMMANDS = [
  { id: 'mode-read',              label: 'Vue : Lecture',             iconId: 'eye',      category: 'Vue' },
  { id: 'mode-split',             label: 'Vue : Split',               iconId: 'columns',  category: 'Vue' },
  { id: 'mode-edit',              label: 'Vue : Édition',             iconId: 'edit',     category: 'Vue' },
  { id: 'new-file',               label: 'Nouveau fichier',           iconId: 'file-new', category: 'Fichier' },
  { id: 'open-vault',             label: 'Ouvrir un vault',           iconId: 'folder',   category: 'Vault' },
  { id: 'save',                   label: 'Sauvegarder',               iconId: 'save',     category: 'Fichier' },
  { id: 'open-builtin-example',   label: "Ouvrir l'exemple intégré",  iconId: 'example',  category: 'Fichier' },
]

const TEMPLATES = [
  {
    id: 'tpl-blank',
    label: 'Template : Page vierge',
    iconId: 'file',
    category: 'Template',
    content: `---
title:
date: ${new Date().toISOString().slice(0, 10)}
tags: []
---

# Titre

`
  },
  {
    id: 'tpl-doc',
    label: 'Template : Documentation',
    iconId: 'book',
    category: 'Template',
    content: `---
title:
date: ${new Date().toISOString().slice(0, 10)}
tags: [documentation]
---

# Titre

Courte description du sujet.

---

## Vue d'ensemble

## Prérequis

<Callout type="info" title="Avant de commencer">
  Listez ici les prérequis ou dépendances nécessaires.
</Callout>

## Installation

<Steps>
  - Première étape
  - Deuxième étape
  - Troisième étape
</Steps>

## Configuration

\`\`\`yaml
# Exemple de configuration
option: valeur
\`\`\`

## Utilisation

## Dépannage

<Callout type="warning" title="Problème courant">
  Description et solution.
</Callout>

## Voir aussi

- [[]]
`
  },
  {
    id: 'tpl-guide',
    label: 'Template : Guide client',
    iconId: 'user',
    category: 'Template',
    content: `---
title: Guide —
date: ${new Date().toISOString().slice(0, 10)}
tags: [guide, client]
---

# Guide —

<Callout type="tip" title="Objectif">
  À l'issue de ce guide, vous serez capable de…
</Callout>

## Ce dont vous aurez besoin

- Élément 1
- Élément 2

## Procédure

<Steps>
  - **Étape 1** — Description claire de l'action
  - **Étape 2** — Description claire de l'action
  - **Étape 3** — Description claire de l'action
</Steps>

## Résultat attendu

## Questions fréquentes

**Q : Question ?**
R : Réponse.

**Q : Question ?**
R : Réponse.

## Support

> Pour toute question, contactez notre équipe.
`
  },
  {
    id: 'tpl-ref',
    label: 'Template : Référence API',
    iconId: 'api',
    category: 'Template',
    content: `---
title: Référence API —
date: ${new Date().toISOString().slice(0, 10)}
tags: [api, référence]
---

# Référence API —

<Tabs>
  <Tab label="Vue d'ensemble">
    Courte description de l'API.

    **Base URL :** \`https://api.exemple.com/v1\`

    **Authentification :** Bearer token dans le header \`Authorization\`.
  </Tab>
  <Tab label="Endpoints">
    ### \`GET /resource\`

    <Badge variant="success">Stable</Badge> <Badge variant="primary">v1</Badge>

    **Paramètres :**

    | Paramètre | Type | Requis | Description |
    |-----------|------|--------|-------------|
    | \`id\`    | string | Oui  | Identifiant |

    **Réponse 200 :**

    \`\`\`json
    {
      "id": "abc123",
      "status": "ok",
      "data": {}
    }
    \`\`\`

    ### \`POST /resource\`

    <Badge variant="beta">Beta</Badge>

    **Body :**

    \`\`\`json
    {
      "name": "string",
      "value": "string"
    }
    \`\`\`
  </Tab>
  <Tab label="Erreurs">
    | Code | Message | Cause |
    |------|---------|-------|
    | 400  | Bad Request | Paramètre manquant |
    | 401  | Unauthorized | Token invalide |
    | 404  | Not Found | Ressource inexistante |
    | 500  | Server Error | Erreur interne |
  </Tab>
</Tabs>
`
  },
  {
    id: 'tpl-meeting',
    label: 'Template : Note de réunion',
    iconId: 'calendar',
    category: 'Template',
    content: `---
title: Réunion du ${new Date().toISOString().slice(0, 10)}
date: ${new Date().toISOString().slice(0, 10)}
tags: [réunion]
---

# Réunion du ${new Date().toISOString().slice(0, 10)}

**Participants :**
**Durée :**

---

## Ordre du jour

- Point 1
- Point 2
- Point 3

## Notes

### Point 1

### Point 2

### Point 3

## Décisions prises

<Callout type="success" title="Décisions">
  - Décision 1
  - Décision 2
</Callout>

## Actions à suivre

| Action | Responsable | Échéance |
|--------|-------------|----------|
|        |             |          |

## Prochaine réunion

Date :
`
  },
  {
    id: 'tpl-adr',
    label: 'Template : Décision technique (ADR)',
    iconId: 'layers',
    category: 'Template',
    content: `---
title: ADR — Titre de la décision
date: ${new Date().toISOString().slice(0, 10)}
tags: [adr, architecture]
---

# ADR — Titre de la décision

<Tabs>
  <Tab label="Statut">
    <Badge variant="warning">Proposé</Badge>

    Remplace : —
    Remplacé par : —
  </Tab>
  <Tab label="Contexte">
    Décrivez le problème ou le besoin qui nécessite cette décision.
    Quelles sont les contraintes ? Quels sont les enjeux ?
  </Tab>
  <Tab label="Décision">
    **Nous allons…**

    Description précise de la solution retenue et pourquoi.
  </Tab>
  <Tab label="Conséquences">
    **Avantages :**
    - Point positif 1
    - Point positif 2

    **Inconvénients / risques :**
    - Point négatif 1

    **Alternatives considérées :**
    - Option A — rejetée parce que…
    - Option B — rejetée parce que…
  </Tab>
</Tabs>
`
  },
]

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function CommandPalette({ open, onClose, onAction, mode }) {
  const { vaultFiles, openFileByPath, createFile, openVault, recentFiles, openBuiltinExample } = useVault()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  const items = useMemo(() => {
    const q = query.toLowerCase()
    const files = vaultFiles.map(f => ({
      id: `file:${f.path}`,
      label: f.name.replace(/\.(mdx?|md)$/, ''),
      iconId: 'file',
      category: 'Fichiers',
      action: () => openFileByPath(f.path),
    }))
    const cmds = BUILTIN_COMMANDS.map(c => {
      if (c.id === 'open-vault') return { ...c, action: openVault }
      if (c.id === 'open-builtin-example') return { ...c, action: () => openBuiltinExample() }
      if (c.id === 'new-file') return {
        ...c,
        action: async () => {
          const result = await createFile({ name: 'nouveau-fichier' })
          if (result?.ok) onAction('reload-file', { path: result.path, content: '' })
        }
      }
      return { ...c, action: () => onAction(c.id) }
    })
    const tpls = TEMPLATES.map(t => ({
      ...t,
      action: async () => {
        const name = t.id.replace('tpl-', '') + '-' + Date.now()
        const result = await createFile({ name })
        if (result.ok) {
          // Écrit le contenu du template
          await window.electron.saveFile({ path: result.path, content: t.content })
          onAction('reload-file', { path: result.path, content: t.content })
        }
      }
    }))
    const recents = (recentFiles || []).map(r => ({
      id: `recent:${r.path}`,
      label: r.name.replace(/\.(mdx?|md)$/, ''),
      subtitle: r.path,
      iconId: 'clock',
      category: 'Récents',
      action: () => openFileByPath(r.path),
    }))

    const all = [...cmds, ...recents, ...tpls, ...files]
    const filtered = q ? all.filter(i => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.subtitle && i.subtitle.toLowerCase().includes(q))) : all
    return filtered
  }, [query, vaultFiles, openFileByPath, createFile, openVault, onAction, recentFiles, openBuiltinExample])

  // Scroll l'item sélectionné dans la vue
  useEffect(() => {
    const el = listRef.current?.children[selected]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && items[selected]) { items[selected].action(); onClose() }
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  // Groupement par catégorie
  const groups = []
  let lastCat = null
  items.forEach((item, i) => {
    if (item.category !== lastCat) { groups.push({ type: 'header', label: item.category }); lastCat = item.category }
    groups.push({ type: 'item', item, idx: i })
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '580px', maxWidth: '90vw',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKey}
            placeholder="Rechercher commandes, fichiers, templates..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px' }}>Esc</kbd>
        </div>

        {/* Liste */}
        <div ref={listRef} style={{ maxHeight: '400px', overflowY: 'auto', padding: '6px' }}>
          {items.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Aucun résultat pour "{query}"
            </div>
          ) : groups.map((g, i) =>
            g.type === 'header' ? (
              <div key={`h-${i}`} style={{ padding: '8px 10px 4px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {g.label}
              </div>
            ) : (
              <div
                key={g.item.id}
                onClick={() => { g.item.action(); onClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                  background: g.idx === selected ? 'var(--accent-soft)' : 'transparent',
                  color: g.idx === selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px',
                }}
                onMouseEnter={() => setSelected(g.idx)}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: g.idx === selected ? 'var(--accent-hover)' : 'var(--text-muted)' }}>
                  <PaletteIcon id={g.item.iconId} />
                </span>
                <span style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {highlight(g.item.label, query)}
                  </span>
                  {g.item.subtitle && (
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {g.item.subtitle}
                    </span>
                  )}
                </span>
                {g.idx === selected && (
                  <kbd style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>↵</kbd>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>↑↓ naviguer</span>
          <span>↵ ouvrir</span>
          <span>Esc fermer</span>
        </div>
      </div>
    </div>
  )
}
