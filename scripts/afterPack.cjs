const { execFileSync } = require('node:child_process')
const path = require('node:path')

// Without a Developer ID electron-builder leaves the app with only the linker's ad-hoc signature and unsealed
// resources; macOS then reports a downloaded copy as damaged instead of an unidentified developer.
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin' || process.env.CSC_LINK || process.env.CSC_NAME) return
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' })
}
