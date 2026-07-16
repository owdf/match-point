import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const uni = typeof uniModule === 'function' ? uniModule : uniModule.default

function copyPwaAssets() {
  return {
    name: 'copy-pwa-assets',
    apply: 'build',
    writeBundle(options) {
      for (const file of ['manifest.webmanifest', 'sw.js']) {
        copyFileSync(resolve('public', file), resolve(options.dir, file))
      }
      copyFileSync(resolve('static/logo.png'), resolve(options.dir, 'icon.png'))
    }
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [uni(), copyPwaAssets()]
})
