const { realpathSync } = require('node:fs')
const { spawnSync } = require('node:child_process')

// On Windows, inconsistent directory casing can load Playwright twice under Node's ESM loader.
const result = spawnSync(process.execPath, [realpathSync.native(require.resolve('@playwright/test/cli')), 'test', ...process.argv.slice(2)], {
  cwd: realpathSync.native(process.cwd()),
  stdio: 'inherit',
})
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
