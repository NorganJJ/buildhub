import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Globe, Github, Calendar } from 'lucide-react'
import ProjectCard from '../components/project/ProjectCard'
import { Project, ProfileStats } from '../types'
import { mediaUrl } from '../utils/mediaUrl'
import { avatarGradient } from '../utils/gradient'
import { handleExternalClick } from '../utils/openExternal'

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-100 tabular-nums">{n}</div>
      <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">{l}</div>
    </div>
  )
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { username } = useParams<{ username: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/projects/user/${username}`)
      return data as { user: any; projects: Project[]; stats?: ProfileStats }
    },
    enabled: !!username,
    staleTime: 0,
  })

  if (isLoading) return <div className="max-w-7xl mx-auto px-6 py-10 text-center text-gray-500">{t('profile.loading')}</div>
  if (isError || !data) return <div className="max-w-7xl mx-auto px-6 py-10 text-center text-red-400">{t('profile.notFound')}</div>

  const { user, projects, stats } = data
  const avatar = user.avatarUrl ? mediaUrl(user.avatarUrl) : null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #ec4899, transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-5xl font-bold shrink-0 overflow-hidden"
            style={avatar ? undefined : { background: avatarGradient(user.username) }}>
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (user.displayName?.[0] || user.username[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-50 tracking-tight">{user.displayName || user.username}</h1>
            <div className="text-gray-500 mt-0.5 font-mono text-sm">@{user.username}</div>
            {user.bio && <p className="text-gray-300 mt-3 max-w-xl leading-relaxed">{user.bio}</p>}
            <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
              {user.website && (
                <a href={user.website} target="_blank" rel="noreferrer" onClick={handleExternalClick(user.website)} className="text-gray-400 hover:text-brand-400 flex items-center gap-1.5"><Globe size={14} /> {t('profile.website')}</a>
              )}
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noreferrer" onClick={handleExternalClick(user.githubUrl)} className="text-gray-400 hover:text-brand-400 flex items-center gap-1.5"><Github size={14} /> {t('profile.github')}</a>
              )}
              <span className="text-gray-600 flex items-center gap-1.5"><Calendar size={14} /> {t('profile.joined', { date: new Date(user.createdAt).toLocaleDateString(i18n.language) })}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Stat n={String(stats?.projects ?? projects.length)} l={t('profile.statProjects', { count: stats?.projects ?? projects.length })} />
            <Stat n={compact(stats?.downloads ?? 0)} l={t('profile.statDownloads', { count: stats?.downloads ?? 0 })} />
            <Stat n={compact(stats?.upvotes ?? 0)} l={t('profile.statUpvotes', { count: stats?.upvotes ?? 0 })} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-gray-800">
        <span className="px-4 py-2.5 text-sm font-medium text-gray-100 border-b-2 border-brand-500 -mb-px">
          {t('profile.projectsHeading')} <span className="text-gray-500 ml-1">{projects.length}</span>
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('profile.noProjects')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
