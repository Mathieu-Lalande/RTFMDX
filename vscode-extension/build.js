/**
 * Post-install build: copie le CSS highlight.js dans media/
 */
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, 'node_modules', 'highlight.js', 'styles', 'atom-one-dark.css')
const dst = path.join(__dirname, 'media', 'hljs.css')

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst)
  console.log('✓ highlight.js CSS copié dans media/hljs.css')
} else {
  // Fallback : fichier CSS minimal pour ne pas bloquer l'extension
  fs.writeFileSync(dst, '/* highlight.js styles — run npm install in vscode-extension/ */')
  console.warn('⚠ highlight.js non trouvé — lancez npm install dans vscode-extension/')
}
