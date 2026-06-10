import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register } from '../api/auth'
import { Rocket, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const inputClass = "w-full h-11 bg-gray-950 border border-gray-800 text-gray-100 px-3.5 rounded-lg focus:outline-none focus:border-brand-500/60 text-sm placeholder-gray-600"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form.email, form.username, form.password, form.displayName)
      // НЕ авторизуем — показываем экран "проверьте почту"; вход только после подтверждения
      setVerificationSent(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('register.regFailed'))
    } finally {
      setLoading(false)
    }
  }

  // После регистрации — показываем экран подтверждения email
  if (verificationSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('register.checkInbox')}</h1>
          <p className="text-gray-400 mb-2">
            {t('register.sentLinkTo')}{' '}
            <span className="text-white font-medium">{form.email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">{t('register.clickToActivate')}</p>
          <Link
            to="/login"
            className="inline-block text-sm bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {t('register.continueToApp')}
          </Link>
          <p className="text-xs text-gray-600 mt-4">{t('register.unverifiedNote')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center">
              <Rocket size={24} className="text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('register.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder={t('register.displayNamePlaceholder')}
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder={t('register.usernamePlaceholder')}
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            pattern="[a-zA-Z0-9_]+"
            minLength={3}
            maxLength={30}
            className={inputClass}
          />
          <input
            type="email"
            placeholder={t('register.emailPlaceholder')}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder={t('register.passwordPlaceholder')}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">{t('register.signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
