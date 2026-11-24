import { expect, it } from 'vitest'
import { providerOf } from './modelProvider'

it('tells the maker from the model name, with or without a provider prefix', () => {
  expect(providerOf('deepseek-flash')).toBe('deepseek')
  expect(providerOf('openai/gpt-5')).toBe('openai')
  expect(providerOf('o3-mini')).toBe('openai')
  expect(providerOf('claude-sonnet-4-5')).toBe('anthropic')
  expect(providerOf('Qwen-Plus')).toBe('qwen')
})

it('names a distilled model after the one that made it, not the one it learned from', () => {
  expect(providerOf('deepseek-r1-distill-qwen-32b')).toBe('deepseek')
})

it('does not take a version number inside another name for an OpenAI model', () => {
  expect(providerOf('qwen3-coder')).toBe('qwen')
})

it('knows no maker for a name that gives nothing away', () => {
  expect(providerOf('my-relay-model')).toBeNull()
})
