const vscode = require('vscode')
const path = require('path')
const { renderMxt } = require('./renderer')

class PreviewPanel {
  static panels = new Map() // filePath → PreviewPanel

  static createOrReveal(context, document) {
    const filePath = document.fileName
    if (PreviewPanel.panels.has(filePath)) {
      PreviewPanel.panels.get(filePath).reveal(document)
      return
    }
    const panel = new PreviewPanel(context, document)
    PreviewPanel.panels.set(filePath, panel)
  }

  constructor(context, document) {
    this._context = context
    this._filePath = document.fileName
    this._debounceTimer = null

    this._panel = vscode.window.createWebviewPanel(
      'mxtPreview',
      this._getTitle(document.fileName),
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
      }
    )

    this._panel.onDidDispose(() => {
      clearTimeout(this._debounceTimer)
      PreviewPanel.panels.delete(this._filePath)
    })

    this.update(document)
  }

  reveal(document) {
    this._panel.reveal()
    this.update(document)
  }

  update(document) {
    clearTimeout(this._debounceTimer)
    const delay = vscode.workspace.getConfiguration('mxtViewer').get('previewDebounce', 300)
    this._debounceTimer = setTimeout(() => this._doUpdate(document), delay)
  }

  async _doUpdate(document) {
    try {
      const source = document.getText()
      const html = await renderMxt(source)
      this._panel.title = this._getTitle(document.fileName)
      this._panel.webview.html = this._buildHtml(html)
    } catch (err) {
      this._panel.webview.html = this._buildHtml(
        `<div class="error"><strong>Erreur de rendu</strong><pre>${err.message}</pre></div>`
      )
    }
  }

  _getTitle(filePath) {
    return path.basename(filePath, path.extname(filePath)) + ' — Aperçu'
  }

  _buildHtml(content) {
    const webview = this._panel.webview
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'preview.css')
    )
    const hljsCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'hljs.css')
    )
    const config = vscode.workspace.getConfiguration('mxtViewer')
    const themeSetting = config.get('theme', 'auto')
    const themeAttr = themeSetting === 'auto' ? '' : `data-theme="${themeSetting}"`

    return `<!DOCTYPE html>
<html ${themeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">
  <link rel="stylesheet" href="${hljsCssUri}">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <article class="prose">${content}</article>
</body>
</html>`
  }
}

module.exports = { PreviewPanel }
