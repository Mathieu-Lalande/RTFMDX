---
title: Référence complète MXT Viewer
date: 2026-04-03
tags: [référence, MXT, composants, documentation]
author: Mathieu Lalande
---

# Référence MXT Viewer

Guide complet de toutes les fonctionnalités disponibles. Utilisez ce fichier comme **cheat sheet** permanent.

---

## 1. Markdown standard (GFM)

### Formatage de texte

**Gras**, *italique*, ~~barré~~, `code inline`, [lien externe](https://github.com)

> Blockquote avec **mise en forme** intégrée.
> Plusieurs lignes supportées.

### Listes

- Item simple
- Item avec **gras**
  - Sous-item indenté
  - Autre sous-item

1. Étape numérotée
2. Deuxième étape
3. Troisième étape

- [ ] Tâche à faire
- [x] Tâche complète

### Tableaux

| Composant   | Usage                  | Props clés              |
|-------------|------------------------|-------------------------|
| `Callout`   | Alertes colorées       | `type`, `title`         |
| `Steps`     | Étapes numérotées      | —                       |
| `Badge`     | Labels inline          | `variant`               |
| `CodeBlock` | Code avec copier       | `language`              |
| `Tabs`      | Onglets                | —                       |
| `Card`      | Cartes cliquables      | `title`, `icon`, `href` |
| `WikiLink`  | Lien vers fichier vault| `href`                  |

---

## 2. Callouts

Cinq types disponibles :

<Callout type="info" title="Information">
  Utilisez `type="info"` pour les informations générales. Le `title` est optionnel — sans lui, le label par défaut s'affiche.
</Callout>

<Callout type="tip" title="Astuce">
  `type="tip"` pour les conseils pratiques. Supporte le **gras**, l'*italique* et le `code inline`.
</Callout>

<Callout type="success" title="Succès">
  `type="success"` pour confirmer une action réussie ou un état correct.
</Callout>

<Callout type="warning" title="Attention">
  `type="warning"` pour les avertissements — l'action est possible mais risquée.
</Callout>

<Callout type="danger" title="Danger — Irréversible">
  `type="danger"` pour les actions destructrices. Utilisez-le sparingly pour conserver son impact.
</Callout>

---

## 3. Steps — Étapes numérotées

<Steps>
  - Ouvrez un **vault** via la sidebar (icône dossier en haut à gauche)
  - Cliquez sur **+** pour créer un nouveau fichier `.MXT`
  - Passez en mode **Split** (Ctrl+E) pour voir l'éditeur et l'aperçu côte à côte
  - Utilisez `[[nom-fichier]]` pour créer des liens entre fichiers
  - **Ctrl+S** pour sauvegarder
</Steps>

---

## 4. Badges — Labels inline

Variantes : <Badge variant="primary">Primary</Badge> <Badge variant="new">New</Badge> <Badge variant="beta">Beta</Badge> <Badge variant="success">Stable</Badge> <Badge variant="warning">Warning</Badge> <Badge variant="danger">Danger</Badge> <Badge variant="deprecated">Deprecated</Badge>

Utilisables directement dans le texte : API version <Badge variant="primary">v2.1</Badge> — statut <Badge variant="success">Production</Badge>

---

## 5. Blocs de code

Avec bouton **Copier** intégré et affichage du langage :

```javascript
// Composant React avec hooks
import { useState, useEffect } from 'react'

export function Counter({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue)
  
  useEffect(() => {
    document.title = `Compteur : ${count}`
  }, [count])

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clics : {count}
    </button>
  )
}
```

```bash
# Commandes du projet
npm run dev        # Lance en mode développement
npm run build      # Génère le .exe installeur
```

```yaml
# Frontmatter YAML (en haut de chaque fichier)
title: Mon Document
date: 2026-04-03
tags: [tag1, tag2, tag3]
author: Mathieu
```

```python
# Python supporté aussi
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    return [a := a + b and b for _ in range(n)]
```

---

## 6. Onglets

<Tabs>
  <Tab label="Installation">
    ```bash
    cd MXT-viewer
    npm install
    npm run dev
    ```
    L'app s'ouvre automatiquement après que Vite démarre.
  </Tab>
  <Tab label="Développement">
    Le mode **Split** (Ctrl+E) permet d'éditer et voir le rendu en temps réel avec un délai de 400ms.

    Le raccourci **Ctrl+E** cycle entre :
    - Lecture (aperçu plein écran)
    - Split (éditeur + aperçu)
    - Édition (éditeur seul)
  </Tab>
  <Tab label="Production">
    ```bash
    npm run build
    # → dist-electron/MXT Viewer Setup.exe
    ```
    L'installeur enregistre l'association `.MXT` → MXT Viewer dans Windows.
  </Tab>
</Tabs>

---

## 7. Cards

<Card title="Documentation" icon="📚">
  Les Cards acceptent un `title`, un `icon` (emoji ou texte), et un `href` pour être cliquables.
</Card>

<Card title="Lien externe" icon="🔗" href="https://MXTjs.com">
  Avec `href`, la carte devient cliquable et ouvre dans le navigateur système.
</Card>

---

## 8. Liens wiki `[[fichier]]`

Les liens wiki connectent vos fichiers entre eux — cliquez pour naviguer :

- Lien simple : [[exemple-projet]]
- Lien avec alias : [[exemple-projet|Voir le fichier projet]]
- Fichier inexistant (apparaît en jaune) : [[fichier-introuvable]]

**Syntaxe :**
```
[[nom-fichier]]           → lien simple
[[nom-fichier|Mon label]] → lien avec texte personnalisé
```

<Callout type="tip" title="Naviguez entre les fichiers">
  Ouvrez [[exemple-projet]] pour voir un exemple de documentation projet qui référence ce fichier.
  Utilisez **Alt+←** / **Alt+→** pour naviguer dans l'historique.
</Callout>

---

## 9. Tags

Les tags sont extraits automatiquement depuis le **frontmatter** et le contenu.

Dans le frontmatter : `tags: [référence, MXT, documentation]`

Dans le texte : #tag-inline #documentation #MXT-viewer

---

## 10. Frontmatter YAML

Chaque fichier peut commencer par un bloc frontmatter entre `---` :

```yaml
---
title: Titre affiché
date: 2026-04-03
tags: [tag1, tag2]
author: Nom
description: Description courte
---
```

Le frontmatter est parsé et affiché dans l'en-tête du document en mode Lecture.

---

## 11. Images locales

Placez vos images dans le vault et référencez-les :

```markdown
![Description](./images/screenshot.png)
![Logo](assets/logo.svg)
```

Les chemins relatifs sont résolus automatiquement depuis l'emplacement du fichier.

---

## 12. Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+E`  | Cycle Lecture → Split → Édition |
| `Ctrl+S`  | Sauvegarder |
| `Ctrl+O`  | Ouvrir un fichier |
| `Ctrl+P`  | Palette de commandes |
| `Alt+←`   | Fichier précédent (historique) |
| `Alt+→`   | Fichier suivant (historique) |
| `Ctrl+F`  | Recherche dans le vault |

---

<Callout type="tip" title="Workflow recommandé">
  1. Ouvrez votre vault (dossier de docs) depuis la sidebar
  2. Créez vos fichiers `.MXT` avec le bouton **+**
  3. Liez-les avec `[[nom-fichier]]`
  4. Utilisez le mode **Lecture** pour naviguer, **Split** pour éditer
</Callout>
