const vscode = require('vscode')
const { PreviewPanel } = require('./src/previewPanel')

const SUPPORTED = new Set(['.mxt', '.md'])

function isSupported(doc) {
  if (!doc || doc.isUntitled) return false
  const ext = require('path').extname(doc.fileName).toLowerCase()
  return SUPPORTED.has(ext)
}

function activate(context) {
  // Commande principale : ouvrir/révéler le panneau aperçu
  context.subscriptions.push(
    vscode.commands.registerCommand('mxt.openPreview', () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showInformationMessage('Ouvrez un fichier .mxt ou .md pour afficher l\'aperçu.')
        return
      }
      if (!isSupported(editor.document)) {
        vscode.window.showInformationMessage('Seuls les fichiers .mxt et .md sont supportés.')
        return
      }
      PreviewPanel.createOrReveal(context, editor.document)
    }),

    vscode.commands.registerCommand('mxt.openPreviewToSide', () => {
      vscode.commands.executeCommand('mxt.openPreview')
    }),

    // Mise à jour en temps réel lors de l'édition
    vscode.workspace.onDidChangeTextDocument(e => {
      if (!isSupported(e.document)) return
      const panel = PreviewPanel.panels.get(e.document.fileName)
      panel?.update(e.document)
    }),

    // Mise à jour quand on change d'onglet actif
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor || !isSupported(editor.document)) return
      const panel = PreviewPanel.panels.get(editor.document.fileName)
      panel?.update(editor.document)
    }),

    // Ouvrir automatiquement l'aperçu pour les .mxt
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) return
      const ext = require('path').extname(editor.document.fileName).toLowerCase()
      if (ext === '.mxt' && !PreviewPanel.panels.has(editor.document.fileName)) {
        PreviewPanel.createOrReveal(context, editor.document)
      }
    })
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
