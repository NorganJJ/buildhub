import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, Download, Globe, Github, ChevronRight, Calendar, Tag, Users, UserRound, TrendingUp } from 'lucide-react'
import { useProject, useVote } from '../api/projects'
import { useVersions } from '../api/versions'
import { useAuthStore } from '../stores/authStore'
import { PROJECT_TYPE_ICONS } from '../types'
import { mediaUrl } from '../utils/mediaUrl'
import { bannerGradient, avatarGradient } from '../utils/gradient'
import { handleExternalClick } from '../utils/openExternal'
import Markdown from '../components/Markdown'
import CommentsSection from '../components/comments/CommentsSection'
import ChangelogSection from '../components/project/ChangelogSection'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function ProjectPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const { data: project, isLoading, isError } = useProject(slug!)
  const vote = useVote()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const accessToken = useAuthStore((s) => s.accessToken)
  const versions = useVersions(project?.id ?? '').data?.versions ?? []
  const latestVersion = versions[0]?.version

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('project.loading')}</div>
  if (isError || !project) return <div className="text-center py-20 text-red-400">{t('project.notFound')}</div>

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) { toast.error(t('project.signInToVote')); return }
    const newValue = project.userVote === value ? 0 : value
    vote.mutate({ projectId: project.id, value: newValue as any })
  }

  const bannerUrl = project.bannerUrl ? mediaUrl(project.bannerUrl) : null
  const iconUrl = project.iconUrl ? mediaUrl(project.iconUrl) : null
  const authorAvatar = project.author.avatarUrl ? mediaUrl(project.author.avatarUrl) : null
  const locale = i18n.language
  const joinedYear = project.author.createdAt ? new Date(project.author.createdAt).getFullYear() : null

  return (
    <div>
      {/* Banner */}
      <div className="relative h-56 overflow-hidden" style={bannerUrl ? undefined : { background: bannerGradient(project.id) }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          : <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.5), transparent 50%)' }} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgb(3,7,18) 100%)' }} />
        <div className="absolute top-4 left-0 right-0 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-white/70">
            <Link to="/" className="hover:text-white">{t('nav.catalogue')}</Link>
            <ChevronRight size={12} />
            <span className="text-white/90">{t(`projectType.${project.type}`)}</span>
            <ChevronRight size={12} />
            <span className="text-white/90 truncate">{project.title}</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-20 relative">
        {/* Header card */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-8">
          <div className="w-24 h-24 rounded-2xl border-4 border-gray-950 flex items-center justify-center text-5xl shadow-xl shrink-0 overflow-hidden"
            style={iconUrl ? undefined : { background: bannerGradient(project.slug) }}>
            {iconUrl ? <img src={iconUrl} alt="" className="w-full h-full object-cover" /> : PROJECT_TYPE_ICONS[project.type]}
          </div>
          <div className="flex-1 pt-4 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-[11px] text-gray-300">{PROJECT_TYPE_ICONS[project.type]} {t(`projectType.${project.type}`)}</span>
              {latestVersion && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-[11px] text-green-400 font-medium">
                  <span className="w-1 h-1 rounded-full bg-green-400" />v{latestVersion}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-50 tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500 flex-wrap">
              <span>{project.creatorName ? t('project.postedBy', { name: '' }).replace('{{name}}', '').trim() : t('card.byLabel')}</span>
              <Link to={`/u/${project.author.username}`} className="text-gray-300 hover:text-brand-400 font-medium">{project.author.displayName || project.author.username}</Link>
              <span className="mx-1">·</span>
              <span>{t('project.published', { date: new Date(project.createdAt).toLocaleDateString(locale) })}</span>
            </div>
            {project.creatorName && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm">
                <UserRound size={13} className="text-gray-500" />
                <span className="text-gray-500">{t('project.creator')}</span>
                {project.creatorUrl ? (
                  <a href={project.creatorUrl} target="_blank" rel="noreferrer" onClick={handleExternalClick(project.creatorUrl)} className="text-brand-400 hover:text-brand-300 underline">{project.creatorName}</a>
                ) : <span className="text-gray-300">{project.creatorName}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-4 flex-wrap">
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noreferrer" onClick={handleExternalClick(project.websiteUrl)}
                className="h-10 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 flex items-center gap-2 text-sm transition-colors"><Globe size={14} /> {t('profile.website')}</a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" onClick={handleExternalClick(project.githubUrl)}
                className="h-10 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 flex items-center gap-2 text-sm transition-colors"><Github size={14} /> {t('profile.github')}</a>
            )}
            <div className="flex items-center rounded-lg bg-gray-900 border border-gray-800 overflow-hidden">
              <button onClick={() => handleVote(1)}
                className={'h-10 px-3 hover:bg-gray-800 flex items-center gap-2 text-sm border-r border-gray-800 ' + (project.userVote === 1 ? 'text-green-400' : 'text-gray-400')}>
                <ThumbsUp size={14} /> <span className="font-semibold">{compact(project.likes ?? 0)}</span>
              </button>
              <button onClick={() => handleVote(-1)}
                className={'h-10 px-3 hover:bg-gray-800 flex items-center gap-2 text-sm ' + (project.userVote === -1 ? 'text-red-400' : 'text-gray-400')}>
                <ThumbsDown size={14} /> {compact(project.dislikes ?? 0)}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('project.about')}</h2>
              <p className="text-gray-300 leading-relaxed">{project.description}</p>
              {project.longDesc && <div className="mt-4"><Markdown>{project.longDesc}</Markdown></div>}
            </section>

            {project.screenshots && project.screenshots.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('project.screenshots')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.screenshots.map((url, i) => (
                    <img key={i} src={mediaUrl(url)!} alt={`Screenshot ${i + 1}`} className="aspect-[4/3] rounded-lg object-cover border border-gray-800" />
                  ))}
                </div>
              </section>
            )}

            <ChangelogSection projectId={project.id} />
            <CommentsSection projectId={project.id} />
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5">
            {project.files && project.files.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Download size={14} /> {t('project.download')}</h3>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp size={11} /> {compact(project.downloadCount)}</span>
                </div>
                {isAuthenticated ? (
                  <div className="divide-y divide-gray-800">
                    {project.files.map((file, i) => (
                      <a key={file.id} href={`${API_URL}/api/files/download/${file.id}?token=${encodeURIComponent(accessToken || '')}`} className="block px-5 py-3 hover:bg-gray-800/40 group cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-200">{t(`platform.${file.platform}`)}</span>
                          <span className="text-[11px] text-gray-500 font-mono">v{file.version}</span>
                          <span className="ml-auto text-[11px] text-gray-600 font-mono">{(file.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-500 font-mono truncate">{file.filename}</span>
                          <span className={'ml-auto h-7 w-7 rounded flex items-center justify-center shrink-0 ' + (i === 0 ? 'bg-brand-500 group-hover:bg-brand-600 text-white' : 'bg-gray-800 group-hover:bg-gray-700 text-gray-300')}>
                            <Download size={12} />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm text-gray-500">
                    <Link to="/login" className="text-brand-400 hover:text-brand-300">{t('comments.signIn')}</Link> {t('project.signInToDownload')}
                  </div>
                )}
              </div>
            )}

            {project.tags && project.tags.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3"><Tag size={14} /> {t('project.tags')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tg) => (
                    <Link key={tg} to={`/?tag=${encodeURIComponent(tg)}`} className="text-xs px-2.5 py-1 rounded-full bg-gray-800/80 hover:bg-gray-800 text-gray-300 border border-gray-800">#{tg}</Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4"><Users size={14} /> {t('project.developer')}</h3>
              <Link to={`/u/${project.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0"
                  style={authorAvatar ? undefined : { background: avatarGradient(project.author.username) }}>
                  {authorAvatar ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" /> : (project.author.displayName?.[0] || project.author.username[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-100 text-sm truncate">{project.author.displayName || project.author.username}</div>
                  <div className="text-xs text-gray-500">{t('project.developerMeta', { count: project.authorProjectCount ?? 0, year: joinedYear ?? '—' })}</div>
                </div>
              </Link>
              <Link to={`/u/${project.author.username}`} className="block text-center w-full mt-4 h-9 leading-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-200 font-medium transition-colors">{t('project.viewProfile')}</Link>
            </div>

            <div className="text-xs text-gray-600 space-y-1 px-1 font-mono">
              <div className="flex justify-between"><span>{t('project.metaPublished')}</span><span className="text-gray-400">{new Date(project.createdAt).toLocaleDateString(locale)}</span></div>
              <div className="flex justify-between"><span>{t('project.metaUpdated')}</span><span className="text-gray-400">{new Date(project.updatedAt).toLocaleDateString(locale)}</span></div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
