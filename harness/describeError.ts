import { APICallError, RetryError } from 'ai'
import { strings } from '../shared/strings'

export class NoKeyError extends Error {
  constructor() {
    super(strings().harness.modelErrors.noKey)
  }
}

/** A failed turn or task as the user should read it; `no-key` sends them to the settings. */
export function describeError(error: unknown): { message: string; code?: 'no-key' } {
  if (error instanceof NoKeyError) return { message: error.message, code: 'no-key' }
  const call = RetryError.isInstance(error) ? error.lastError : error
  if (isUnreachable(call))
    return {
      message: strings().harness.modelErrors.unreachable(new URL(call.url).host),
    }
  if (APICallError.isInstance(call) && call.statusCode === 401)
    return { message: strings().harness.modelErrors.invalidKey, code: 'no-key' }
  if (APICallError.isInstance(call) && call.statusCode === 402)
    return { message: strings().harness.modelErrors.noBalance }
  console.error('model call failed:', error)
  return {
    message: error instanceof Error ? error.message : strings().harness.modelErrors.unknown,
  }
}

/** A call that got no answer at all: the server is down, refused the connection or the network is out. */
export function isUnreachable(error: unknown): error is APICallError {
  return APICallError.isInstance(error) && error.statusCode === undefined
}
