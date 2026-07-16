import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('nickname')
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  const handleLogin = useCallback((nickname: string) => {
    localStorage.setItem('nickname', nickname)
    setCurrentUser(nickname)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('nickname')
    localStorage.removeItem('astra-theme')
    setCurrentUser(null)
    window.location.href = '/login.html'
  }, [])

  return {
    currentUser,
    handleLogin,
    handleLogout,
  }
}
