import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { logout } from '../../api/auth'
import { Plus, LogOut, Settings, Heart } from 'lucide-react'
import { BuildHubLogo } from '../Logo'
import { avatarGradient } from '../../utils/gradient'
import { mediaUrl } from '../../utils/mediaUrl'
import { handleExternalClick } from '../../utils/openExternal'
import SupportButton from './SupportButton'
import toast from 'react-hot-toast'

const BOOSTY_URL = 'https://boosty.to/norganjj'

export default function Navbar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success(t('nav.loggedOut'))
    navigate('/')
  }

  const avatarSrc = user?.avatarUrl ? mediaUrl(user.avatarUrl) : null
  const initial = (user?.displayName?.[0] || user?.username?.[0] || 'U').toUpperCase()

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-gray-950/80 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center group text-gray-100">
          <BuildHubLogo size={28} />
        </Link>
        <nav className="hidden sm:flex items-center gap-1 ml-2">
          <Link to="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 rounded-md hover:bg-gray-900 transition-colors">
            {t('nav.catalogue')}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SupportButton />
          <a href={BOOSTY_URL} target="_blank" rel="noreferrer" onClick={handleExternalClick(BOOSTY_URL)}
            title={t('footer.support')}
            className="w-9 h-9 rounded-lg hover:bg-gray-900 text-gray-400 hover:text-brand-400 flex items-center justify-center transition-colors">
            <Heart size={16} />
          </a>
          {isAuthenticated ? (
            <>
              <Link to="/my-projects/new"
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
                <Plus size={14} /> <span className="hidden sm:inline">{t('nav.newProject')}</span>
              </Link>
              <Link to="/my-projects"
                className="h-9 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 text-sm flex items-center transition-colors">
                {t('nav.myProjects')}
              </Link>
              <div className="w-px h-6 bg-gray-800 mx-1" />
              <Link to={`/u/${user?.username}`}
                className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full hover:bg-gray-900 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden flex-shrink-0"
                  style={avatarSrc ? undefined : { background: avatarGradient(user?.username || 'u') }}>
                  {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : initial}
                </div>
                <span className="hidden sm:inline text-sm text-gray-200">{user?.displayName || user?.username}</span>
              </Link>
              <Link to="/settings"
                className="w-9 h-9 rounded-lg hover:bg-gray-900 text-gray-400 hover:text-gray-200 flex items-center justify-center transition-colors"
                title={t('nav.settings')}>
                <Settings size={16} />
              </Link>
              <button onClick={handleLogout}
                className="w-9 h-9 rounded-lg hover:bg-gray-900 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                title={t('nav.logout')}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="h-9 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 text-sm flex items-center transition-colors">{t('nav.signIn')}</Link>
              <Link to="/register" className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium flex items-center transition-colors">{t('nav.signUp')}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
