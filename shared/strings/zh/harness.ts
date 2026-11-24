export const harness = {
  unknownBot: (id: string) => `未知的 Bot：${id}`,
  noRunningTask: (id: string) => `没有进行中的任务 ${id}`,
  chat: {
    attachment: '（附件）',
    traceTitle: '聊天',
    quoteMissing: '要回复的那条消息不在这段聊天里',
    noModel: '未设置',
  },
  modelErrors: {
    noKey: '还没有设置 API Key',
    unreachable: (host: string) => `连不上模型服务 ${host}，请检查网络；本机的模型（Ollama、LM Studio 等）要先打开`,
    invalidKey: 'API Key 无效，请重新设置',
    noBalance: '账户余额不足',
    unknown: '出错了，请重试',
  },
  modelList: {
    invalidKey: 'API Key 无效',
    noAccess: 'API Key 没有权限',
    noModelsPath: '接口地址不对（找不到 /models）',
    tooManyRequests: '请求太频繁，稍等再试',
    unreachable: '连不上接口地址，请检查网络和地址；本机的服务要先打开',
    httpError: (status: number) => `接口返回错误（HTTP ${status}）`,
    webPage: '接口地址返回的是网页，不是接口。OpenAI 兼容接口的地址一般以 /v1 结尾',
  },
  brokenFinish: {
    interrupted:
      '模型的回复没有正常结束：接口返回的不是模型的回复，或连接中断了。请检查接口地址，OpenAI 兼容接口一般以 /v1 结尾',
    error: '模型出错了，没有给出完整回复，请重试',
    contentFilter: '回复被模型的内容审核拦下了',
  },
  tasks: {
    noConclusion: '任务结束了，但没有写出结论',
    timedOut: '超时：任务运行太久仍未完成，已中止',
    outOfSteps: (lastStatus: string | undefined) => `步数用完仍未完成${lastStatus ? `，停在「${lastStatus}」` : ''}`,
    resultClipped: (length: number, ref: string) =>
      `（结论共 ${length} 字，全文用 read_history 打开 ${ref}，按提示续读）`,
  },
  routineNotFound: (id: string) => `没有 id 为 ${id} 的例行任务`,
  library: {
    outside: (path: string) => `路径超出本地资料库：${path}`,
    missing: (path: string) => `资料库里没有这个文件：${path}`,
  },
  mcp: {
    commandOrUrl: '每个服务要么写 command（本机程序），要么写 url（远程地址）',
    tooLong: 'MCP 配置太长',
    topLevel: '最外层',
    invalid: (where: string, reason: string) => `MCP 配置有误（${where}）：${reason}`,
    notJson: (reason: string) => `MCP 配置不是合法的 JSON：${reason}`,
    commandNotFound: '找不到这个命令：确认已经装好（npx 要先装 Node.js），或者把 command 写成完整路径',
  },
  store: {
    mainBotDuty:
      '用户的主要 Bot 与总管。接到任务先看是否有合适的专职 Bot，把职责匹配的工作交办给它；没有合适负责人时由我开任务处理。',
    chatOnly: '只能删除聊天里的消息',
    notDataFile: (name: string) => `不是 Nengyong Bot 的数据文件：${name}`,
    newerVersion: '数据来自更新版本的 Nengyong Bot，请先升级应用',
  },
  miniApps: {
    notFound: (id: string) => `没有 id 为 ${id} 的小程序`,
    dataTooLarge: (max: number) => `数据太大了：最多 ${max} 字`,
    restored: (version: number) => `恢复成 v${version} 的样子`,
    noVersion: (name: string, version: number) => `「${name}」没有 v${version}`,
    pageMissing: (name: string, version: number) => `「${name}」v${version} 的页面文件不见了`,
  },
  onboarding: {
    alreadyDone: '初始引导已经走完了',
    secretaryDuty: '管日程和琐事：整理待办、排优先级、安排每天的计划，按用户的要求设好提醒',
    address: (address: string) => `用户希望被称呼为「${address}」`,
    hello: (address: string, bossName: string) => `${address}你好，我是${bossName}，你的总管。`,
    hired: (bots: string) => `我先帮你招了 ${bots}，在左边。有事直接跟我说，我来分派；想单独聊，点开就行。`,
    noModel: '我还没接上大模型，暂时回不了话：在设置里填好 API Key 就行。',
    tryThese: '先试试这几件事？',
    list: (names: string[]) => `${names.slice(0, -1).join('、')} 和 ${names.at(-1)}`,
  },
}
