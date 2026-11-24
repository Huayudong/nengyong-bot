import { z } from 'zod'
import { strings } from './strings'

const SERVICE_IDS = [
  'deepseek',
  'openai',
  'anthropic',
  'gemini',
  'qwen',
  'kimi',
  'glm',
  'doubao',
  'grok',
  'minimax',
  'siliconflow',
  'openrouter',
  'ollama',
  'lmstudio',
  'bionic',
  'omlx',
  'custom',
] as const
export const ServiceId = z.enum(SERVICE_IDS)
export type ServiceId = z.infer<typeof ServiceId>

/** A model service an account can connect to. Each speaks the OpenAI-compatible API and lists its models at /models. */
export interface Service {
  id: ServiceId
  name: string
  kind: 'key' | 'local' | 'custom' // local: runs on this machine, its key optional; custom: any compatible endpoint the user names
  baseURL: string
  keyPage: string | null // where its API keys are made
  defaultModel: string | null // what chat starts on when the account is connected; otherwise the first model it lists
}

export const DEEPSEEK_MODEL = 'deepseek-flash'

export const SERVICES: Record<ServiceId, Service> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'key',
    baseURL: 'https://api.deepseek.com',
    keyPage: 'https://platform.deepseek.com/api_keys',
    defaultModel: DEEPSEEK_MODEL,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    kind: 'key',
    baseURL: 'https://api.openai.com/v1',
    keyPage: 'https://platform.openai.com/api-keys',
    defaultModel: null,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'key',
    baseURL: 'https://api.anthropic.com/v1',
    keyPage: 'https://console.anthropic.com/settings/keys',
    defaultModel: null,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    kind: 'key',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyPage: 'https://aistudio.google.com/apikey',
    defaultModel: null,
  },
  qwen: {
    id: 'qwen',
    get name() {
      return strings().common.services.qwen
    },
    kind: 'key',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    keyPage: 'https://bailian.console.aliyun.com',
    defaultModel: null,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    kind: 'key',
    baseURL: 'https://api.moonshot.cn/v1',
    keyPage: 'https://platform.moonshot.cn/console/api-keys',
    defaultModel: null,
  },
  glm: {
    id: 'glm',
    get name() {
      return strings().common.services.glm
    },
    kind: 'key',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    keyPage: 'https://open.bigmodel.cn/usercenter/apikeys',
    defaultModel: null,
  },
  doubao: {
    id: 'doubao',
    get name() {
      return strings().common.services.doubao
    },
    kind: 'key',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    keyPage: 'https://console.volcengine.com/ark',
    defaultModel: null,
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    kind: 'key',
    baseURL: 'https://api.x.ai/v1',
    keyPage: 'https://console.x.ai',
    defaultModel: null,
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    kind: 'key',
    baseURL: 'https://api.minimaxi.com/v1',
    keyPage: 'https://platform.minimaxi.com',
    defaultModel: null,
  },
  siliconflow: {
    id: 'siliconflow',
    get name() {
      return strings().common.services.siliconflow
    },
    kind: 'key',
    baseURL: 'https://api.siliconflow.cn/v1',
    keyPage: 'https://cloud.siliconflow.cn/account/ak',
    defaultModel: null,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'key',
    baseURL: 'https://openrouter.ai/api/v1',
    keyPage: 'https://openrouter.ai/settings/keys',
    defaultModel: null,
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    kind: 'local',
    baseURL: 'http://localhost:11434/v1',
    keyPage: null,
    defaultModel: null,
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    kind: 'local',
    baseURL: 'http://localhost:1234/v1',
    keyPage: null,
    defaultModel: null,
  },
  bionic: {
    id: 'bionic',
    name: 'Bionic',
    kind: 'local',
    baseURL: 'http://localhost:1235/v1',
    keyPage: null,
    defaultModel: null,
  },
  omlx: {
    id: 'omlx',
    name: 'oMLX',
    kind: 'local',
    baseURL: 'http://localhost:8000/v1',
    keyPage: null,
    defaultModel: null,
  },
  custom: {
    id: 'custom',
    get name() {
      return strings().common.services.custom
    },
    kind: 'custom',
    baseURL: '',
    keyPage: null,
    defaultModel: null,
  },
}

export const AccountId = z.string().min(1).max(100)
export const ACCOUNT_NAME_MAX = 40

/** Whether web_search can go through the account: DeepSeek's search API only takes keys of DeepSeek itself. */
export function canSearch(account: { service: ServiceId; baseURL: string }): boolean {
  return (
    account.service === 'deepseek' &&
    URL.canParse(account.baseURL) &&
    new URL(account.baseURL).hostname === 'api.deepseek.com'
  )
}

/** A model of one of the user's accounts: the main model, or the one a bot, routine, flow or task is set to. */
export const ModelChoice = z.object({ accountId: AccountId, model: z.string().trim().min(1).max(200) })
export type ModelChoice = z.infer<typeof ModelChoice>

/** What an account is being connected for, so saving it also puts it to that use. */
export const AccountUse = z.enum(['chat', 'search'])
export type AccountUse = z.infer<typeof AccountUse>

/** An account to connect or change, as the renderer sends it. */
export const AccountInput = z.object({
  id: AccountId.nullable(), // null: a new account
  service: ServiceId,
  // only a custom account takes the user's name
  name: z
    .string()
    .trim()
    .max(ACCOUNT_NAME_MAX, {
      error: () => strings().common.account.nameTooLong(ACCOUNT_NAME_MAX),
    }),
  baseURL: z
    .string()
    .trim()
    .regex(/^https?:\/\/[^\s]+$/i, {
      error: () => strings().common.account.addressScheme,
    })
    .transform((url) => url.replace(/\/+$/, '')),
  // '' = keep the saved one when the address stays, or none
  apiKey: z
    .string()
    .trim()
    .max(400, { error: () => strings().common.account.keyTooLong })
    .regex(/^\S*$/, { error: () => strings().common.account.keyHasSpaces }),
})
export type AccountInput = z.input<typeof AccountInput>

/** What the renderer may see of an account: never the key itself. */
export interface AccountView {
  id: string
  service: ServiceId
  name: string
  baseURL: string
  keyHint: string // '' when it has no key
}

/** The 模型服务 page: the accounts, and what each use is set to. */
export interface ModelServicesView {
  accounts: AccountView[]
  chat: ModelChoice | null // the main model; null: the bots cannot reply until one is chosen
  searchAccountId: string | null // the DeepSeek account web_search goes through; null: web search is off
}
