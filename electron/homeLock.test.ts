// @vitest-environment node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it } from 'vitest'
import { LOCK_FILE, lockHome } from './homeLock'

let home: string
beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-lock-'))
})

it('gives the home to one copy at a time', () => {
  const release = lockHome(home)
  expect(release).not.toBeNull()
  expect(lockHome(home)).toBeNull()
  release?.()
  expect(lockHome(home)).not.toBeNull()
})

it('takes over a lock left behind by a copy that is gone', () => {
  const { stdout } = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], {
    encoding: 'utf8',
  })
  fs.writeFileSync(path.join(home, LOCK_FILE), stdout)
  expect(lockHome(home)).not.toBeNull()
})

it('keeps a lock per home', () => {
  expect(lockHome(home)).not.toBeNull()
  expect(lockHome(fs.mkdtempSync(path.join(os.tmpdir(), 'home-lock-')))).not.toBeNull()
})
