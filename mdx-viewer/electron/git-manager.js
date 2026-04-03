const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

/**
 * Lance une commande git de façon sécurisée (pas de shell, args en tableau).
 * @param {string[]} args - Arguments git (ex: ['config', '--get', 'remote.origin.url'])
 * @param {string} cwd - Répertoire de travail
 * @returns {{ stdout: string, error: Error | null }}
 */
function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8', timeout: 5000 })
  if (result.error) return { stdout: '', error: result.error }
  if (result.status !== 0) return { stdout: '', error: new Error(result.stderr?.trim() || `git exited with code ${result.status}`) }
  return { stdout: result.stdout.trim(), error: null }
}

class GitManager {
  constructor() {
    this.gitPath = null
    this.repoInfo = null
  }

  /**
   * Détecte si un répertoire est un repo git
   */
  isGitRepo(dir) {
    try {
      const gitDir = path.join(dir, '.git')
      return fs.existsSync(gitDir)
    } catch {
      return false
    }
  }

  /**
   * Obtient les infos du repo git (remote, branch, etc.)
   */
  getRepoInfo(dir) {
    try {
      if (!this.isGitRepo(dir)) return null

      const remoteUrl = git(['config', '--get', 'remote.origin.url'], dir).stdout
      const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], dir).stdout
      const status = git(['status', '--porcelain'], dir).stdout

      return {
        isGit: true,
        path: dir,
        remoteUrl,
        branch,
        hasChanges: status.length > 0,
        status,
      }
    } catch (err) {
      console.error('Git info error:', err)
      return null
    }
  }


  /**
   * Ouvre un repo git existant
   */
  openRepo(dir) {
    if (!fs.existsSync(dir)) {
      return { success: false, error: 'Le répertoire n\'existe pas' }
    }

    if (!this.isGitRepo(dir)) {
      return { success: false, error: 'Ce n\'est pas un repo git' }
    }

    this.gitPath = dir
    this.repoInfo = this.getRepoInfo(dir)

    return {
      success: true,
      path: dir,
      info: this.repoInfo,
    }
  }

  /**
   * Récupère les fichiers .md ET .mxt du repo
   */
  getMarkdownFiles(dir = this.gitPath) {
    if (!dir || !fs.existsSync(dir)) return []

    const results = []
    function walk(current) {
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (/\.(md|mxt)$/i.test(entry.name)) {
          results.push({
            name: entry.name,
            path: fullPath,
            relativePath: path.relative(dir, fullPath),
          })
        }
      }
    }

    walk(dir)
    return results
  }

  /**
   * Lit un fichier .md
   */
  readMarkdownFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
      return null
    }
  }

  /**
   * Écrit un fichier .md
   */
  writeMarkdownFile(filePath, content) {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

}

module.exports = new GitManager()
