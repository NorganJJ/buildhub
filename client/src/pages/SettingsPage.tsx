import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Upload, Globe, Github, Moon, Sun, Trash2, AlertCircle, X } from 'lucide-react'
import { api } from '../api/client'
import { useUploadAvatar } from '../api/images'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore, Theme } from '../stores/themeStore'
import { SUPPORTED_LANGUAGES } from '../i18n'
import { mediaUrl } from '../utils/mediaUrl'
import { avatarGradient } from '../utils/gradient'
import toast from 'react-hot-toast'

const inputClass = 'w-full h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-brand-500/60 focus:outline-none text-sm text-gray-100 placeholder-gray-600'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        {hint && <span className="text-[11px] text-gray-600">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logoutStore = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const navigate = useNavigate()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    website: user?.website || '',
    githubUrl: user?.githubUrl || '',
  })
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    try { await uploadAvatar.mutateAsync(file); toast.success(t('settings.avatarUpdated')) }
    catch { toast.error(t('settings.avatarFailed')); setAvatarPreview(null) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/users/me', form)
      setUser({ ...user!, ...data })
      toast.success(t('settings.profileSaved'))
    } catch { toast.error(t('settings.profileFailed')) } finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/users/me')
      logoutStore()
      toast.success(t('settings.accountDeleted'))
      navigate('/')
    } catch {
      toast.error(t('settings.accountDeleteFailed'))
      setDeleting(false)
    }
  }

  const avatarSrc = avatarPreview || (user?.avatarUrl ? mediaUrl(user.avatarUrl) : null)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-50 tracking-tight">{t('settings.title')}</h1>
      <p className="text-gray-500 mt-1.5">{t('settings.subtitle')}</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8">
        {/* Side nav */}
        <nav className="space-y-1 text-sm hidden md:block">
          <a href="#profile" className="block px-3 py-2 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">{t('settings.navProfile')}</a>
          <a href="#appearance" className="block px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors">{t('settings.appearanceTitle')}</a>
          <a href="#language" className="block px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors">{t('settings.languageTitle')}</a>
          <a href="#danger" className="block px-3 py-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-900 transition-colors">{t('settings.dangerTitle')}</a>
        </nav>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar */}
          <section id="profile" className="bg-gray-900 border border-gray-800 rounded-xl p-6 scroll-mt-20">
            <h2 className="text-base font-semibold text-gray-100">{t('settings.profilePicture')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('settings.photoHint')}</p>
            <div className="flex items-center gap-5 mt-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden"
                style={avatarSrc ? undefined : { background: avatarGradient(user?.username || 'u') }}>
                {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : (user?.displayName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadAvatar.isPending}
                  className="h-9 px-3 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-sm text-gray-200 flex items-center gap-2"><Upload size={13} /> {uploadAvatar.isPending ? t('settings.uploading') : t('settings.changePhoto')}</button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} className="hidden" />
            </div>
          </section>

          {/* Public profile */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-100">{t('settings.publicInfo')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('settings.usernameHint')} · @{user?.username}</p>
            <div className="mt-5 space-y-4">
              <Field label={t('settings.displayName')}>
                <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} maxLength={60} placeholder={t('settings.displayNamePlaceholder')} className={inputClass} />
              </Field>
              <Field label={t('settings.bio')} hint={`${form.bio.length}/500`}>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} maxLength={500} placeholder={t('settings.bioPlaceholder')}
                  className="w-full p-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-brand-500/60 focus:outline-none text-sm text-gray-100 resize-none placeholder-gray-600" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('settings.website')}>
                  <div className="flex items-center h-10 rounded-lg bg-gray-950 border border-gray-800 focus-within:border-brand-500/60 overflow-hidden">
                    <span className="pl-3 text-gray-500"><Globe size={13} /></span>
                    <input type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder={t('settings.websitePlaceholder')} className="flex-1 h-full px-2.5 bg-transparent text-gray-100 text-sm focus:outline-none" />
                  </div>
                </Field>
                <Field label={t('settings.github')}>
                  <div className="flex items-center h-10 rounded-lg bg-gray-950 border border-gray-800 focus-within:border-brand-500/60 overflow-hidden">
                    <span className="pl-3 text-gray-500"><Github size={13} /></span>
                    <input type="url" value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder={t('settings.githubPlaceholder')} className="flex-1 h-full px-2.5 bg-transparent text-gray-100 text-sm focus:outline-none" />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          {/* Appearance / Theme */}
          <section id="appearance" className="bg-gray-900 border border-gray-800 rounded-xl p-6 scroll-mt-20">
            <h2 className="text-base font-semibold text-gray-100">{t('settings.appearanceTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('settings.appearanceSubtitle')}</p>
            <div className="grid grid-cols-2 gap-3 mt-5 max-w-sm">
              {([
                { key: 'dark' as Theme, icon: <Moon size={16} />, label: t('settings.themeDark') },
                { key: 'light' as Theme, icon: <Sun size={16} />, label: t('settings.themeLight') },
              ]).map((opt) => (
                <button key={opt.key} type="button" onClick={() => setTheme(opt.key)}
                  className={'flex items-center justify-center gap-2 h-12 rounded-lg border text-sm transition-colors ' +
                    (theme === opt.key ? 'bg-brand-500/10 border-brand-500/40 text-brand-300' : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300')}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section id="language" className="bg-gray-900 border border-gray-800 rounded-xl p-6 scroll-mt-20">
            <h2 className="text-base font-semibold text-gray-100">{t('settings.languageTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('settings.languageSubtitle')}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-5">
              {SUPPORTED_LANGUAGES.map((lng) => (
                <button key={lng.code} type="button" onClick={() => i18n.changeLanguage(lng.code)}
                  className={'flex flex-col items-center gap-1 h-16 rounded-lg border text-xs transition-colors ' +
                    (i18n.resolvedLanguage === lng.code ? 'bg-brand-500/10 border-brand-500/40 text-brand-300' : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300')}>
                  <span className="font-mono text-[10px] text-gray-500">{lng.code}</span>
                  <span className="text-sm">{lng.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={saving} className="h-10 px-5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium">{saving ? t('settings.saving') : t('settings.saveChanges')}</button>
          </div>

          {/* Danger zone */}
          <section id="danger" className="bg-red-500/[0.03] border border-red-500/30 rounded-xl p-6 scroll-mt-20">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2"><AlertCircle size={16} /> {t('settings.dangerTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('settings.dangerSubtitle')}</p>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-950 border border-gray-800">
              <div>
                <div className="text-sm font-medium text-gray-200">{t('settings.deleteAccount')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('settings.deleteAccountHint')}</div>
              </div>
              <button type="button" onClick={() => { setConfirmText(''); setConfirmDelete(true) }}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium flex items-center gap-2 shrink-0">
                <Trash2 size={14} /> {t('settings.deleteAccount')}
              </button>
            </div>
          </section>
        </form>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100 flex items-center gap-2"><AlertCircle size={16} className="text-red-400" /> {t('settings.deleteAccount')}</h3>
              <button onClick={() => !deleting && setConfirmDelete(false)} className="w-8 h-8 rounded-md hover:bg-gray-800 text-gray-400 hover:text-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400">{t('settings.deleteConfirmWarning')}</p>
              <p className="text-sm text-gray-400 mt-3">{t('settings.deleteConfirmPrompt', { username: user?.username })}</p>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus
                placeholder={user?.username}
                className="mt-2 w-full h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-red-500/60 focus:outline-none text-sm text-gray-100 placeholder-gray-600" />
            </div>
            <div className="px-5 py-3 bg-gray-900/60 border-t border-gray-800 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="h-9 px-3 rounded-md text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50">{t('myProjects.cancel')}</button>
              <button onClick={handleDeleteAccount} disabled={deleting || confirmText !== user?.username}
                className="h-9 px-3.5 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium">
                {deleting ? t('settings.deleting') : t('settings.deleteAccountConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
