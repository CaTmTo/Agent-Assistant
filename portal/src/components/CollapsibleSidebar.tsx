import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  MessageSquarePlus,
  Pencil,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatSession } from '../hooks/useChat'

type Props = {
  expanded: boolean
  onToggle: () => void
  onNewChat: () => void
  sessions: ChatSession[]
  activeSessionId: string
  onSelectSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string) => void
  onDeleteSession: (sessionId: string) => void
  onToggleFavorite: (sessionId: string) => void
  onQuickSend: (text: string) => void
}

const quickPrompts = [
  { label: '实习周报', text: '分析一份实习项目周报' },
  { label: '架构规划', text: '帮我规划一个智能体项目架构' },
]

const todayPlaceholders = ['数据库表设计草稿', '登录流程备忘', 'API 清单 v0.1']

export function CollapsibleSidebar({
  expanded,
  onToggle,
  onNewChat,
  sessions,
  activeSessionId,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onToggleFavorite,
  onQuickSend,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [favoriteOpen, setFavoriteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const filteredSessions = sessions.filter((session) =>
    `${session.title} ${session.messages.map((message) => message.content).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const favoriteSessions = sessions.filter((session) => session.favorited)

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 312 : 64 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
      className="relative z-20 flex h-screen shrink-0 flex-col border-r border-[#d7e1ee]/70 bg-[#f5f9ff]/82 text-[#20242a] shadow-[8px_0_32px_rgba(88,119,163,0.08)] backdrop-blur-[18px]"
    >
      <div className="flex h-[76px] items-center px-4">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex min-w-0 items-center gap-4"
            >
              <div
                className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-[#58c7ff] to-[#8b6df5] shadow-[0_12px_32px_rgba(86,142,232,0.24)]"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate font-sans text-lg font-bold tracking-normal text-[#20242a]">
                  Astra AI
                </p>
                <p className="truncate text-xs font-bold tracking-[0.12em] text-[#20242a]">
                  智能体工作台
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="toggle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex size-10 items-center justify-center rounded-xl text-[#3f4650] transition hover:bg-white/70"
            >
              <ChevronRight className="size-5" strokeWidth={1.8} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? '收起侧边栏' : '展开侧边栏'}
          className="ml-auto flex size-10 items-center justify-center rounded-xl text-[#20242a] transition hover:bg-white/70"
        >
          {expanded ? (
            <ChevronLeft className="size-5" strokeWidth={2} />
          ) : (
            <ChevronRight className="size-5" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="flex shrink-0 flex-col gap-8 px-6 py-10" aria-label="主导航">
        <SidebarRow
          expanded={expanded}
          icon={<MessageSquarePlus className="size-[20px]" strokeWidth={1.8} />}
          label="新对话"
          onClick={onNewChat}
        />
        <SidebarRow
          expanded={expanded}
          icon={<History className="size-[20px]" strokeWidth={1.8} />}
          label="历史"
          onClick={() => setHistoryOpen((v) => !v)}
        />
        <AnimatePresence initial={false}>
          {expanded && historyOpen ? (
            <motion.div
              key="history-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-white/45 bg-white/35 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] backdrop-blur-xl">
                <label className="mb-2 flex items-center gap-2 rounded-xl border border-white/45 bg-white/45 px-3 py-2 text-[#7890ad]">
                  <Search className="size-4" strokeWidth={1.8} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索历史聊天"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#9aadc4]"
                  />
                </label>
                {filteredSessions.length ? (
                  <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
                    {filteredSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        active={session.id === activeSessionId}
                        editing={editingId === session.id}
                        editingTitle={editingTitle}
                        onEditTitle={setEditingTitle}
                        onSelect={() => onSelectSession(session.id)}
                        onStartRename={() => {
                          setEditingId(session.id)
                          setEditingTitle(session.title)
                        }}
                        onCancelRename={() => setEditingId('')}
                        onConfirmRename={() => {
                          onRenameSession(session.id, editingTitle)
                          setEditingId('')
                        }}
                        onDelete={() => onDeleteSession(session.id)}
                        onToggleFavorite={() => onToggleFavorite(session.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm font-semibold text-[#8ca1bd]">暂无历史记录</p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <SidebarRow
          expanded={expanded}
          icon={<Bookmark className="size-[20px]" strokeWidth={1.8} />}
          label="收藏"
          onClick={() => setFavoriteOpen((v) => !v)}
        />
        <AnimatePresence initial={false}>
          {expanded && favoriteOpen ? (
            <motion.div
              key="favorite-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-white/45 bg-white/30 p-2 backdrop-blur-xl">
                {favoriteSessions.length ? (
                  <div className="max-h-[210px] space-y-1 overflow-y-auto pr-1">
                    {favoriteSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => onSelectSession(session.id)}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#5d6e85] transition hover:bg-white/60 hover:text-[#2563eb]"
                      >
                        <span className="block truncate">{session.title}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm font-semibold text-[#8ca1bd]">暂无收藏会话</p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {expanded && (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto"
            >
              <div className="px-6 pb-4 pt-2">
                <p className="text-sm font-bold text-[#20242a]">快捷</p>
                <div className="mt-5 space-y-4">
                  {quickPrompts.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      onClick={() => onQuickSend(p.text)}
                      className="flex w-full items-center gap-3 rounded-lg text-left text-sm font-semibold text-[#20242a] transition hover:text-[#3b82f6]"
                    >
                      <Sparkles className="size-4 shrink-0" strokeWidth={1.8} />
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <SidebarSection title="今天" items={todayPlaceholders} />
              <SidebarSection title="收藏" items={favoriteSessions.map((session) => session.title).slice(0, 4)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

function SessionRow({
  session,
  active,
  editing,
  editingTitle,
  onEditTitle,
  onSelect,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onDelete,
  onToggleFavorite,
}: {
  session: ChatSession
  active: boolean
  editing: boolean
  editingTitle: string
  onEditTitle: (value: string) => void
  onSelect: () => void
  onStartRename: () => void
  onCancelRename: () => void
  onConfirmRename: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 transition ${
        active
          ? 'bg-white/75 text-[#1f2937] shadow-[0_8px_22px_rgba(88,119,163,0.12)]'
          : 'text-[#5d6e85] hover:bg-white/55'
      }`}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            value={editingTitle}
            onChange={(event) => onEditTitle(event.target.value)}
            className="w-full rounded-lg border border-[#c9d9ec] bg-white/80 px-2 py-1.5 text-sm font-bold outline-none"
            autoFocus
          />
          <div className="flex gap-1">
            <IconButton label="确认" icon={<Check className="size-3.5" />} onClick={onConfirmRename} />
            <IconButton label="取消" icon={<X className="size-3.5" />} onClick={onCancelRename} />
          </div>
        </div>
      ) : (
        <>
          <button type="button" onClick={onSelect} className="w-full text-left">
            <span className="block truncate text-sm font-bold">{session.title}</span>
            <span className="mt-1 block text-[11px] font-semibold text-[#8ca1bd]">{formatSessionTime(session.updatedAt)}</span>
          </button>
          <div className="mt-2 flex gap-1 opacity-75">
            <IconButton
              label="收藏"
              active={session.favorited}
              icon={<Star className="size-3.5" />}
              onClick={onToggleFavorite}
            />
            <IconButton label="重命名" icon={<Pencil className="size-3.5" />} onClick={onStartRename} />
            <IconButton label="删除" icon={<Trash2 className="size-3.5" />} onClick={onDelete} />
          </div>
        </>
      )}
    </div>
  )
}

function IconButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`inline-flex size-7 items-center justify-center rounded-lg transition ${
        active ? 'bg-white/85 text-[#2563eb]' : 'bg-white/35 text-[#7890ad] hover:bg-white/75 hover:text-[#2563eb]'
      }`}
    >
      {icon}
    </button>
  )
}

function SidebarSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="px-6 py-5">
      <p className="text-sm font-bold text-[#20242a]">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="truncate text-sm font-medium leading-snug text-[#20242a]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatSessionTime(value: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SidebarRow({
  expanded,
  icon,
  label,
  onClick,
}: {
  expanded: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="group flex w-full items-center gap-5 rounded-xl text-left text-[#20242a] transition hover:text-[#3b82f6]"
    >
      <span className="flex size-7 shrink-0 items-center justify-center">{icon}</span>
      {expanded ? <span className="min-w-0 truncate text-base font-semibold">{label}</span> : null}
    </button>
  )
}
