import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { BYTES_PER_MB, type Limits } from '../shared/limits'
import { strings } from '../shared/strings'
import { textWindow } from './textWindow'

/** The bots' files: tool paths are relative to the local library at `root`, or absolute (`~` is the home directory) and reach anywhere. */
export function createWorkspace(root: string) {
  fs.mkdirSync(root, { recursive: true })
  const realRoot = fs.realpathSync(root)

  // For paths the renderer hands in: rejects `..` escapes and symlinks that point outside, by checking the deepest existing ancestor's real path.
  function resolve(rel: string): string {
    const abs = path.resolve(realRoot, rel)
    let probe = abs
    // lstat, not exists: a dangling symlink counts as present, so realpath below fails instead of writing through it
    while (!fs.lstatSync(probe, { throwIfNoEntry: false })) probe = path.dirname(probe)
    const real = path.join(fs.realpathSync(probe), path.relative(probe, abs))
    if (real !== realRoot && !real.startsWith(realRoot + path.sep))
      throw new Error(strings().harness.library.outside(rel))
    return real
  }

  const locate = (input: string) => path.resolve(realRoot, input.replace(/^~(?=$|[\\/])/, os.homedir()))

  // bigger files (videos etc.) are refused instead of loaded into memory
  function readText(target: string, fileMegabytes: number): string {
    const file = locate(target)
    if (fs.statSync(file).size > fileMegabytes * BYTES_PER_MB)
      throw new Error(`文件超过 ${fileMegabytes} MB，不读取：${target}`)
    return fs.readFileSync(file, 'utf8')
  }

  function write(target: string, content: string | Uint8Array): string {
    const file = locate(target)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
    const relative = path.relative(realRoot, file)
    const isOutside = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
    return isOutside ? file : relative
  }

  return {
    root: realRoot,
    resolve,
    has(rel: string) {
      try {
        return fs.statSync(resolve(rel), { throwIfNoEntry: false })?.isFile() ?? false
      } catch {
        return false // outside the library, a symlink loop or no permission: not a file to offer
      }
    },
    list(dir = '.') {
      return fs
        .readdirSync(locate(dir), { withFileTypes: true })
        .filter((d) => !d.name.startsWith('.'))
        .map((d) => (d.isDirectory() ? `${d.name}/` : d.name))
    },
    read(target: string, offset: number, { fileMegabytes, readWindowChars }: Limits) {
      return textWindow(readText(target, fileMegabytes), offset, readWindowChars)
    },
    write,
    /** Replaces the one place `oldText` appears; the model rewriting a whole long file gets cut off by its output limit. */
    edit(target: string, oldText: string, newText: string, { fileMegabytes }: Limits) {
      const text = readText(target, fileMegabytes)
      const at = text.indexOf(oldText)
      if (at === -1)
        throw new Error(`${target} 里没有找到要替换的原文：先用 read_file 读出来，一字不差地照抄那一段，包括空格和换行`)
      if (text.includes(oldText, at + 1))
        throw new Error(`要替换的原文在 ${target} 里不止一处：多带几句前后文，让它只对得上一处`)
      return write(target, text.slice(0, at) + newText + text.slice(at + oldText.length))
    },
  }
}

export type Workspace = ReturnType<typeof createWorkspace>
