import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const output = resolve('dist/build/h5')
const required = ['index.html', 'manifest.webmanifest', 'sw.js']

for (const file of required) {
  const path = resolve(output, file)
  if (!statSync(path).isFile()) throw new Error(`Missing build artifact: ${file}`)
}

const index = readFileSync(resolve(output, 'index.html'), 'utf8')
if (!index.includes('manifest.webmanifest')) throw new Error('Web manifest is not linked')

const manifest = JSON.parse(readFileSync(resolve(output, 'manifest.webmanifest'), 'utf8'))
if (manifest.display !== 'standalone') throw new Error('PWA display mode must be standalone')
if (!Array.isArray(manifest.icons) || !manifest.icons.length) throw new Error('PWA icon is missing')
for (const icon of manifest.icons) {
  const relativePath = String(icon.src || '').replace(/^\.\//, '')
  if (!relativePath || !statSync(resolve(output, relativePath)).isFile()) {
    throw new Error(`Missing PWA icon artifact: ${icon.src || '(empty)'}`)
  }
}

console.log('PWA build artifacts verified')
