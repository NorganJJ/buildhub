import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, AlertCircle, ThumbsUp, Package } from 'lucide-react'
import { useMyProjects, useDeleteProject, usePublishProject } from '../api/projects'
import { PROJECT_TYPE_ICONS } from '../types'
import toast from 'react-hot-toast'

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">{title}</h3>
              <p className="text-sm text-gray-400 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-900/60 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="h-9 px-3 rounded-md text-sm text-gray-300 hover:bg-gray-800">{t('myProjects.cancel')}</button>
          <button onClick={onConfirm} className="h-9 px-3.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium">{t('myProjects.delete')}</button>
        </div>
      </div>
    </div>
  )
}

export default function MyProjectsPage() {
  const { t } = useTranslation()
  const { data: projects, isLoading } = useMyProjects()
  const deleteProject = useDeleteProject()
  const publishProject = usePublishProject()
  const [confirmState, setConfirmState] = useState<{ id: string; title: string } | null>(null)

  const handleDeleteConfirm = async () => {
    if (!confirmState) return
    const { id } = confirmState
    setConfirmState(null)
    try { await deleteProject.mutateAsync(id); toast.success(t('myProjects.deleted')) }
    catch { toast.error(t('myProjects.deleteFailed')) }
  }
  const handlePublish = async (id: string) => {
    try { await publishProject.mutateAsync(id); toast.success(t('myProjects.published')) }
    catch { toast.error(t('myProjects.publishFailed')) }
  }

  const list = projects ?? []
  const published = list.filter((p) => p.status === 'PUBLISHED').length
  const drafts = list.length - published

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {confirmState && (
        <ConfirmDialog title={t('myProjects.deleteTitle')} message={t('myProjects.deleteMessage', { title: confirmState.title })}
          onConfirm={handleDeleteConfirm} onCancel={() => setConfirmState(null)} />
      )}

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-50 tracking-tight">{t('myProjects.title')}</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            {t('myProjects.sumProjects', { count: list.length })} · {t('myProjects.sumPublished', { count: published })}, {t('myProjects.sumDrafts', { count: drafts })}
          </p>
        </div>
        <Link to="/my-projects/new" className="h-10 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus size={14} /> {t('myProjects.newProject')}
        </Link>
      </div>

      {isLoading && <div className="text-gray-500 text-center py-12">{t('myProjects.loading')}</div>}

      {!isLoading && list.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">{t('myProjects.noProjects')}</p>
          <Link to="/my-projects/new" className="text-brand-400 hover:text-brand-300 text-sm">{t('myProjects.createFirst')}</Link>
        </div>
      )}

      {list.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-800 bg-gray-900/60">
            <div className="col-span-5">{t('myProjects.colProject')}</div>
            <div className="col-span-2">{t('myProjects.colStatus')}</div>
            <div className="col-span-3 hidden sm:block">{t('myProjects.colActivity')}</div>
            <div className="col-span-5 sm:col-span-2 text-right">{t('myProjects.colActions')}</div>
          </div>
          {list.map((p, i) => (
            <div key={p.id} className={'grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-800/30 transition-colors ' + (i < list.length - 1 ? 'border-b border-gray-800/60' : '')}>
              <div className="col-span-7 sm:col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-800 flex items-center justify-center text-xl shrink-0">{PROJECT_TYPE_ICONS[p.type]}</div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-100 truncate">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t(`projectType.${p.type}`)}</div>
                </div>
              </div>
              <div className="col-span-5 sm:col-span-2 order-3 sm:order-none mt-2 sm:mt-0">
                {p.status === 'PUBLISHED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-semibold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{t('myProjects.status_PUBLISHED')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[11px] font-semibold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{t('myProjects.status_DRAFT')}
                  </span>
                )}
              </div>
              <div className="col-span-3 text-sm text-gray-400 hidden sm:flex items-center gap-4">
                <span className="flex items-center gap-1"><ThumbsUp size={11} /> {p._count?.votes ?? 0}</span>
                <span className="flex items-center gap-1 text-gray-500"><Package size={11} /> {t('myProjects.filesCount', { count: p._count?.files ?? 0 })}</span>
              </div>
              <div className="col-span-5 sm:col-span-2 flex items-center gap-1 justify-end">
                {p.status === 'DRAFT' && (
                  <button onClick={() => handlePublish(p.id)} className="h-8 px-3 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 text-xs font-medium">{t('myProjects.publish')}</button>
                )}
                {p.status === 'PUBLISHED' && (
                  <Link to={`/project/${p.slug}`} className="h-8 px-3 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center">{t('myProjects.open')}</Link>
                )}
                <Link to={`/my-projects/${p.id}/edit`} className="w-8 h-8 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-200 flex items-center justify-center"><Edit size={13} /></Link>
                <button onClick={() => setConfirmState({ id: p.id, title: p.title })} className="w-8 h-8 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 flex items-center justify-center"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
