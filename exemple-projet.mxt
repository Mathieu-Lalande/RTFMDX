---
title: Projet — Démo WikiLinks
date: 2026-04-03
tags: [projet, wiki, navigation]
author: Mathieu Lalande
---

# Projet — Démo WikiLinks

<Callout type="tip" title="Navigation entre fichiers">
  Ce fichier et [[exemple]] sont **liés entre eux** via des wiki links `[[...]]`.
  Cliquez sur un lien pour naviguer, puis **Alt+←** pour revenir.
</Callout>

---

## Comment fonctionnent les wiki links

Un wiki link `[[nom-fichier]]` crée un lien cliquable vers n'importe quel fichier du vault :

| Syntaxe | Résultat |
|---------|----------|
| `[[exemple]]` | Lien vers `exemple.MXT` |
| `[[exemple\|texte libre]]` | Même lien, label personnalisé |
| `[[fichier-absent]]` | Lien en jaune — fichier introuvable |

---

## Structure de ce vault

<CardGrid>
  <Card title="Référence complète" icon="book">
    [[exemple]] — tous les composants, syntaxes MXT et raccourcis clavier disponibles dans l'application.
  </Card>
  <Card title="Ce fichier" icon="link">
    [[exemple-projet]] — démo de la navigation inter-fichiers et des backlinks.
  </Card>
</CardGrid>

---

## Backlinks — la feature clé

Quand vous ouvrez ce fichier depuis [[exemple]], la section **Backlinks** en bas de la sidebar
affiche automatiquement `exemple` comme référent — sans configuration.

<Steps>
  - Ouvrez [[exemple]] (cliquez sur ce lien)
  - Revenez ici avec **Alt+←**
  - Regardez le panneau **Backlinks** en bas à gauche
  - `exemple` apparaît comme fichier qui référence ce document
</Steps>

---

## Cas d'usage concrets

<Tabs>
  <Tab label="Base de connaissance">
    Une page d'index centrale qui référence toutes vos notes :

    ```markdown
    ## Documentation
    - [[installation]] — Guide d'installation
    - [[configuration]] — Options avancées
    - [[exemple]] — Référence des composants

    ## Projets
    - [[exemple-projet]] — Démo navigation
    ```
  </Tab>
  <Tab label="Journal de projet">
    Chaque entrée référence les specs correspondantes :

    ```markdown
    ## 2026-04-03
    Réunion sur [[architecture-auth]].
    Décision : voir [[decisions-log#auth-v2]].
    Dépend de [[api-reference]].
    ```
  </Tab>
  <Tab label="Documentation liée">
    Docs modulaires interconnectées — chaque page reste courte
    et délègue les détails à d'autres fichiers :

    ```markdown
    ## Installation
    Voir [[installation-windows]] ou [[installation-mac]].

    ## Configuration avancée
    Consultez [[configuration-avancee]].
    ```
  </Tab>
</Tabs>

---

<Callout type="success" title="Prêt à construire votre vault ?">
  1. Ouvrez votre dossier comme vault via la sidebar
  2. Créez vos fichiers `.MXT` avec le bouton **+** ou **Ctrl+P → Template**
  3. Reliez-les avec `[[nom-fichier]]`
  4. La navigation et les backlinks fonctionnent immédiatement

  Revenez à la [[exemple|référence complète]] pour explorer tous les composants.
</Callout>
