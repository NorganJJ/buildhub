import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, Download } from 'lucide-react'
import { Project, PROJECT_TYPE_ICONS } from '../../types'
import { useVote } from '../../api/projects'
import { useAuthStore } from '../../stores/authStore'
import { mediaUrl } from '../../utils/mediaUrl'
import { bannerGradient } from '../../utils/gradient'
import toast from 'react-hot-toast'

interface Props { project: Project; onTagClick?: (tag: string) => void }

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function ProjectCard({ project, onTagClick }: Props) {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const vote = useVote()
  const likes = project.likes ?? 0
  const dislikes = project.dislikes ?? 0
  const userVote = project.userVote ?? null

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) { toast.error(t('project.signInToVote')); return }
    const newValue = userVote === value ? 0 : value
    vote.mutate({ projectId: project.id, value: newValue as any })
  }

  const bannerUrl = project.bannerUrl ? mediaUrl(project.bannerUrl) : null
  const iconUrl = project.iconUrl ? mediaUrl(project.iconUrl) : null

  return (
    <div className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors flex flex-col">
      <Link to={`/project/${project.slug}`} className="block h-32 relative overflow-hidden"
        style={bannerUrl ? undefined : { background: bannerGradient(project.id || project.slug) }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          : <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.3), transparent 50%)' }} />}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-[11px] text-white/90 font-medium">
          <span>{PROJECT_TYPE_ICONS[project.type]}</span>
          <span>{t(`projectType.${project.type}`)}</span>
        </div>
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-2xl overflow-hidden">
          {iconUrl ? <img src={iconUrl} alt="" className="w-full h-full object-cover" /> : PROJECT_TYPE_ICONS[project.type]}
        </div>
      </Link>
      <div className="p-4 pt-7 flex flex-col flex-1">
        <Link to={`/project/${project.slug}`} className="font-semibold text-gray-100 text-[15px] leading-tight truncate hover:text-brand-400 transition-colors">
          {project.title}
        </Link>
        <div className="text-xs text-gray-500 mt-0.5">
          {t('card.byLabel')}{' '}
          <Link to={`/u/${project.author.username}`} className="text-gray-400 hover:text-gray-200">
            {project.author.displayName || project.author.username}
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-2 leading-snug line-clamp-2 flex-1">{project.description}</p>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, 3).map((tag) =>
              onTagClick ? (
                <button key={tag} onClick={() => onTagClick(tag)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800/70 hover:bg-gray-800 text-gray-400 border border-gray-800 transition-colors">
                  #{tag}
                </button>
              ) : (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800/70 text-gray-400 border border-gray-800">#{tag}</span>
              )
            )}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800/70 text-xs text-gray-500">
          <button onClick={() => handleVote(1)}
            className={`flex items-center gap-1 transition-colors ${userVote === 1 ? 'text-green-400' : 'hover:text-green-400'}`}>
            <ThumbsUp size={12} /> <span className={userVote === 1 ? '' : 'text-gray-300'}>{compact(likes)}</span>
          </button>
          <button onClick={() => handleVote(-1)}
            className={`flex items-center gap-1 transition-colors ${userVote === -1 ? 'text-red-400' : 'hover:text-red-400'}`}>
            <ThumbsDown size={12} /> {compact(dislikes)}
          </button>
          <span className="flex items-center gap-1 ml-auto"><Download size={12} /> <span className="text-gray-300">{compact(project.downloadCount)}</span></span>
        </div>
      </div>
    </div>
  )
}
