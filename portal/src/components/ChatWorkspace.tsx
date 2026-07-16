import { motion, type Variants } from 'framer-motion'
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  SendHorizontal,
  Square,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { ChatMessage, MessageFeedback } from '../hooks/useChat'

type Props = {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClear: () => void
  onStop: () => void
  onEditAndResend: (messageId: string, text: string) => void
  onRegenerate: (messageId: string) => void
  onFeedback: (messageId: string, feedback: MessageFeedback) => void
  onToggleFavorite: (messageId: string) => void
  isGenerating: boolean
}

const suggestions = [
  '帮我设计智能体项目的数据库表',
  '帮我写一段项目介绍',
  '帮我规划登录注册功能',
]

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
  },
}

export function ChatWorkspace({
  messages,
  onSend,
  onClear,
  onStop,
  onEditAndResend,
  onRegenerate,
  onFeedback,
  onToggleFavorite,
  isGenerating,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div id="console" className="flex min-h-0 flex-1 flex-col">
      <motion.header
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={fadeUp} className="max-w-4xl pl-1">
          <h1 className="font-sans text-[42px] font-bold tracking-normal text-[#20242a]">Astra AI</h1>
          <p className="mt-4 max-w-4xl font-sans text-[17px] font-semibold leading-[1.8] text-[#8ca1bd]">
            面向任务执行的智能体工作区，支持上下文记忆、流式生成与多会话管理。
          </p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/35 bg-white/20 px-3 py-2 text-sm font-semibold text-[#7f96b4] backdrop-blur transition hover:bg-white/45 hover:text-[#456b9d] sm:self-auto"
          >
            <Trash2 className="size-4" strokeWidth={1.7} />
            清空对话
          </button>
        </motion.div>
      </motion.header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="mb-7 flex flex-wrap gap-3">
        {suggestions.map((q) => (
          <motion.button
            key={q}
            variants={fadeUp}
            type="button"
            onClick={() => onSend(q)}
            className="rounded-full border border-white/35 bg-white/18 px-5 py-3 text-left text-sm font-semibold text-[#8fa6c3] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition hover:bg-white/50 hover:text-[#456b9d]"
          >
            {q}
          </motion.button>
        ))}
      </motion.div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-8 overflow-y-auto pb-8 pr-1 sm:pr-5"
        style={{ height: 'min(55vh, 590px)', maxHeight: 'min(55vh, 590px)' }}
      >
        {messages.map((m, i) =>
          m.pending ? (
            <MessageSkeleton key={m.id} message={m} index={i} />
          ) : (
            <MessageBlock
              key={m.id}
              message={m}
              index={i}
              onEditAndResend={onEditAndResend}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
              onToggleFavorite={onToggleFavorite}
            />
          ),
        )}
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 28, delay: 0.1 }}
        className="mt-auto pt-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (isGenerating) {
            onStop()
            return
          }
          const v = inputRef.current?.value ?? ''
          onSend(v)
          if (inputRef.current) inputRef.current.value = ''
        }}
      >
        <div className="composer-aura rounded-[22px] border border-white/45 bg-white/84 px-5 py-4 shadow-[0_22px_60px_rgba(83,123,168,0.18)] backdrop-blur-xl transition focus-within:bg-white/95">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              ref={inputRef}
              maxLength={4000}
              autoComplete="off"
              rows={1}
              placeholder="描述你的目标，Shift + Enter 换行..."
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              className="max-h-[170px] min-h-[60px] w-full flex-1 resize-none border-0 bg-transparent px-4 py-[15px] font-sans text-base font-semibold leading-[1.75] text-[#3d4b5f] outline-none placeholder:text-[#90a8c4]"
            />
            <button
              type="submit"
              className={`inline-flex h-[60px] shrink-0 items-center justify-center gap-2 rounded-2xl px-7 text-base font-bold text-white shadow-[0_12px_28px_rgba(70,147,211,0.28)] transition ${
                isGenerating ? 'bg-[#ef6461] hover:bg-[#e14d4a]' : 'bg-[#58aee8] hover:bg-[#409de0]'
              }`}
            >
              {isGenerating ? <Square className="size-5" strokeWidth={1.8} /> : <SendHorizontal className="size-5" strokeWidth={1.8} />}
              {isGenerating ? '停止生成' : '发送'}
            </button>
          </div>
          <div className="aura-line" aria-hidden />
        </div>
      </motion.form>
    </div>
  )
}

function MessageSkeleton({ message, index }: { message: ChatMessage; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="max-w-[min(82ch,100%)] pl-1 md:pl-4"
      aria-busy
      aria-label="生成中"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#5d6e85]">ASTRA</p>
      <div className="mt-2 inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/45 px-5 py-4 text-sm font-semibold text-[#647996] shadow-[0_14px_38px_rgba(83,123,168,0.12)] backdrop-blur-xl">
        <span className="flex gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-[#58aee8]" />
          <span className="size-1.5 animate-pulse rounded-full bg-[#8b6df5] [animation-delay:120ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-[#58aee8] [animation-delay:240ms]" />
        </span>
        {message.text || '正在思考...'}
      </div>
    </motion.div>
  )
}

function MessageBlock({
  message,
  index,
  onEditAndResend,
  onRegenerate,
  onFeedback,
  onToggleFavorite,
}: {
  message: ChatMessage
  index: number
  onEditAndResend: (messageId: string, text: string) => void
  onRegenerate: (messageId: string) => void
  onFeedback: (messageId: string, feedback: MessageFeedback) => void
  onToggleFavorite: (messageId: string) => void
}) {
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 280, damping: 26, delay: index * 0.02 }}
      className={`group flex flex-col ${isUser ? 'ml-[6%] items-end text-right md:ml-[14%]' : 'mr-auto max-w-[min(86ch,100%)] items-start pl-1 md:pl-4'}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#5d6e85]">
        {isUser ? 'YOU' : 'ASTRA'}
      </span>
      <div
        className={`mt-2 max-w-full rounded-[22px] border border-white/35 px-7 py-5 shadow-[0_14px_38px_rgba(83,123,168,0.14)] backdrop-blur-xl ${
          isUser ? 'bg-white/70' : 'bg-white/50'
        }`}
      >
        {editing ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[110px] w-[min(680px,70vw)] resize-y rounded-2xl border border-[#c7dcf2] bg-white/70 p-4 text-left font-sans text-base font-semibold leading-[1.8] text-[#111827] outline-none"
          />
        ) : isUser ? (
          <p className="whitespace-pre-wrap font-sans text-base font-semibold leading-[1.95] text-[#111827]">
            {message.text}
          </p>
        ) : (
          <MarkdownText text={message.text} />
        )}
      </div>

      <div className={`mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100 ${isUser ? 'justify-end' : ''}`}>
        {editing ? (
          <>
            <MessageAction
              label="保存并重发"
              icon={<Check className="size-4" />}
              onClick={() => {
                setEditing(false)
                onEditAndResend(message.id, draft)
              }}
            />
            <MessageAction label="取消" icon={<X className="size-4" />} onClick={() => setEditing(false)} />
          </>
        ) : (
          <>
            <MessageAction label="复制" icon={<Copy className="size-4" />} onClick={() => void navigator.clipboard?.writeText(message.text)} />
            {isUser ? (
              <MessageAction label="编辑并重发" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)} />
            ) : (
              <MessageAction label="重新生成" icon={<RefreshCw className="size-4" />} onClick={() => onRegenerate(message.id)} />
            )}
            <MessageAction
              label="点赞"
              active={message.feedback === 'liked'}
              icon={<ThumbsUp className="size-4" />}
              onClick={() => onFeedback(message.id, 'liked')}
            />
            <MessageAction
              label="点踩"
              active={message.feedback === 'disliked'}
              icon={<ThumbsDown className="size-4" />}
              onClick={() => onFeedback(message.id, 'disliked')}
            />
            <MessageAction
              label="收藏消息"
              active={message.favorited}
              icon={<Star className="size-4" />}
              onClick={() => onToggleFavorite(message.id)}
            />
          </>
        )}
      </div>
    </motion.article>
  )
}

function MessageAction({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-xl border text-[#687d99] transition ${
        active
          ? 'border-[#8abef0] bg-white/85 text-[#2563eb] shadow-[0_8px_20px_rgba(88,119,163,0.12)]'
          : 'border-white/30 bg-white/25 hover:bg-white/70 hover:text-[#2563eb]'
      }`}
    >
      {icon}
    </button>
  )
}

function MarkdownText({ text }: { text: string }) {
  const blocks = parseMarkdownBlocks(text)
  return (
    <div className="markdown-body text-left font-sans text-base font-semibold leading-[1.95] text-[#111827]">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <div key={index} className="my-4 overflow-hidden rounded-2xl border border-[#c8d8ea] bg-[#111827] text-left shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#93a4b8]">
                <span>{block.lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(block.content)}
                  className="rounded-lg px-2 py-1 text-[#c7d2fe] transition hover:bg-white/10"
                >
                  复制
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm font-medium leading-7 text-[#e5e7eb]"><code>{block.content}</code></pre>
            </div>
          )
        }
        return <Fragment key={index}>{renderMarkdownLines(block.content)}</Fragment>
      })}
    </div>
  )
}

function parseMarkdownBlocks(text: string) {
  const blocks: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    blocks.push({ type: 'code', lang: match[1], content: match[2].trimEnd() })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return blocks
}

function renderMarkdownLines(text: string) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let table: string[] = []
  let list: string[] = []

  const flushTable = () => {
    if (table.length >= 2) nodes.push(<MarkdownTable key={`table-${nodes.length}`} lines={table} />)
    table = []
  }
  const flushList = () => {
    if (list.length) {
      nodes.push(
        <ul key={`list-${nodes.length}`} className="my-3 list-disc space-y-1 pl-6">
          {list.map((item, index) => <li key={index}>{formatInline(item)}</li>)}
        </ul>,
      )
    }
    list = []
  }

  lines.forEach((line, index) => {
    if (/^\|.+\|$/.test(line.trim())) {
      flushList()
      table.push(line)
      return
    }
    flushTable()

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushList()
      const Tag = heading[1].length === 1 ? 'h2' : heading[1].length === 2 ? 'h3' : 'h4'
      nodes.push(<Tag key={index} className="mb-2 mt-4 font-bold text-[#111827]">{formatInline(heading[2])}</Tag>)
      return
    }

    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      list.push(bullet[1])
      return
    }

    flushList()
    if (line.trim()) {
      nodes.push(<p key={index} className="my-2 whitespace-pre-wrap">{formatInline(line)}</p>)
    }
  })

  flushTable()
  flushList()
  return nodes
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))

  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-[#c8d8ea] bg-white/55">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex === 0 ? 'bg-white/65 font-bold' : 'border-t border-[#d7e3f0]'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top">{formatInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded-md bg-[#dce9f8] px-1.5 py-0.5 text-sm text-[#1f4f8f]">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
