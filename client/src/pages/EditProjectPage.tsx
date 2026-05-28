import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUpdateProject, useMyProjects, useUploadFile, useAdminProject } from '../api/projects'
import { useAuthStore } from '../stores/authStore'
import { useUploadProjectIcon, useUploadProjectBanner, useUploadScreenshot, useDeleteScreenshot } from '../api/images'
import { ProjectType } from '../types'
import { Upload, ImagePlus, X, Camera } from 'lucide-react'
import VersionsManager from '../components/project/VersionsManager'
import toast from 'react-hot-toast'

const TYPES: ProjectType[] = ['WEB','IOS','ANDROID','DESKTOP_MAC','DESKTOP_WIN','DESKTOP_LINUX','CROSS_PLATFORM','OTHER']
const PLATFORMS = ['MACOS','WINDOWS','LINUX','IOS','ANDROID','UNIVERSAL']
import { mediaUrl } from '../utils/mediaUrl'


export default function EditProjectPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: projects } = useMyProjects()
  const isAdmin = useAuthStore((s) => s.user?.isAdmin === true)
  const ownProject = projects?.find((p) => p.id === id)
  // Если проект не среди своих, но пользователь — админ, грузим его напрямую.
  const { data: adminProject } = useAdminProject(id!, isAdmin && !!projects && !ownProject)
  const project = ownProject ?? adminProject
  const update = useUpdateProject(id!)

  const [form, setForm] = useState({
    title: '', description: '', longDesc: '',
    type: 'WEB' as ProjectType, tags: '',
    websiteUrl: '', githubUrl: '', creatorName: '', creatorUrl: '',
  })
  const [uploadPlatform, setUploadPlatform] = useState('UNIVERSAL')
  const [uploadVersion, setUploadVersion] = useState('1.0.0')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Image previews
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  const uploadFileMutation = useUploadFile(project?.id ?? '', project?.slug ?? '')
  const uploadIcon = useUploadProjectIcon(project?.id ?? '', project?.slug ?? '')
  const uploadBanner = useUploadProjectBanner(project?.id ?? '', project?.slug ?? '')
  const uploadScreenshot = useUploadScreenshot(project?.id ?? '', project?.slug ?? '')
  const deleteScreenshot = useDeleteScreenshot(project?.id ?? '', project?.slug ?? '')

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        description: project.description,
        longDesc: project.longDesc || '',
        type: project.type,
        tags: project.tags.join(', '),
        websiteUrl: project.websiteUrl || '',
        githubUrl: project.githubUrl || '',
        creatorName: project.creatorName || '',
        creatorUrl: project.creatorUrl || '',
      })
    }
  }, [project])

  if (!project) return <div className="text-gray-500 text-center py-20">{t('edit.loading')}</div>

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const inputClass = "w-full bg-gray-950 border border-gray-800 text-gray-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-brand-500/60 text-sm placeholder-gray-600"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await update.mutateAsync({ ...form, tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean) })
      toast.success(t('edit.saved'))
    } catch { toast.error(t('edit.saveFailed')) }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return
    try {
      await uploadFileMutation.mutateAsync({ file: uploadFile, platform: uploadPlatform, version: uploadVersion })
      toast.success(t('edit.fileUploaded'))
      setUploadFile(null)
    } catch { toast.error(t('edit.uploadFailed')) }
  }

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setIconPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    try {
      await uploadIcon.mutateAsync(file)
      toast.success(t('edit.iconUpdated'))
    } catch { toast.error(t('edit.iconUploadFailed')); setIconPreview(null) }
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    try {
      await uploadBanner.mutateAsync(file)
      toast.success(t('edit.bannerUpdated'))
    } catch { toast.error(t('edit.bannerUploadFailed')); setBannerPreview(null) }
  }

  const handleScreenshotAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      await uploadScreenshot.mutateAsync(file)
      toast.success(t('edit.screenshotAdded'))
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('edit.screenshotUploadFailed'))
    }
  }

  const handleScreenshotDelete = async (url: string) => {
    try {
      await deleteScreenshot.mutateAsync(url)
      toast.success(t('edit.screenshotRemoved'))
    } catch { toast.error(t('edit.screenshotRemoveFailed')) }
  }

  const currentIconSrc = iconPreview || mediaUrl(project.iconUrl)
  const currentBannerSrc = bannerPreview || mediaUrl(project.bannerUrl)
  const screenshots = (project as any).screenshots as string[] | undefined

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold text-gray-50 tracking-tight">{t('edit.title', { title: project.title })}</h1>

      {/* ── Images ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{t('edit.images')}</h2>

        {/* Banner */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">{t('edit.banner')}</label>
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 hover:border-brand-500 cursor-pointer transition-colors group"
          >
            {currentBannerSrc ? (
              <>
                <img src={currentBannerSrc} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500 group-hover:text-gray-400">
                <ImagePlus size={24} />
                <span className="text-xs">{t('edit.bannerUpload')}</span>
                <span className="text-xs text-gray-600">{t('edit.bannerHint')}</span>
              </div>
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">{t('edit.icon')}</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => iconInputRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 hover:border-brand-500 cursor-pointer transition-colors group flex-shrink-0"
            >
              {currentIconSrc ? (
                <>
                  <img src={currentIconSrc} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={16} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImagePlus size={20} className="text-gray-500 group-hover:text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => iconInputRef.current?.click()}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                {uploadIcon.isPending ? t('edit.uploading') : t('edit.changeIcon')}
              </button>
              <p className="text-xs text-gray-600 mt-1">{t('edit.iconHint')}</p>
            </div>
          </div>
          <input ref={iconInputRef} type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
        </div>

        {/* Screenshots */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-400">{t('edit.screenshots')}</label>
            <span className="text-xs text-gray-600">{screenshots?.length ?? 0}/8</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {screenshots?.map((url) => (
              <div key={url} className="relative group rounded-lg overflow-hidden bg-gray-800 aspect-video">
                <img
                  src={mediaUrl(url)!}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleScreenshotDelete(url)}
                  disabled={deleteScreenshot.isPending}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {(!screenshots || screenshots.length < 8) && (
              <button
                onClick={() => screenshotInputRef.current?.click()}
                disabled={uploadScreenshot.isPending}
                className="aspect-video rounded-lg border-2 border-dashed border-gray-700 hover:border-brand-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-400 transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">{uploadScreenshot.isPending ? t('edit.uploading') : t('edit.addScreenshot')}</span>
              </button>
            )}
          </div>
          <input ref={screenshotInputRef} type="file" accept="image/*" onChange={handleScreenshotAdd} className="hidden" />
        </div>
      </div>

      {/* ── Project info ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{t('edit.projectInfo')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.titleLabel')}</label>
            <input value={form.title} onChange={set('title')} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.typeLabel')}</label>
            <select value={form.type} onChange={set('type')} className={inputClass}>
              {TYPES.map((tp) => <option key={tp} value={tp}>{t(`projectType.${tp}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.shortDescLabel')}</label>
            <textarea value={form.description} onChange={set('description')} required rows={3} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.fullDescLabel')}</label>
            <textarea value={form.longDesc} onChange={set('longDesc')} rows={6} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.tagsLabel')}</label>
            <input value={form.tags} onChange={set('tags')} className={inputClass} placeholder={t('edit.tagsPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('edit.websiteLabel')}</label>
              <input type="url" value={form.websiteUrl} onChange={set('websiteUrl')} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('edit.githubLabel')}</label>
              <input type="url" value={form.githubUrl} onChange={set('githubUrl')} className={inputClass} />
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4">
            <p className="text-sm text-gray-400 mb-3">{t('edit.authorship')}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('edit.creatorNameLabel')}</label>
                <input value={form.creatorName} onChange={set('creatorName')} maxLength={100} className={inputClass} placeholder={t('edit.creatorNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('edit.creatorUrlLabel')}</label>
                <input type="url" value={form.creatorUrl} onChange={set('creatorUrl')} className={inputClass} placeholder={t('edit.creatorUrlPlaceholder')} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={update.isPending}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
              {update.isPending ? t('edit.saving') : t('edit.saveChanges')}
            </button>
            <button type="button" onClick={() => navigate('/my-projects')}
              className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm transition-colors">
              {t('edit.back')}
            </button>
          </div>
        </form>
      </div>

      {/* ── Distributable file ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{t('edit.distributableFile')}</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('edit.platformLabel')}</label>
              <select value={uploadPlatform} onChange={(e) => setUploadPlatform(e.target.value)} className={inputClass}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{t(`platform.${p}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('edit.versionLabel')}</label>
              <input value={uploadVersion} onChange={(e) => setUploadVersion(e.target.value)} className={inputClass} placeholder="1.0.0" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t('edit.fileLabel')}</label>
            <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-400 px-4 py-2.5 rounded-lg text-sm file:mr-3 file:bg-gray-700 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:text-xs" />
          </div>
          <button onClick={handleFileUpload} disabled={!uploadFile || uploadFileMutation.isPending}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm transition-colors">
            <Upload size={16} /> {uploadFileMutation.isPending ? t('edit.uploading') : t('edit.uploadFile')}
          </button>
        </div>
      </div>

      {/* ── Changelog / Versions ── */}
      <VersionsManager projectId={project.id} />
    </div>
  )
}
