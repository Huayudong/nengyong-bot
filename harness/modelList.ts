import { z } from 'zod'
import { strings } from '../shared/strings'
import type { ServiceId } from '../shared/modelServices'

const TIMEOUT_MS = 10_000

const ModelList = z.object({ data: z.array(z.object({ id: z.string() })) })

const statusErrors = (): Record<number, string> => ({
  400: strings().harness.modelList.invalidKey,
  401: strings().harness.modelList.invalidKey,
  403: strings().harness.modelList.noAccess,
  404: strings().harness.modelList.noModelsPath,
  429: strings().harness.modelList.tooManyRequests,
})

const NOT_FOR_CHAT =
  /embed|whisper|tts|dall-e|audio|transcri|moderation|rerank|speech|realtime|image|video|sora|veo|seedream|seedance|cogview|cogvideo|kolors|flux|wan2|wanx/i

/**
 * The chat models an OpenAI-compatible endpoint lists at GET {baseURL}/models, by name. Getting the list proves the
 * address and the key work, so connecting an account calls this first; it throws a readable reason when they do not.
 */
export async function listModels({ service, apiKey, baseURL }: Endpoint): Promise<string[]> {
  const body = await getJson(`${baseURL}/models`, apiKey)
  // OpenRouter lists its models to anyone, so only /key shows whether the key works
  if (service === 'openrouter') await getJson(`${baseURL}/key`, apiKey)
  const list = ModelList.safeParse(body)
  if (!list.success) return []
  const ids = list.data.data.map((listed) => listed.id).filter((id) => !NOT_FOR_CHAT.test(id))
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b))
}

interface Endpoint {
  service: ServiceId
  apiKey: string
  baseURL: string
}

async function getJson(url: string, apiKey: string): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new Error(strings().harness.modelList.unreachable)
  }
  if (!res.ok) throw new Error(statusErrors()[res.status] ?? strings().harness.modelList.httpError(res.status))
  const body: unknown = await res.json().catch(() => undefined)
  // gateways serve their web page with 200 on unknown paths, so a missing /v1 looks like success
  if (body === undefined) throw new Error(strings().harness.modelList.webPage)
  return body
}
