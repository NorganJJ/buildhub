import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import Navbar from './Navbar'
import { handleExternalClick } from '../../utils/openExternal'

const BOOSTY_URL = 'https://boosty.to/norganjj'

export default function Layout() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      {/* Полноширинный контейнер: каждая страница задаёт свой max-width/padding,
          чтобы полноэкранные баннеры (страница проекта) могли выходить за края. */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-gray-800 py-8 text-sm text-gray-600">
        <div className="flex items-center justify-center gap-3 flex-wrap px-4">
          <span>BuildHub © {new Date().getFullYear()}</span>
          <span className="text-gray-700">·</span>
          <a
            href={BOOSTY_URL}
            target="_blank"
            rel="noreferrer"
            onClick={handleExternalClick(BOOSTY_URL)}
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-brand-400 transition-colors"
          >
            <Heart size={13} className="text-brand-400" />
            {t('footer.support')}
          </a>
        </div>
      </footer>
    </div>
  )
}
