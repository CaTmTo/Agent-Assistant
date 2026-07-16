import { useCallback, useRef, useState } from 'react'

const WELCOME =
  '你好，我是 Astra AI。我可以协助规划、执行与迭代你的目标，从架构拆解到接口设计。请先描述你的任务。'

const BASE_SYSTEM_PROMPT = [
  '你叫 Astra AI，一个自然、友好、专业的智能助手。用户叫小明，他喜欢西瓜。',
  '身份边界必须清晰：Assistant 的名字永远是 Astra AI；User 是正在对话的人。如果用户说“我叫小明”，小明是用户姓名，不是你的姓名。',
  '优先级规则：用户的当前指令拥有最高优先级，必须优先执行最后一条 User 消息。',
  '用户姓名、喜好等个人信息属于背景记忆，只在用户明确询问或确实有助于当前任务时参考。',
  '除非用户明确要求，否则不要在作文、代码、方案、报告等长文本中强行插入用户姓名、爱好或零散偏好，也不要主动反问用户的个人爱好。',
  '当用户下达创作类或任务类指令时，进入 Task Mode：直接进入创作或执行状态，禁止在任务开头复读自我介绍，禁止穿插无意义确认语。',
  '如果历史里已经有主题、时间、地点、活动安排等信息，就直接生成，不要反复追问。',
  '如果用户只是打招呼，请将其视为普通问候，保持原有上下文，不要重置对话，不要重新触发首轮欢迎语。',
  '不要复读历史中的错误回复、废话或元分析；不要输出“我需要根据用户信息……”这类内部思考。',
].join('\n')

const CHAT_HISTORY_KEY = 'astra-chat-history-v5'
const CHAT_SESSIONS_KEY = 'astra-chat-sessions-v1'
const ACTIVE_SESSION_KEY = 'astra-active-session-v1'
const MAX_CONTEXT_MESSAGES = 18

export type ChatRole = 'user' | 'bot'

export type MessageFeedback = 'liked' | 'disliked'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  pending?: boolean
  feedback?: MessageFeedback
  favorited?: boolean
}

export type ChatSession = {
  id: string
  title: string
  updatedAt: number
  favorited?: boolean
  messages: ChatHistoryItem[]
}

type ChatHistoryItem = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  feedback?: MessageFeedback
  favorited?: boolean
}

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type StreamStartResponse = {
  streamId: string
  conversationId?: string
}

type UserMemory = {
  name?: string
  favoriteFruit?: string
}

const DEFAULT_USER_MEMORY: Required<UserMemory> = {
  name: '小明',
  favoriteFruit: '西瓜',
}

function readStoredHistory(): ChatHistoryItem[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatHistoryItem[]
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string' &&
            item.content.trim() &&
            !isLowValueAssistantReply(item),
        )
      : []
  } catch {
    return []
  }
}

function saveHistory(history: ChatHistoryItem[]) {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(cleanHistory(history)))
}

function getSessionTitle(history: ChatHistoryItem[]) {
  const firstUser = history.find((item) => item.role === 'user')?.content.trim()
  if (!firstUser) return '新对话'
  return firstUser.length > 22 ? `${firstUser.slice(0, 22)}...` : firstUser
}

function createEmptySession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    updatedAt: Date.now(),
    favorited: false,
    messages: [],
  }
}

function normalizeSession(session: ChatSession): ChatSession {
  const messages = cleanHistory(Array.isArray(session.messages) ? session.messages : []).map(normalizeHistoryItem)
  return {
    id: session.id || crypto.randomUUID(),
    title: session.title || getSessionTitle(messages),
    updatedAt: Number(session.updatedAt) || Date.now(),
    favorited: Boolean(session.favorited),
    messages,
  }
}

function readStoredSessions(): { sessions: ChatSession[]; activeId: string } {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY)
    const parsed = raw ? (JSON.parse(raw) as ChatSession[]) : []
    let sessions = Array.isArray(parsed) ? parsed.map(normalizeSession) : []

    if (!sessions.length) {
      const legacyMessages = readStoredHistory()
      sessions = [
        {
          id: crypto.randomUUID(),
          title: getSessionTitle(legacyMessages),
          updatedAt: Date.now(),
          messages: legacyMessages,
        },
      ]
    }

    const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY)
    const activeId = sessions.some((session) => session.id === storedActiveId)
      ? storedActiveId!
      : sessions[0].id

    return { sessions: sortSessions(sessions), activeId }
  } catch {
    const session = createEmptySession()
    return { sessions: [session], activeId: session.id }
  }
}

function sortSessions(sessions: ChatSession[]) {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)
}

function saveSessions(sessions: ChatSession[], activeId: string) {
  const sorted = sortSessions(sessions)
  localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sorted))
  localStorage.setItem(ACTIVE_SESSION_KEY, activeId)
  const active = sorted.find((session) => session.id === activeId)
  saveHistory(active?.messages ?? [])
}

function toUiMessages(history: ChatHistoryItem[]): ChatMessage[] {
  return [
    { id: 'welcome', role: 'bot', text: WELCOME },
    ...history.map((item) => ({
      id: item.id || crypto.randomUUID(),
      role: item.role === 'user' ? ('user' as const) : ('bot' as const),
      text: item.content,
      feedback: item.feedback,
      favorited: item.favorited,
    })),
  ]
}

function createHistoryItem(role: 'user' | 'assistant', content: string): ChatHistoryItem {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  }
}

function normalizeHistoryItem(item: ChatHistoryItem): ChatHistoryItem {
  return {
    id: item.id || crypto.randomUUID(),
    role: item.role,
    content: item.content,
    feedback: item.feedback,
    favorited: Boolean(item.favorited),
  }
}

function normalize(text: string) {
  return text.trim().replace(/[，。！？!?、\s]/g, '')
}

function isGreeting(text: string) {
  const normalized = normalize(text).toLowerCase()
  return normalized.length < 6 && ['你好', '您好', '嗨', 'hi', 'hello', '哈喽'].some((g) => normalized.includes(g))
}

function isTaskMode(text: string) {
  return /作文|文章|写作|写一|写篇|生成|回答|方案|设计|代码|计划|总结|报告|文案|接口|实现|优化|修改|开发|\d+\s*字|五百字|一千字|1000字|500字/.test(
    text,
  )
}

function cleanFactValue(value: string) {
  const cleaned = value.trim().replace(/[，。！？!?、\s].*$/, '')
  if (!cleaned || /什么|啥|哪|吗|么|知道|告诉我|请问|你叫|名字/.test(cleaned)) {
    return ''
  }
  return cleaned
}

function findFirstFact(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const hit = text.match(pattern)
    if (hit?.[1]) {
      const value = cleanFactValue(hit[1])
      if (value) return value
    }
  }
  return ''
}

function getLatestUserFact(history: ChatHistoryItem[], patterns: RegExp[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const item = history[i]
    if (item.role !== 'user') continue
    const value = findFirstFact(item.content, patterns)
    if (value) return value
  }
  return ''
}

function extractMemory(history: ChatHistoryItem[]): UserMemory {
  return {
    name:
      getLatestUserFact(history, [/我叫([^，。！？!?\s]+)/, /我的名字是([^，。！？!?\s]+)/]) ||
      DEFAULT_USER_MEMORY.name,
    favoriteFruit:
      getLatestUserFact(history, [
        /我最喜欢的水果是([^，。！？!?\s]+)/,
        /我喜欢的水果是([^，。！？!?\s]+)/,
        /最喜欢的水果是([^，。！？!?\s]+)/,
        /喜欢吃的水果是([^，。！？!?\s]+)/,
      ]) || DEFAULT_USER_MEMORY.favoriteFruit,
  }
}

function isAskingAssistantIdentity(text: string) {
  const q = normalize(text)
  return /你.*(叫|名字).*什么|你是谁|介绍.*你自己/.test(q)
}

function isAskingUserName(text: string) {
  const q = normalize(text)
  return /(我|俺|本人).*(叫|名字).*(什么|啥|谁)|你知道我.*叫什么/.test(q)
}

function isAskingFavoriteFruit(text: string) {
  const q = normalize(text)
  return /(我|俺|本人).*(最喜欢|喜欢).*水果.*(什么|啥|哪|吗)|你知道我.*喜欢.*水果/.test(q)
}

function getMemoryAnswer(question: string, history: ChatHistoryItem[]) {
  const memory = extractMemory(history)
  const saysName = findFirstFact(question, [/我叫([^，。！？!?\s]+)/, /我的名字是([^，。！？!?\s]+)/])

  if (saysName && isAskingAssistantIdentity(question)) {
    return `我记住了，你叫${saysName}。我是 Astra AI，你的智能体助手。`
  }

  if (isAskingAssistantIdentity(question)) {
    return '我是 Astra AI，你的智能体助手。'
  }

  if (isAskingUserName(question) && memory.name) {
    return `你叫${memory.name}。`
  }

  if (isAskingFavoriteFruit(question) && memory.favoriteFruit) {
    return `你最喜欢的水果是${memory.favoriteFruit}。`
  }

  return ''
}

function getFactAcknowledgement(text: string) {
  const fruit = findFirstFact(text, [
    /我最喜欢的水果是([^，。！？!?\s]+)/,
    /我喜欢的水果是([^，。！？!?\s]+)/,
    /最喜欢的水果是([^，。！？!?\s]+)/,
    /喜欢吃的水果是([^，。！？!?\s]+)/,
  ])
  if (fruit) return `我记住了，你最喜欢的水果是${fruit}。`

  const name = findFirstFact(text, [/我叫([^，。！？!?\s]+)/, /我的名字是([^，。！？!?\s]+)/])
  if (name) return `我记住了，你叫${name}。`

  return ''
}

function isLowValueAssistantReply(item: ChatHistoryItem) {
  if (item.role !== 'assistant') return false
  const text = item.content.trim()
  return [
    /^请提供更多信息[。！!]*$/,
    /^你好[！!。]*有什么我可以帮助你的吗[？?。]*$/,
    /请告诉我.*想要写什么类型/,
    /自然.*人文.*科技类/,
    /我需要根据用户/,
    /用户提到.*我需要/,
    /确保对话保持友好/,
  ].some((pattern) => pattern.test(text))
}

function cleanHistory(history: ChatHistoryItem[]) {
  return history.filter((item) => item.content.trim() && !isLowValueAssistantReply(item)).map(normalizeHistoryItem)
}

function selectUsefulHistory(history: ChatHistoryItem[], taskMode: boolean) {
  const cleaned = cleanHistory(history)
  if (!taskMode) return cleaned.slice(-MAX_CONTEXT_MESSAGES)

  const taskSignals = /作文|文章|写作|写一|写篇|生成|回答|主题|时间|地点|活动|安排|周|山|春游|方案|设计|代码|\d+\s*字|五百字|一千字|1000字|500字/
  const recent = cleaned.slice(-MAX_CONTEXT_MESSAGES)
  const taskFacts = cleaned.filter((item) => item.role === 'user' && taskSignals.test(item.content)).slice(-8)
  const merged = [...taskFacts, ...recent]
  const seen = new Set<string>()
  return merged.filter((item) => {
    const key = `${item.role}:${item.content}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildMemorySystemMessage(memory: UserMemory, taskMode: boolean) {
  const facts = [
    memory.name ? `用户姓名：${memory.name}` : '',
    memory.favoriteFruit ? `用户喜欢的水果：${memory.favoriteFruit}` : '',
  ].filter(Boolean)

  if (!facts.length) {
    return taskMode
      ? '当前为 Task Mode：优先完成用户任务，不要因为缺少闲聊信息而中断。'
      : '当前没有可靠的用户个人记忆。'
  }

  return [
    `已知用户背景记忆（仅作隐性参考）：${facts.join('；')}。`,
    taskMode
      ? '当前为 Task Mode：这些背景记忆低优先级，除非用户明确要求，不要写进任务正文。'
      : '如果用户明确询问这些信息，请直接回答；否则自然参考即可。',
  ].join('\n')
}

function buildRequestMessages(history: ChatHistoryItem[], currentText: string): DeepSeekMessage[] {
  const taskMode = isTaskMode(currentText)
  const memory = extractMemory(history)
  const cleanedHistory = cleanHistory(history)
  const latestUserMessage: ChatHistoryItem = { role: 'user', content: currentText }
  const lastMessage = cleanedHistory.at(-1)
  const priorHistory =
    lastMessage?.role === 'user' && lastMessage.content === currentText ? cleanedHistory.slice(0, -1) : cleanedHistory
  const usefulHistory = selectUsefulHistory(priorHistory, taskMode)
  const modeInstruction = isGreeting(currentText)
    ? '当前用户正在进行简短问候：只回复问候，不要清空或重置上下文。'
    : taskMode
      ? '当前用户正在下达任务或创作指令：最后一条 User 消息是最高优先级，请直接产出可用结果。'
      : '请根据上下文自然回答最后一条 User 消息。'

  return [
    {
      role: 'system',
      content: `${BASE_SYSTEM_PROMPT}\n${buildMemorySystemMessage(memory, taskMode)}\n${modeInstruction}`,
    },
    ...usefulHistory.map((item) => ({ role: item.role, content: item.content })),
    latestUserMessage,
  ]
}

export function useChat(onToast: (msg: string) => void) {
  const initialStore = useRef(readStoredSessions())
  const initialSession = initialStore.current.sessions.find((session) => session.id === initialStore.current.activeId)
  const initialHistory = useRef<ChatHistoryItem[]>(initialSession?.messages ?? [])
  const [sessions, setSessions] = useState<ChatSession[]>(initialStore.current.sessions)
  const [activeSessionId, setActiveSessionId] = useState(initialStore.current.activeId)
  const [messages, setMessages] = useState<ChatMessage[]>(() => toUiMessages(initialHistory.current))
  const [isGenerating, setIsGenerating] = useState(false)
  const conversationId = useRef<string | null>(null)
  const chatHistory = useRef<ChatHistoryItem[]>(initialHistory.current)
  const eventSourceRef = useRef<EventSource | null>(null)
  const activeStream = useRef<{ loadingId: string; baseHistory: ChatHistoryItem[]; reply: string } | null>(null)
  const onToastRef = useRef(onToast)
  onToastRef.current = onToast

  const persistActiveSession = useCallback((history: ChatHistoryItem[], activeId = activeSessionId) => {
    const cleaned = cleanHistory(history)
    let nextSessions: ChatSession[] = []

    setSessions((current) => {
      const existing = current.some((session) => session.id === activeId)
      const base = existing ? current : [{ ...createEmptySession(), id: activeId }, ...current]
      nextSessions = sortSessions(
        base.map((session) =>
          session.id === activeId
            ? {
                ...session,
                title: getSessionTitle(cleaned),
                updatedAt: Date.now(),
                messages: cleaned,
              }
            : session,
        ),
      )
      saveSessions(nextSessions, activeId)
      return nextSessions
    })

    chatHistory.current = cleaned
    return cleaned
  }, [activeSessionId])

  const finishReply = useCallback((loadingId: string, baseHistory: ChatHistoryItem[], reply: string) => {
    const assistantReply: ChatHistoryItem = { id: loadingId, role: 'assistant', content: reply.trim() || '已停止生成。' }
    const historyWithReply = isLowValueAssistantReply(assistantReply) ? baseHistory : [...baseHistory, assistantReply]

    persistActiveSession(historyWithReply)
    setMessages((m) =>
      m.map((msg) =>
        msg.id === loadingId ? { id: loadingId, role: 'bot', text: assistantReply.content, pending: false } : msg,
      ),
    )
    activeStream.current = null
    eventSourceRef.current = null
    setIsGenerating(false)
  }, [persistActiveSession])

  const stop = useCallback(() => {
    const active = activeStream.current
    eventSourceRef.current?.close()
    if (!active) {
      setIsGenerating(false)
      return
    }

    finishReply(active.loadingId, active.baseHistory, active.reply.trim() || '已停止生成。')
  }, [finishReply])

  const runAssistant = useCallback(async (text: string, nextHistory: ChatHistoryItem[], loadingId: string) => {
    setIsGenerating(true)

    const previousHistory = nextHistory.slice(0, -1)
    const deterministicReply =
      getMemoryAnswer(text, previousHistory) ||
      (isGreeting(text) ? '你好！我是 Astra AI，今天有什么我可以帮你的吗？' : '') ||
      getFactAcknowledgement(text)

    if (deterministicReply) {
      finishReply(loadingId, nextHistory, deterministicReply)
      return
    }

    try {
      const startRes = await fetch('/api/chat/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId.current,
          userId: localStorage.getItem('nickname') || 'guest',
          message: text,
          messages: buildRequestMessages(nextHistory, text),
        }),
      })

      if (!startRes.ok) {
        throw new Error(`stream start failed: ${startRes.status}`)
      }

      const streamStart = (await startRes.json()) as StreamStartResponse
      conversationId.current = streamStart.conversationId ?? conversationId.current

      const source = new EventSource(`/api/chat/stream/${encodeURIComponent(streamStart.streamId)}`)
      eventSourceRef.current = source
      activeStream.current = { loadingId, baseHistory: nextHistory, reply: '' }

      source.addEventListener('message', (event) => {
        const active = activeStream.current
        if (!active) return
        active.reply += event.data
        setMessages((m) =>
          m.map((msg) =>
            msg.id === loadingId ? { id: loadingId, role: 'bot', text: active.reply, pending: false } : msg,
          ),
        )
      })

      source.addEventListener('done', () => {
        const active = activeStream.current
        source.close()
        if (!active) return
        finishReply(active.loadingId, active.baseHistory, active.reply || '后端没有返回回复内容。')
      })

      source.addEventListener('server-error', (event) => {
        const active = activeStream.current
        source.close()
        activeStream.current = null
        eventSourceRef.current = null
        setIsGenerating(false)
        const message = (event as MessageEvent).data || '流式接口服务端错误'
        onToastRef.current(message)
        setMessages((m) =>
          m.map((msg) => (msg.id === loadingId ? { id: loadingId, role: 'bot', text: message, pending: false } : msg)),
        )
        if (active) {
          persistActiveSession(active.baseHistory)
        }
      })

      source.onerror = () => {
        const active = activeStream.current
        source.close()
        if (active?.reply) {
          finishReply(active.loadingId, active.baseHistory, active.reply)
          return
        }
        activeStream.current = null
        eventSourceRef.current = null
        setIsGenerating(false)
        onToastRef.current('流式接口连接失败')
        setMessages((m) =>
          m.map((msg) =>
            msg.id === loadingId
              ? {
                  id: loadingId,
                  role: 'bot',
                  text: '后端大模型流式接口暂时连接失败，请确认 Spring Boot 和本地 Ollama 模型已启动。',
                  pending: false,
                }
              : msg,
          ),
        )
      }
    } catch {
      activeStream.current = null
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      setIsGenerating(false)
      onToastRef.current('流式接口启动失败')
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingId
            ? {
                id: loadingId,
                role: 'bot',
                text: '后端大模型流式接口暂时连接失败，请确认 Spring Boot 和本地 Ollama 模型已启动。',
                pending: false,
              }
            : msg,
        ),
      )
    }
  }, [finishReply, persistActiveSession])

  const send = useCallback(
    async (raw: string) => {
      if (isGenerating) return

      const text = raw.trim()
      if (!text) return

      const userItem = createHistoryItem('user', text)
      const nextHistory = persistActiveSession([...chatHistory.current, userItem])
      const loadingId = crypto.randomUUID()

      setMessages((m) => [
        ...m,
        { id: userItem.id!, role: 'user', text },
        { id: loadingId, role: 'bot', text: '正在思考...', pending: true },
      ])

      await runAssistant(text, nextHistory, loadingId)
    },
    [isGenerating, persistActiveSession, runAssistant],
  )

  const clear = useCallback((opts?: { silent?: boolean }) => {
    eventSourceRef.current?.close()
    conversationId.current = null
    activeStream.current = null
    eventSourceRef.current = null
    setIsGenerating(false)
    persistActiveSession([])
    setMessages([{ id: 'welcome', role: 'bot', text: WELCOME }])
    if (!opts?.silent) {
      onToastRef.current('对话已清空')
    }
  }, [persistActiveSession])

  const startNewChat = useCallback(() => {
    eventSourceRef.current?.close()
    const nextSession = createEmptySession()
    const nextSessions = sortSessions([nextSession, ...sessions])
    conversationId.current = null
    chatHistory.current = []
    activeStream.current = null
    eventSourceRef.current = null
    setIsGenerating(false)
    setActiveSessionId(nextSession.id)
    setSessions(nextSessions)
    saveSessions(nextSessions, nextSession.id)
    setMessages([{ id: 'welcome', role: 'bot', text: WELCOME }])
  }, [sessions])

  const switchSession = useCallback((sessionId: string) => {
    const target = sessions.find((session) => session.id === sessionId)
    if (!target) return

    eventSourceRef.current?.close()
    conversationId.current = null
    chatHistory.current = target.messages
    activeStream.current = null
    eventSourceRef.current = null
    setIsGenerating(false)
    setActiveSessionId(target.id)
    saveSessions(sessions, target.id)
    setMessages(toUiMessages(target.messages))
  }, [sessions])

  const updateMessage = useCallback((messageId: string, updater: (item: ChatHistoryItem) => ChatHistoryItem) => {
    const nextHistory = chatHistory.current.map((item) => (item.id === messageId ? updater(item) : item))
    persistActiveSession(nextHistory)
    setMessages(toUiMessages(nextHistory))
  }, [persistActiveSession])

  const setMessageFeedback = useCallback((messageId: string, feedback: MessageFeedback) => {
    updateMessage(messageId, (item) => ({
      ...item,
      feedback: item.feedback === feedback ? undefined : feedback,
    }))
  }, [updateMessage])

  const toggleMessageFavorite = useCallback((messageId: string) => {
    updateMessage(messageId, (item) => ({
      ...item,
      favorited: !item.favorited,
    }))
  }, [updateMessage])

  const editAndResend = useCallback(async (messageId: string, nextText: string) => {
    if (isGenerating) return
    const text = nextText.trim()
    if (!text) return

    const index = chatHistory.current.findIndex((item) => item.id === messageId && item.role === 'user')
    if (index < 0) return

    const userItem: ChatHistoryItem = { ...chatHistory.current[index], content: text, feedback: undefined }
    const nextHistory = persistActiveSession([...chatHistory.current.slice(0, index), userItem])
    const loadingId = crypto.randomUUID()
    setMessages([...toUiMessages(nextHistory), { id: loadingId, role: 'bot', text: '正在思考...', pending: true }])
    await runAssistant(text, nextHistory, loadingId)
  }, [isGenerating, persistActiveSession, runAssistant])

  const regenerate = useCallback(async (messageId: string) => {
    if (isGenerating) return

    const index = chatHistory.current.findIndex((item) => item.id === messageId && item.role === 'assistant')
    if (index <= 0) return

    let userIndex = index - 1
    while (userIndex >= 0 && chatHistory.current[userIndex].role !== 'user') {
      userIndex -= 1
    }
    if (userIndex < 0) return

    const userText = chatHistory.current[userIndex].content
    const nextHistory = persistActiveSession(chatHistory.current.slice(0, index))
    const loadingId = crypto.randomUUID()
    setMessages([...toUiMessages(nextHistory), { id: loadingId, role: 'bot', text: '正在重新生成...', pending: true }])
    await runAssistant(userText, nextHistory, loadingId)
  }, [isGenerating, persistActiveSession, runAssistant])

  const renameSession = useCallback((sessionId: string, title: string) => {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const nextSessions = sortSessions(
      sessions.map((session) =>
        session.id === sessionId ? { ...session, title: cleanTitle, updatedAt: Date.now() } : session,
      ),
    )
    setSessions(nextSessions)
    saveSessions(nextSessions, activeSessionId)
  }, [activeSessionId, sessions])

  const deleteSession = useCallback((sessionId: string) => {
    const remaining = sessions.filter((session) => session.id !== sessionId)
    const nextSessions = remaining.length ? remaining : [createEmptySession()]
    const nextActiveId = activeSessionId === sessionId ? nextSessions[0].id : activeSessionId
    const active = nextSessions.find((session) => session.id === nextActiveId) ?? nextSessions[0]

    setSessions(nextSessions)
    setActiveSessionId(active.id)
    chatHistory.current = active.messages
    setMessages(toUiMessages(active.messages))
    saveSessions(nextSessions, active.id)
  }, [activeSessionId, sessions])

  const toggleSessionFavorite = useCallback((sessionId: string) => {
    const nextSessions = sortSessions(
      sessions.map((session) =>
        session.id === sessionId ? { ...session, favorited: !session.favorited, updatedAt: Date.now() } : session,
      ),
    )
    setSessions(nextSessions)
    saveSessions(nextSessions, activeSessionId)
  }, [activeSessionId, sessions])

  const appendBot = useCallback((text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'bot', text }])
  }, [])

  return {
    messages,
    sessions,
    activeSessionId,
    send,
    clear,
    appendBot,
    stop,
    startNewChat,
    switchSession,
    editAndResend,
    regenerate,
    setMessageFeedback,
    toggleMessageFavorite,
    renameSession,
    deleteSession,
    toggleSessionFavorite,
    isGenerating,
  }
}
