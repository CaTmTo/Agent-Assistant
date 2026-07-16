import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Mail, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function GithubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

type Props = {
  open: boolean
  initialTab?: 'login' | 'register'
  onClose: () => void
  onOAuth: (provider: string) => void
  onAuthSuccess: (nickname: string) => void
  onAuthError: (message: string) => void
}

export function AuthModal({ open, initialTab = 'login', onClose, onOAuth, onAuthSuccess, onAuthError }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const nicknameRef = useRef<HTMLInputElement>(null)
  const registerEmailRef = useRef<HTMLInputElement>(null)
  const registerPasswordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const email = emailRef.current?.value?.trim() || ''
      const password = passwordRef.current?.value || ''

      if (!email || !password) {
        onAuthError('请输入账号和密码')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: email, password }),
      })

      const data = await response.json()

      if (data.success) {
        const user = data.user
        const displayName = user.username || user.email
        localStorage.setItem('nickname', displayName)
        onAuthSuccess(displayName)
        onClose()
      } else {
        onAuthError(data.message || '登录失败')
      }
    } catch (error) {
      onAuthError('网络连接失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const username = nicknameRef.current?.value?.trim() || ''
      const email = registerEmailRef.current?.value?.trim() || ''
      const password = registerPasswordRef.current?.value || ''

      if (!username) {
        onAuthError('请输入昵称')
        setIsLoading(false)
        return
      }
      if (!email) {
        onAuthError('请输入邮箱')
        setIsLoading(false)
        return
      }
      if (!password || password.length < 6) {
        onAuthError('密码长度不能少于6位')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (data.success) {
        const user = data.user
        const displayName = user.username || user.email
        localStorage.setItem('nickname', displayName)
        onAuthSuccess(displayName)
        onClose()
      } else {
        onAuthError(data.message || '注册失败')
      }
    } catch (error) {
      onAuthError('网络连接失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="关闭"
            className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-[#0a0b12]/80 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_32px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/90">
                Astra AI
              </p>
              <h2 id="auth-title" className="mt-2 font-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                接入会话
              </h2>
              <p className="mt-2 text-sm text-slate-400">安全加密通道（前端演示 · OAuth 为占位）</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onOAuth('Google')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] py-3 text-sm font-medium text-slate-100 transition hover:border-sky-400/35 hover:bg-white/10"
                >
                  <span className="text-lg font-bold text-sky-300">G</span>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => onOAuth('GitHub')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] py-3 text-sm font-medium text-slate-100 transition hover:border-violet-400/35 hover:bg-white/10"
                >
                  <GithubMark className="size-4" />
                  GitHub
                </button>
              </div>

              <div className="relative my-6 text-center text-xs text-slate-500">
                <span className="relative z-10 bg-[#0a0b12]/90 px-3">或使用邮箱</span>
                <span className="absolute left-0 right-0 top-1/2 -z-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>

              <div className="flex rounded-2xl border border-white/10 bg-black/30 p-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                    tab === 'login'
                      ? 'bg-white/12 text-white shadow-inner'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                    tab === 'register'
                      ? 'bg-white/12 text-white shadow-inner'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  注册
                </button>
              </div>

              {tab === 'login' ? (
                <form className="mt-5 space-y-4" onSubmit={handleLogin}>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Mail className="size-3.5" strokeWidth={1.75} aria-hidden />
                      邮箱
                    </span>
                    <div className="input-shimmer">
                      <input
                        ref={emailRef}
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full border-0 bg-[#07080f]/90 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-600 focus:ring-0"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Lock className="size-3.5" strokeWidth={1.75} aria-hidden />
                      密码
                    </span>
                    <div className="input-shimmer">
                      <input
                        ref={passwordRef}
                        required
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full border-0 bg-[#07080f]/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '登录中...' : '进入工作台'}
                  </button>
                </form>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <User className="size-3.5" strokeWidth={1.75} aria-hidden />
                      昵称
                    </span>
                    <div className="input-shimmer">
                      <input
                        ref={nicknameRef}
                        required
                        type="text"
                        autoComplete="nickname"
                        placeholder="显示名称"
                        className="w-full border-0 bg-[#07080f]/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Mail className="size-3.5" strokeWidth={1.75} aria-hidden />
                      邮箱
                    </span>
                    <div className="input-shimmer">
                      <input
                        ref={registerEmailRef}
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full border-0 bg-[#07080f]/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Lock className="size-3.5" strokeWidth={1.75} aria-hidden />
                      密码
                    </span>
                    <div className="input-shimmer">
                      <input
                        ref={registerPasswordRef}
                        required
                        type="password"
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="至少 6 位"
                        className="w-full border-0 bg-[#07080f]/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '注册中...' : '创建身份'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}