import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCreateProject } from '../api/projects'
import { ProjectType } from '../types'
import toast from 'react-hot-toast'

const TYPES: ProjectType[] = ['WEB','IOS','ANDROID','DESKTOP_MAC','DESKTOP_WIN','DESKTOP_LINUX','CROSS_PLATFORM','OTHER']

export default function CreateProjectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateProject()
  const [form, setForm] = useState({
    title: '', description: '', longDesc: '', type: 'WEB' as ProjectType,
    tags: '', websiteUrl: '', githubUrl: '', creatorName: '', creatorUrl: '',
  })
  const [notOwnAuthor, setNotOwnAuthor] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const project = await create.mutateAsync({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        websiteUrl: form.websiteUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        creatorName: notOwnAuthor ? (form.creatorName || undefined) : undefined,
        creatorUrl: notOwnAuthor ? (form.creatorUrl || undefined) : undefined,
      })
      toast.success(t('create.created'))
      navigate(`/my-projects/${project.id}/edit`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('create.createFailed'))
    }
  }

  const inputClass = "w-full bg-gray-950 border border-gray-800 text-gray-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-brand-500/60 text-sm placeholder-gray-600"

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-50 tracking-tight mb-6">{t('create.title')}</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('create.titleLabel')}</label>
            <input value={form.title} onChange={set('title')} required maxLength={100} className={inputClass} placeholder={t('create.titlePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('create.typeLabel')}</label>
            <select value={form.type} onChange={set('type')} className={inputClass}>
              {TYPES.map((tp) => <option key={tp} value={tp}>{t(`projectType.${tp}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('create.shortDescLabel')}</label>
            <textarea value={form.description} onChange={set('description')} required maxLength={500} rows={3} className={inputClass} placeholder={t('create.shortDescPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('create.fullDescLabel')}</label>
            <textarea value={form.longDesc} onChange={set('longDesc')} rows={6} className={inputClass} placeholder={t('create.fullDescPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('create.tagsLabel')}</label>
            <input value={form.tags} onChange={set('tags')} className={inputClass} placeholder={t('create.tagsPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('create.websiteLabel')}</label>
              <input type="url" value={form.websiteUrl} onChange={set('websiteUrl')} className={inputClass} placeholder={t('create.websitePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('create.githubLabel')}</label>
              <input type="url" value={form.githubUrl} onChange={set('githubUrl')} className={inputClass} placeholder={t('create.githubPlaceholder')} />
            </div>
          </div>
          <div className="border-t border-gray-800 pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={notOwnAuthor} onChange={(e) => setNotOwnAuthor(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-gray-300">{t('create.notOwnAuthor')}</span>
            </label>
            {notOwnAuthor && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">{t('create.creatorNameLabel')}</label>
                  <input value={form.creatorName} onChange={set('creatorName')} maxLength={100} className={inputClass} placeholder={t('create.creatorNamePlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">{t('create.creatorUrlLabel')}</label>
                  <input type="url" value={form.creatorUrl} onChange={set('creatorUrl')} className={inputClass} placeholder={t('create.creatorUrlPlaceholder')} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm">
              {create.isPending ? t('create.creating') : t('create.create')}
            </button>
            <button type="button" onClick={() => navigate('/my-projects')} className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg transition-colors text-sm">{t('create.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
