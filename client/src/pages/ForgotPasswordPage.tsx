import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { Rocket, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error(t('forgot.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('forgot.checkInbox')}</h1>
          <p className="text-gray-400 mb-2">
            {t('forgot.ifExists', { email })}
          </p>
          <p className="text-sm text-gray-600 mb-6">{t('forgot.linkExpires')}</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
            <ArrowLeft size={14} /> {t('forgot.backToSignIn')}
          </Link>
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
          <h1 className="text-2xl font-bold text-white">{t('forgot.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('forgot.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="email"
              placeholder={t('forgot.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 bg-gray-950 border border-gray-800 text-gray-100 pl-10 pr-4 rounded-lg focus:outline-none focus:border-brand-500/60 text-sm placeholder-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? t('forgot.sending') : t('forgot.sendLink')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> {t('forgot.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
