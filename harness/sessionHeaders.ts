/** The headers that tie a model call to its conversation: a chat (its bot id) or a task (its task id). */
export function sessionHeaders(conversationId: string) {
  // OpenCode Go refuses calls without it (400 MissingSessionID) and routes and caches by it; other services ignore it
  return { 'x-opencode-session': conversationId }
}
