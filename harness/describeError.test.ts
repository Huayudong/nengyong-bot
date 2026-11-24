import { APICallError, RetryError } from 'ai'
import { expect, it } from 'vitest'
import { describeError } from './describeError'

const unreachable = new APICallError({
  message: 'Cannot connect to API: ',
  url: 'http://127.0.0.1:1234/v1/chat/completions',
  requestBodyValues: {},
  isRetryable: true,
})

it('says which model service it cannot reach, after the retries gave up, instead of the bare network error', () => {
  const error = new RetryError({
    message: 'Failed after 3 attempts.',
    reason: 'maxRetriesExceeded',
    errors: [unreachable],
  })
  expect(describeError(error).message).toBe(
    '连不上模型服务 127.0.0.1:1234，请检查网络；本机的模型（Ollama、LM Studio 等）要先打开',
  )
})

it('says which model service it cannot reach when the call was not retried', () => {
  expect(describeError(unreachable).message).toContain('连不上模型服务 127.0.0.1:1234')
})

it('keeps the message of an error the service answered with', () => {
  const answered = new APICallError({
    message: 'Internal Server Error',
    url: 'https://api.deepseek.com/chat/completions',
    requestBodyValues: {},
    statusCode: 500,
  })
  expect(describeError(answered).message).toBe('Internal Server Error')
})
