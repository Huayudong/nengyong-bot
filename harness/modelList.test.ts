// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listModels } from './modelList'

const account = { service: 'custom' as const, apiKey: 'sk-abc', baseURL: 'https://api.example.com/v1' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('listModels', () => {
  it('asks the endpoint for its models with the key', async () => {
    fetchMock.mockResolvedValue(json({ data: [{ id: 'm1' }] }))
    await listModels(account)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/models',
      expect.objectContaining({ headers: { Authorization: 'Bearer sk-abc' } }),
    )
  })

  it('sends no key to a local service that has none', async () => {
    fetchMock.mockResolvedValue(json({ data: [] }))
    await listModels({ service: 'ollama', apiKey: '', baseURL: 'http://localhost:11434/v1' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/v1/models', expect.objectContaining({ headers: {} }))
  })

  it('returns the chat models sorted by name, leaving out embeddings, speech and image models', async () => {
    fetchMock.mockResolvedValue(
      json({ data: [{ id: 'gpt-5' }, { id: 'text-embedding-3-small' }, { id: 'gpt-image-1' }, { id: 'claude-x' }] }),
    )
    await expect(listModels(account)).resolves.toEqual(['claude-x', 'gpt-5'])
  })

  it('checks an OpenRouter key at /key, as OpenRouter lists its models to anyone', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: [{ id: 'openai/gpt-5' }] })).mockResolvedValueOnce(json({}, 401))
    const openrouter = {
      service: 'openrouter' as const,
      apiKey: 'sk-or-wrong',
      baseURL: 'https://openrouter.ai/api/v1',
    }
    await expect(listModels(openrouter)).rejects.toThrow('API Key 无效')
    expect(fetchMock).toHaveBeenLastCalledWith('https://openrouter.ai/api/v1/key', expect.anything())
  })

  it('returns no models when the server sends no list', async () => {
    fetchMock.mockResolvedValue(json({}))
    await expect(listModels(account)).resolves.toEqual([])
  })

  it('rejects an address that answers with a web page instead of the API', async () => {
    fetchMock.mockResolvedValue(new Response('<!doctype html><html></html>', { status: 200 }))
    await expect(listModels(account)).rejects.toThrow('/v1')
  })

  it('turns HTTP and network failures into readable reasons', async () => {
    fetchMock.mockResolvedValue(json({}, 401))
    await expect(listModels(account)).rejects.toThrow('API Key 无效')
    fetchMock.mockResolvedValue(json({}, 400))
    await expect(listModels(account)).rejects.toThrow('API Key 无效')
    fetchMock.mockResolvedValue(json({}, 500))
    await expect(listModels(account)).rejects.toThrow('HTTP 500')
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    await expect(listModels(account)).rejects.toThrow('连不上接口地址')
  })
})
