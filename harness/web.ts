import dns from 'node:dns/promises'
import net from 'node:net'
import { z } from 'zod'
import { BYTES_PER_MB, type Limits } from '../shared/limits'
import { clip, textWindow } from './textWindow'

const MAX_REDIRECTS = 5
const SEARCH_TIMEOUT_MS = 15_000

// Loopback, private, link-local (cloud metadata 169.254.169.254), CGNAT and unique-local ranges: a bot must not reach your LAN.
const BLOCKED = new net.BlockList()
for (const [ip, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
] as const)
  BLOCKED.addSubnet(ip, bits, 'ipv4')
for (const [ip, bits] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
] as const)
  BLOCKED.addSubnet(ip, bits, 'ipv6')

function isBlocked(ip: string): boolean {
  // ::ffff:a.b.c.d is IPv4 written as IPv6 and must be checked as IPv4
  const v4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)?.[1] ?? (net.isIPv4(ip) ? ip : null)
  return v4 ? BLOCKED.check(v4, 'ipv4') : BLOCKED.check(ip, 'ipv6')
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error(`只能读取 http/https 网址：${url.protocol}`)
  if (url.username || url.password) throw new Error('网址里不能带账号密码')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((a) => a.address)
  // shortcut: fetch resolves the name again, so DNS rebinding could slip past this check; pin the IP with a custom agent if this ever handles hostile hosts
  if (addresses.some(isBlocked)) throw new Error(`不能访问内网或本机地址：${url.hostname}`)
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

async function readCapped(res: Response, maxBytes: number): Promise<{ text: string; cut: boolean }> {
  const reader = res.body?.getReader()
  if (!reader) return { text: '', cut: false }
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return { text: new TextDecoder().decode(Buffer.concat(chunks)), cut: false }
    size += value.length
    if (size > maxBytes) {
      await reader.cancel()
      return { text: new TextDecoder().decode(Buffer.concat(chunks)), cut: true }
    }
    chunks.push(value)
  }
}

const SEARCH_ERRORS: Record<number, string> = {
  401: 'DeepSeek API Key 无效',
  402: 'DeepSeek 账户余额不足，无法搜索',
  429: '搜索太频繁，稍等再试',
}

const SearchResponse = z.object({ results: z.array(z.record(z.string(), z.unknown())).default([]) })

/** The bots' WebSearch, backed by DeepSeek's search API (same key as the model, billed per successful search). */
export async function webSearch(query: string, apiKey: string) {
  const res = await fetch('https://api.deepseek.com/v1/tools/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, count: 8 }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(SEARCH_ERRORS[res.status] ?? `搜索失败（HTTP ${res.status}）`)
  const { results } = SearchResponse.parse(await res.json())
  return results.map((r) => ({
    title: r.title,
    url: r.url,
    site: r.site_name,
    date: r.date,
    score: typeof r.rerank_score === 'number' ? Math.round(r.rerank_score * 10) / 10 : undefined, // 0-3, >=1.5 is a good match
    summary: clip(String(r.summary || r.snippet || ''), 800),
  }))
}

/** The bots' WebFetch: GET a public URL and return it as text. Every redirect hop is checked again. */
export async function fetchUrl(raw: string, limits: Limits, accept?: string, offset = 0): Promise<string> {
  const { webMegabytes, webTimeoutSeconds, readWindowChars } = limits
  let url = new URL(raw)
  let res: Response | undefined
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)
    const headers: Record<string, string> = { 'User-Agent': 'NengyongBot/0.1', Accept: accept ?? '*/*' }
    // the token only ever goes to the GitHub API, never to whatever host a page points at
    if (url.hostname === 'api.github.com' && process.env.GITHUB_TOKEN)
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    res = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(webTimeoutSeconds * 1000) })
    const next = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
    if (!next) break
    url = new URL(next, url)
    if (hop === MAX_REDIRECTS) throw new Error('重定向次数太多')
  }
  if (!res) throw new Error('没有拿到响应')

  const type = res.headers.get('content-type') ?? ''
  if (type && !/text|json|xml|javascript/i.test(type)) throw new Error(`不是文本内容（${type}），无法读取`)
  const { text, cut } = await readCapped(res, webMegabytes * BYTES_PER_MB)
  const body = /html/i.test(type) ? htmlToText(text) : text
  const limit = res.headers.get('x-ratelimit-remaining')
  const head = [
    `HTTP ${res.status} ${url.href}`,
    limit !== null ? `GitHub API 剩余额度：${limit}` : '',
    cut ? `内容超过 ${webMegabytes}MB，只取了前面这部分` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return `${head}\n\n${textWindow(body, res.ok ? offset : 0, readWindowChars)}`
}
