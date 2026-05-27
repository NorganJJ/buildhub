import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Tag, X, Check } from 'lucide-react'
import { useVersions, useCreateVersion, useUpdateVersion, useDeleteVersion } from '../../api/versions'
import { ProjectVersion } from '../../types'
import Markdown from '../Markdown'
import toast from 'react-hot-toast'

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-brand-500 text-sm"

function VersionEditRow({ projectId, version, onDone }: { projectId: string; version: ProjectVersion; onDone: () => void }) {
  const { t } = useTranslation()
  const [ver, setVer] = useState(version.version)
  const [notes, setNotes] = useState(version.notes)
  const update = useUpdateVersion(projectId)

  const save = async () => {
    if (!ver.trim() || !notes.trim()) return
    try {
      await update.mutateAsync({ id: version.id, version: ver.trim(), notes: notes.trim() })
      toast.success(t('versions.updated'))
      onDone()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('versions.updateFailed'))
    }
  }

  return (
    <div className="space-y-2 bg-gray-800/50 border border-gray-700 rounded-lg p-3">
      <input value={ver} onChange={(e) => setVer(e.target.value)} placeholder="1.0.0" className={inputClass} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className={`${inputClass} resize-y font-mono`} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
          <X size={12} /> {t('versions.cancel')}
        </button>
        <button type="button" onClick={save} disabled={!ver.trim() || !notes.trim() || update.isPending}
          className="flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
          <Check size={12} /> {update.isPending ? t('versions.saving') : t('versions.save')}
        </button>
      </div>
    </div>
  )
}

export default function VersionsManager({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useVersions(projectId)
  const versions = data?.versions ?? []
  const create = useCreateVersion(projectId)
  const deleteVersion = useDeleteVersion(projectId)

  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!version.trim() || !notes.trim()) return
    try {
      await create.mutateAsync({ version: version.trim(), notes: notes.trim() })
      toast.success(t('versions.added'))
      setVersion('')
      setNotes('')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('versions.addFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteVersion.mutateAsync(id)
      toast.success(t('versions.removed'))
    } catch { toast.error(t('versions.deleteFailed')) }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{t('versions.title')}</h2>

      {/* Add new version */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{t('versions.version')}</label>
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">{t('versions.releaseNotes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
            placeholder={t('versions.notesPlaceholder')}
            className={`${inputClass} resize-y font-mono`} />
          <p className="text-xs text-gray-600 mt-1">{t('versions.markdownHint')}</p>
        </div>
        <button type="button" onClick={handleAdd} disabled={!version.trim() || !notes.trim() || create.isPending}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> {create.isPending ? t('versions.adding') : t('versions.addVersion')}
        </button>
      </div>

      {/* Existing versions */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-600 text-sm">{t('versions.loading')}</div>
      ) : versions.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">{t('versions.noVersions')}</p>
      ) : (
        <div className="space-y-4 border-t border-gray-800 pt-4">
          {versions.map((v) => (
            <div key={v.id}>
              {editingId === v.id ? (
                <VersionEditRow projectId={projectId} version={v} onDone={() => setEditingId(null)} />
              ) : (
                <div className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/30 px-2.5 py-1 rounded-lg">
                        <Tag size={12} /> v{v.version}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleDateString(i18n.language)}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setEditingId(v.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                        <Pencil size={12} /> {t('versions.edit')}
                      </button>
                      <button type="button" onClick={() => handleDelete(v.id)} disabled={deleteVersion.isPending}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                        <Trash2 size={12} /> {t('versions.delete')}
                      </button>
                    </div>
                  </div>
                  <Markdown>{v.notes}</Markdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
