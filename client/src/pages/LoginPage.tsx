import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, resendVerification } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { Github, AlertCircle, RefreshCw, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { BuildHubMark } from '../components/Logo'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LoginPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const oauthError = params.get('error')
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const isLight = useThemeStore((s) => s.theme === 'light')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setNeedsVerify(false); setResent(false)
    try {
      const { user, accessToken, refreshToken } = await login(form.email, form.password)
      setAuth(user, accessToken, refreshToken)
      toast.success(t('login.welcomeBack'))
      navigate('/')
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') setNeedsVerify(true)
      else toast.error(err?.response?.data?.error || t('login.invalidCredentials'))
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (!form.email) return
    setResending(true)
    try { await resendVerification(form.email); setResent(true) }
    catch { toast.error(t('login.oauthFailed')) } finally { setResending(false) }
  }

  const handleOAuth = (provider: 'github' | 'google') => { window.location.href = `${API_URL}/api/auth/${provider}` }

  const inputClass = 'w-full h-11 pl-10 pr-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-brand-500/60 focus:outline-none text-gray-100 placeholder-gray-600'

  return (
    <div className="relative overflow-hidden">
      <div className={'absolute inset-0 pointer-events-none ' + (isLight ? 'opacity-[0.14]' : 'opacity-30')}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, #4f6ef0, transparent 60%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 60%)' }} />
      </div>
      <div className={'absolute inset-0 pointer-events-none ' + (isLight ? 'opacity-[0.06]' : 'opacity-[0.04]')}
        style={{
          backgroundImage: `linear-gradient(to right, ${isLight ? '#0f172a' : '#fff'} 1px, transparent 1px), linear-gradient(to bottom, ${isLight ? '#0f172a' : '#fff'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      <div className="relative min-h-[85vh] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 shadow-lg shadow-brand-500/20 rounded-2xl"><BuildHubMark size={56} radius={14} /></div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight">{t('login.title')}</h1>
            <p className="text-gray-500 text-sm mt-1.5">{t('login.subtitle')}</p>
          </div>

          {oauthError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={15} />
              {oauthError === 'oauth_cancelled' ? t('login.oauthCancelled') : t('login.oauthFailed')}
            </div>
          )}

          <div className="bg-gray-900/70 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-black/30">
            <div className="space-y-2.5">
              <button onClick={() => handleOAuth('github')} className="w-full h-11 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 font-medium flex items-center justify-center gap-2.5"><Github size={16} /> {t('auth.continueGithub')}</button>
              <button onClick={() => handleOAuth('google')} className="w-full h-11 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 font-medium flex items-center justify-center gap-2.5"><GoogleIcon /> {t('auth.continueGoogle')}</button>
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[11px] uppercase tracking-wider text-gray-600">{t('auth.orEmail')}</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder={t('login.emailPlaceholder')} className={inputClass} />
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPwd ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={t('login.passwordPlaceholder')} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-brand-400">{t('login.forgotPassword')}</Link>
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium mt-1">{loading ? t('login.signingIn') : t('login.signIn')}</button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-5 pt-5 border-t border-gray-800">
              {t('login.noAccount')} <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">{t('login.signUp')}</Link>
            </div>
          </div>

          {needsVerify && (
            <div className="mt-6 p-3.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center shrink-0"><AlertCircle size={14} /></div>
              <div className="flex-1 text-sm">
                <div className="text-yellow-200 font-medium">{t('login.emailNotVerified')}</div>
                {resent && <div className="text-green-400 text-xs mt-0.5">{t('login.resentNotice')}</div>}
              </div>
              {!resent && (
                <button onClick={handleResend} disabled={resending} className="h-7 px-2.5 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-200 text-xs font-medium shrink-0 flex items-center gap-1">
                  <RefreshCw size={11} className={resending ? 'animate-spin' : ''} /> {t('login.resend')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
