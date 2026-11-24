export type Provider =
  | 'deepseek'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'qwen'
  | 'kimi'
  | 'glm'
  | 'doubao'
  | 'grok'
  | 'minimax'

const PATTERNS: [Provider, RegExp][] = [
  ['deepseek', /deepseek/],
  ['anthropic', /claude/],
  ['openai', /(^|\/)(gpt|chatgpt|o\d)(\b|-)|openai/],
  ['gemini', /gemini/],
  ['qwen', /qwen|qwq/],
  ['kimi', /kimi|moonshot/],
  ['glm', /glm|zhipu/],
  ['doubao', /doubao/],
  ['grok', /grok/],
  ['minimax', /minimax|abab/],
]

/** Who made a model, told from its name; the first match wins. Null when the name gives nothing away. */
export function providerOf(model: string): Provider | null {
  const name = model.toLowerCase()
  return PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? null
}
