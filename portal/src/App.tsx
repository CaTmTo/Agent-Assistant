import { useCallback, useEffect, useState } from 'react'
import { AuthModal } from './components/AuthModal'
import { ChatWorkspace } from './components/ChatWorkspace'
import { CollapsibleSidebar } from './components/CollapsibleSidebar'
import { useAuth } from './hooks/useAuth'
import { useChat } from './hooks/useChat'

export default function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState('')

  const { currentUser, handleLogin, handleLogout } = useAuth()
  const {
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
  } = useChat(setToast)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (currentUser) {
      appendBot('会话已建立，欢迎回来。')
    }
  }, [])

  const openAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab)
    setAuthOpen(true)
  }

  const handleAuthSuccess = (nickname: string) => {
    handleLogin(nickname)
    appendBot('会话已建立。')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-[#1f2937]">
      <CollapsibleSidebar
        expanded={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewChat={() => {
          startNewChat()
          showToast('已开始新对话')
        }}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={switchSession}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        onToggleFavorite={toggleSessionFavorite}
        onQuickSend={(text) => void send(text)}
      />

      <main className="flex flex-1 flex-col overflow-y-auto bg-transparent">
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
          <div className="w-full max-w-[1180px]">
            <ChatWorkspace
              messages={messages}
              onSend={send}
              onClear={clear}
              onStop={stop}
              onEditAndResend={editAndResend}
              onRegenerate={regenerate}
              onFeedback={setMessageFeedback}
              onToggleFavorite={toggleMessageFavorite}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>

      <div id="auth-zone" className="fixed right-8 top-6 z-50 flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-6 rounded-2xl border border-white/45 bg-white/30 px-7 py-5 text-[#111827] shadow-[0_14px_38px_rgba(83,123,168,0.12)] backdrop-blur-xl">
            <span className="text-base font-semibold">{currentUser}</span>
            <button
              onClick={handleLogout}
              className="text-base font-semibold text-[#111827] transition hover:text-[#3b82f6]"
            >
              退出
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="bg-white/80 px-5 py-3 text-sm font-semibold text-[#111827] shadow-[0_16px_45px_rgba(88,119,163,0.12)] backdrop-blur-xl transition hover:text-[#3b82f6]"
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="bg-white/80 px-5 py-3 text-sm font-semibold text-[#111827] shadow-[0_16px_45px_rgba(88,119,163,0.12)] backdrop-blur-xl transition hover:text-[#3b82f6]"
            >
              注册
            </button>
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onOAuth={(provider) => showToast(`${provider} 登录即将接入 OAuth`)}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={showToast}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-[60] max-w-[min(90vw,420px)] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 px-5 py-3 text-center text-sm font-medium text-[#1f2937] shadow-2xl backdrop-blur-xl"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
