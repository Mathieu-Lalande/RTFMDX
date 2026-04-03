/**
 * Lance Electron en s'assurant que ELECTRON_RUN_AS_NODE est absent.
 * Nécessaire quand on lance depuis VSCode/Claude Code qui héritent de
 * la variable ELECTRON_RUN_AS_NODE=1 de leur propre runtime Electron.
 */
const { spawn } = require('child_process')
const path = require('path')

const electronPath = require('electron')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const args = process.argv.slice(2)

const child = spawn(electronPath, ['.', ...args], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
})

child.on('close', (code) => process.exit(code ?? 0))
