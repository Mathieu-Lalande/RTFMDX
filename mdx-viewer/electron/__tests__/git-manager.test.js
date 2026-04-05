import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Le git-manager est un singleton — on l'importe après le mock fs si besoin
// Ici on teste directement avec un dossier temporaire réel (Node env)
import gitManager from '../git-manager.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mxt-test-'))
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// ─── isGitRepo ────────────────────────────────────────────────────────────────

describe('GitManager.isGitRepo', () => {
  let tmpDir

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { cleanDir(tmpDir) })

  it('retourne false pour un dossier sans .git', () => {
    expect(gitManager.isGitRepo(tmpDir)).toBe(false)
  })

  it('retourne true pour un dossier avec un sous-dossier .git', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'))
    expect(gitManager.isGitRepo(tmpDir)).toBe(true)
  })

  it('retourne false pour un chemin inexistant', () => {
    expect(gitManager.isGitRepo('/chemin/qui/nexiste/pas')).toBe(false)
  })
})

// ─── getMarkdownFiles ─────────────────────────────────────────────────────────

describe('GitManager.getMarkdownFiles', () => {
  let tmpDir

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { cleanDir(tmpDir) })

  it('retourne un tableau vide pour un dossier vide', () => {
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toEqual([])
  })

  it('trouve les fichiers .md', () => {
    fs.writeFileSync(path.join(tmpDir, 'note.md'), '# Note')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('note.md')
  })

  it('trouve les fichiers .mxt', () => {
    fs.writeFileSync(path.join(tmpDir, 'doc.mxt'), '# Doc')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('doc.mxt')
  })

  it('ignore les fichiers non-markdown', () => {
    fs.writeFileSync(path.join(tmpDir, 'image.png'), '')
    fs.writeFileSync(path.join(tmpDir, 'script.js'), '')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(0)
  })

  it('parcourt les sous-dossiers récursivement', () => {
    const sub = path.join(tmpDir, 'docs')
    fs.mkdirSync(sub)
    fs.writeFileSync(path.join(sub, 'intro.md'), '# Intro')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('intro.md')
    expect(files[0].relativePath).toBe(path.join('docs', 'intro.md'))
  })

  it('ignore les dossiers cachés (commençant par .)', () => {
    const hidden = path.join(tmpDir, '.git')
    fs.mkdirSync(hidden)
    fs.writeFileSync(path.join(hidden, 'config.md'), '# Config')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(0)
  })

  it('ignore node_modules', () => {
    const nm = path.join(tmpDir, 'node_modules')
    fs.mkdirSync(nm)
    fs.writeFileSync(path.join(nm, 'readme.md'), '# Module')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(files).toHaveLength(0)
  })

  it('retourne le chemin absolu et le chemin relatif', () => {
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test')
    const files = gitManager.getMarkdownFiles(tmpDir)
    expect(path.isAbsolute(files[0].path)).toBe(true)
    expect(files[0].relativePath).toBe('test.md')
  })

  it('retourne un tableau vide si le dossier n\'existe pas', () => {
    const files = gitManager.getMarkdownFiles('/dossier/inexistant')
    expect(files).toEqual([])
  })
})

// ─── readMarkdownFile ─────────────────────────────────────────────────────────

describe('GitManager.readMarkdownFile', () => {
  let tmpDir

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { cleanDir(tmpDir) })

  it('lit le contenu d\'un fichier existant', () => {
    const filePath = path.join(tmpDir, 'note.md')
    fs.writeFileSync(filePath, '# Contenu de test')
    expect(gitManager.readMarkdownFile(filePath)).toBe('# Contenu de test')
  })

  it('retourne null pour un fichier inexistant', () => {
    expect(gitManager.readMarkdownFile('/inexistant.md')).toBeNull()
  })
})

// ─── writeMarkdownFile ────────────────────────────────────────────────────────

describe('GitManager.writeMarkdownFile', () => {
  let tmpDir

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { cleanDir(tmpDir) })

  it('écrit un fichier avec succès', () => {
    const filePath = path.join(tmpDir, 'output.md')
    const result = gitManager.writeMarkdownFile(filePath, '# Nouveau')
    expect(result.success).toBe(true)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('# Nouveau')
  })

  it('crée les dossiers intermédiaires si besoin', () => {
    const filePath = path.join(tmpDir, 'sous', 'dossier', 'note.md')
    const result = gitManager.writeMarkdownFile(filePath, '# Deep')
    expect(result.success).toBe(true)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('retourne success: false si le chemin est invalide', () => {
    // Essayer d'écrire dans un chemin impossible
    const result = gitManager.writeMarkdownFile('', 'contenu')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// ─── openRepo ─────────────────────────────────────────────────────────────────

describe('GitManager.openRepo', () => {
  let tmpDir

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { cleanDir(tmpDir) })

  it('échoue si le dossier n\'existe pas', () => {
    const result = gitManager.openRepo('/inexistant')
    expect(result.success).toBe(false)
  })

  it('échoue si le dossier n\'est pas un repo git', () => {
    const result = gitManager.openRepo(tmpDir)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/repo git/)
  })

  it('réussit si le dossier contient un .git', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'))
    // Créer la structure minimale pour que git ne plante pas
    // (git config, HEAD, etc.) — on mock juste isGitRepo
    const spy = vi.spyOn(gitManager, 'getRepoInfo').mockReturnValue({
      isGit: true, path: tmpDir, remoteUrl: '', branch: 'main', hasChanges: false, status: '',
    })
    const result = gitManager.openRepo(tmpDir)
    expect(result.success).toBe(true)
    expect(result.path).toBe(tmpDir)
    spy.mockRestore()
  })
})
