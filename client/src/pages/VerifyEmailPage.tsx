import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const success = params.get('success') === '1'
  const error = params.get('error')
  const user = useAuthStore((s) => s.user)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!user?.email) return
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: user.email })
      setResent(true)
      toast.success(t('verify.verificationSent'))
    } catch {
      toast.error(t('verify.resendFailed'))
    } finally {
      setResending(false)
    }
  }

  // Успешное подтверждение
  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('verify.confirmedTitle')}</h1>
          <p className="text-gray-400 mb-6">{t('verify.confirmedMsg')}</p>
          <Link to="/" className="inline-block bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {t('verify.goToCatalogue')}
          </Link>
        </div>
      </div>
    )
  }

  // Ошибка / истёкший токен
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('verify.expiredTitle')}</h1>
          <p className="text-gray-400 mb-6">{t('verify.expiredMsg')}</p>
          {user && !user.isVerified && (
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="flex items-center gap-2 mx-auto bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
              {resent ? t('verify.resent') : resending ? t('verify.sending') : t('verify.resend')}
            </button>
          )}
          {!user && (
            <Link to="/login" className="inline-block text-brand-400 hover:text-brand-300 text-sm">
              {t('verify.signInToResend')}
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Баннер "нужно подтвердить email" (попали на страницу напрямую)
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('verify.checkInbox')}</h1>
        <p className="text-gray-400 mb-2">
          {t('verify.sentTo')}{' '}
          <span className="text-white font-medium">{user?.email}</span>
        </p>
        <p className="text-sm text-gray-600 mb-6">{t('verify.checkSpam')}</p>
        {user && !user.isVerified && (
          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {resent ? t('verify.emailSentShort') : t('verify.resendShort')}
          </button>
        )}
      </div>
    </div>
  )
}
