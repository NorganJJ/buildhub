import { useTranslation } from 'react-i18next'
import { Calendar } from 'lucide-react'
import { useVersions } from '../../api/versions'
import Markdown from '../Markdown'

export default function ChangelogSection({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useVersions(projectId)
  const versions = data?.versions ?? []

  if (isLoading) return <div className="text-center py-4 text-gray-600 text-sm">{t('changelog.loading')}</div>
  if (versions.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        {t('changelog.title')} <span className="text-gray-700">·</span> <span className="text-gray-600 font-normal normal-case tracking-normal">{versions.length}</span>
      </h2>
      <div className="space-y-4">
        {versions.map((v, idx) => (
          <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-sm font-semibold text-brand-300 bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">v{v.version}</span>
              {idx === 0 && <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">{t('changelog.latest')}</span>}
              <span className="text-xs text-gray-500 ml-auto flex items-center gap-1"><Calendar size={11} /> {new Date(v.createdAt).toLocaleDateString(i18n.language)}</span>
            </div>
            <div className="font-mono text-[13px]"><Markdown>{v.notes}</Markdown></div>
          </div>
        ))}
      </div>
    </section>
  )
}
