import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/client'
import toast from 'react-hot-toast'

// Страница-обработчик OAuth callback
// Бэкенд редиректит сюда: /oauth/callback?accessToken=...&refreshToken=...&isNew=...
// Мы сохраняем токены, подгружаем юзера и редиректим дальше

export default function OAuthCallbackPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const isNew = params.get('isNew') === 'true'
    const error = params.get('error')

    if (error) {
      const msg = error === 'oauth_cancelled' ? t('oauth.cancelled') : t('oauth.failed')
      toast.error(msg)
      navigate('/login')
      return
    }

    if (!accessToken || !refreshToken) {
      toast.error(t('oauth.missingTokens'))
      navigate('/login')
      return
    }

    // Сохраняем токены в store
    setTokens(accessToken, refreshToken)

    // Получаем данные пользователя
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        setUser(data.user)
        toast.success(isNew ? t('oauth.accountCreated') : t('oauth.welcomeBack'))
        navigate(isNew ? '/settings' : '/')
      })
      .catch(() => {
        toast.error(t('oauth.loadUserFailed'))
        navigate('/login')
      })
  }, [])

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{t('oauth.signingIn')}</p>
      </div>
    </div>
  )
}
