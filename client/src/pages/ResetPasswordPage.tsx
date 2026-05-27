import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { Rocket, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Нет токена в URL
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('reset.invalidTitle')}</h1>
          <p className="text-gray-400 mb-6">{t('reset.invalidMsg')}</p>
          <Link to="/forgot-password" className="inline-block bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {t('reset.requestNew')}
          </Link>
        </div>
      </div>
    )
  }

  // Пароль успешно сброшен
  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('reset.doneTitle')}</h1>
          <p className="text-gray-400 mb-6">{t('reset.doneMsg')}</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {t('reset.signIn')}
          </button>
        </div>
      </div>
    )
  }

  const mismatch = confirm.length > 0 && password !== confirm
  const weak = password.length > 0 && password.length < 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error(t('reset.passwordsMismatch')); return }
    if (password.length < 8) { toast.error(t('reset.passwordMin')); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('reset.resetFailed')
      if (msg.includes('expired') || msg.includes('Invalid')) {
        toast.error(t('reset.linkExpiredToast'))
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full h-11 bg-gray-950 border border-gray-800 text-gray-100 px-3.5 rounded-lg focus:outline-none focus:border-brand-500/60 text-sm placeholder-gray-600"

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center">
              <Rocket size={24} className="text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('reset.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('reset.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('reset.newPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={`${inputClass} pr-10 ${weak ? 'border-red-500/50' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {weak && <p className="text-xs text-red-400 mt-1">{t('reset.minChars')}</p>}
            {password.length >= 8 && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle size={11} /> {t('reset.goodPassword')}
              </p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('reset.confirmPlaceholder')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={`${inputClass} ${mismatch ? 'border-red-500/50' : ''}`}
            />
            {mismatch && <p className="text-xs text-red-400 mt-1">{t('reset.mismatch')}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || mismatch || weak}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? t('reset.saving') : t('reset.setNewPassword')}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            {t('reset.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
