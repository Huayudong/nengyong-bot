// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_LIMITS } from '../shared/limits'

const lookup = vi.fn()
vi.mock('node:dns/promises', () => ({ default: { lookup: (...a: unknown[]) => lookup(...a) } }))
const { fetchUrl, webSearch } = await import('./web')

const reply = (body: string, init: ResponseInit & { headers?: Record<string, string> } = {}) =>
  new Response(body, { status: 200, ...init, headers: { 'content-type': 'text/plain', ...init.headers } })

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
beforeEach(() => {
  lookup.mockResolvedValue([{ address: '140.82.112.6', family: 4 }])
  fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fetchUrl', () => {
  it('returns JSON as text with status and GitHub rate-limit info', async () => {
    fetchMock.mockResolvedValue(
      reply('{"stargazers_count":42}', {
        headers: { 'content-type': 'application/json', 'x-ratelimit-remaining': '59' },
      }),
    )
    const out = await fetchUrl('https://api.github.com/repos/a/b', DEFAULT_LIMITS)
    expect(out).toContain('HTTP 200 https://api.github.com/repos/a/b')
    expect(out).toContain('GitHub API 剩余额度：59')
    expect(out).toContain('"stargazers_count":42')
  })

  it('turns HTML into readable text without scripts', async () => {
    fetchMock.mockResolvedValue(
      reply('<html><script>evil()</script><h1>标题</h1><p>a &amp; b</p></html>', {
        headers: { 'content-type': 'text/html' },
      }),
    )
    const out = await fetchUrl('https://example.com', DEFAULT_LIMITS)
    expect(out).toContain('标题\na & b')
    expect(out).not.toContain('evil')
  })

  it('refuses non-http schemes, private addresses and names that resolve to them', async () => {
    await expect(fetchUrl('file:///etc/passwd', DEFAULT_LIMITS)).rejects.toThrow(/http\/https/)
    await expect(fetchUrl('http://127.0.0.1:3000', DEFAULT_LIMITS)).rejects.toThrow(/内网/)
    await expect(fetchUrl('http://169.254.169.254/latest/meta-data', DEFAULT_LIMITS)).rejects.toThrow(/内网/)
    await expect(fetchUrl('http://[::ffff:192.168.1.1]/', DEFAULT_LIMITS)).rejects.toThrow(/内网/)
    lookup.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }])
    await expect(fetchUrl('https://intranet.example', DEFAULT_LIMITS)).rejects.toThrow(/内网/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks every redirect hop, so a public page cannot bounce the bot into the LAN', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://192.168.1.1/admin' } }))
    await expect(fetchUrl('https://example.com/go', DEFAULT_LIMITS)).rejects.toThrow(/内网/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends GITHUB_TOKEN to api.github.com only', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'ghp_secret')
    fetchMock.mockImplementation(async () => reply('ok')) // a fresh body per call
    await fetchUrl('https://api.github.com/repos/a/b', DEFAULT_LIMITS)
    await fetchUrl('https://example.com', DEFAULT_LIMITS)
    const auth = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('Authorization'))
    expect(auth).toEqual(['Bearer ghp_secret', null])
  })

  it('refuses binary content', async () => {
    fetchMock.mockResolvedValueOnce(reply('x', { headers: { 'content-type': 'image/png' } }))
    await expect(fetchUrl('https://example.com/a.png', DEFAULT_LIMITS)).rejects.toThrow(/不是文本/)
  })

  it('shows an error response in full, whatever offset was asked for', async () => {
    fetchMock.mockResolvedValue(
      reply('rate limit exceeded', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }),
    )
    const out = await fetchUrl('https://api.github.com/repos/a/b', DEFAULT_LIMITS, undefined, 20_000)
    expect(out).toContain('HTTP 403')
    expect(out).toContain('GitHub API 剩余额度：0')
    expect(out).toContain('rate limit exceeded')
  })

  it('hands over a long page one window at a time, reading on from an offset', async () => {
    fetchMock.mockImplementation(async () => reply('y'.repeat(25_000)))
    expect(await fetchUrl('https://example.com/big.txt', DEFAULT_LIMITS)).toContain('用 offset=20000 再读')
    expect(await fetchUrl('https://example.com/big.txt', DEFAULT_LIMITS, undefined, 20_000)).toContain('已到结尾')
  })

  it('cuts a page off at the download size set in the limits', async () => {
    fetchMock.mockResolvedValue(reply('z'.repeat(1_500_000)))
    const out = await fetchUrl('https://example.com/big.txt', { ...DEFAULT_LIMITS, webMegabytes: 1 })
    expect(out).toContain('内容超过 1MB，只取了前面这部分')
  })
})

describe('webSearch', () => {
  it('posts to the DeepSeek search API with the key and returns compact results', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: 'AI SDK 7',
              url: 'https://vercel.com/blog/ai-sdk-7',
              site_name: 'Vercel',
              date: '2026-06-24T16:00:00+00:00',
              rerank_score: 2.539,
              summary: 's'.repeat(2000),
              content: 'ignored',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const hits = await webSearch('AI SDK 7', 'sk-test')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.deepseek.com/v1/tools/search')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer sk-test')
    expect(JSON.parse(String(init?.body))).toEqual({ query: 'AI SDK 7', count: 8 })
    expect(hits).toEqual([
      {
        title: 'AI SDK 7',
        url: 'https://vercel.com/blog/ai-sdk-7',
        site: 'Vercel',
        date: '2026-06-24T16:00:00+00:00',
        score: 2.5,
        summary: 's'.repeat(800),
      },
    ])
  })

  it('explains billing and rate-limit failures in plain words', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 402 }))
    await expect(webSearch('x', 'sk-test')).rejects.toThrow('余额不足')
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 429 }))
    await expect(webSearch('x', 'sk-test')).rejects.toThrow('太频繁')
  })
})
