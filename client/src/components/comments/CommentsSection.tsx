import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Reply, Pencil, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment, Comment } from '../../api/comments'
import { useAuthStore } from '../../stores/authStore'
import { mediaUrl } from '../../utils/mediaUrl'
import { avatarGradient } from '../../utils/gradient'
import toast from 'react-hot-toast'

function Avatar({ author }: { author: Comment['author'] }) {
  if (!author) return <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0" />
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden"
      style={author.avatarUrl ? undefined : { background: avatarGradient(author.username) }}>
      {author.avatarUrl
        ? <img src={mediaUrl(author.avatarUrl)!} alt="" className="w-full h-full object-cover" />
        : (author.displayName?.[0] || author.username[0]).toUpperCase()
      }
    </div>
  )
}

function EditForm({ projectId, commentId, initialValue, onSuccess, onCancel }: {
  projectId: string; commentId: string; initialValue: string
  onSuccess: () => void; onCancel: () => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState(initialValue)
  const update = useUpdateComment(projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await update.mutateAsync({ id: commentId, body: text.trim() })
      onSuccess()
    } catch { toast.error(t('comments.updateFailed')) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} autoFocus
        className="w-full bg-gray-800 border border-brand-500 text-white text-sm px-3 py-2 rounded-lg resize-none focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any) }}
      />
      <div className="flex gap-2 mt-1.5 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">{t('comments.cancel')}</button>
        <button type="submit" disabled={!text.trim() || update.isPending}
          className="flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
          <Send size={12} /> {update.isPending ? t('comments.saving') : t('comments.save')}
        </button>
      </div>
    </form>
  )
}

function NewCommentForm({ projectId, parentId, placeholder, submitLabel, onSuccess, onCancel }: {
  projectId: string; parentId?: string; placeholder?: string; submitLabel?: string
  onSuccess?: () => void; onCancel?: () => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const create = useCreateComment(projectId)
  const user = useAuthStore((s) => s.user)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await create.mutateAsync({ body: text.trim(), parentId })
      setText('')
      onSuccess?.()
    } catch { toast.error(t('comments.postFailed')) }
  }

  return (
    <div className="flex gap-3">
      <Avatar author={user ? { id: user.id, username: user.username, displayName: user.displayName ?? null, avatarUrl: user.avatarUrl ?? null } : null} />
      <form onSubmit={handleSubmit} className="flex-1">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder ?? t('comments.writePlaceholder')}
          rows={2} maxLength={2000}
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white text-sm px-3 py-2 rounded-lg resize-none focus:outline-none placeholder-gray-500 transition-colors"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any) }}
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-600">{t('comments.submitHint', { count: text.length })}</span>
          <div className="flex gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">{t('comments.cancel')}</button>
            )}
            <button type="submit" disabled={!text.trim() || create.isPending}
              className="flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Send size={12} /> {create.isPending ? t('comments.posting') : (submitLabel ?? t('comments.postShort'))}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function timeAgo(dateStr: string, t: (k: string, o?: any) => string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return t('comments.daysAgo', { count: d })
  if (h > 0) return t('comments.hoursAgo', { count: h })
  if (m > 0) return t('comments.minutesAgo', { count: m })
  return t('comments.justNow')
}

function CommentItem({ comment, projectId, depth = 0 }: { comment: Comment; projectId: string; depth?: number }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const deleteComment = useDeleteComment(projectId)
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isOwn = user?.id === comment.authorId
  const isDeleted = comment.isDeleted
  const hasReplies = comment.replies.length > 0
  const MAX_DEPTH = 4

  const handleDelete = async () => {
    try { await deleteComment.mutateAsync(comment.id) }
    catch { toast.error(t('comments.deleteFailed')) }
  }

  const isEdited = comment.updatedAt !== comment.createdAt

  return (
    <div className={depth > 0 ? 'border-l-2 border-gray-800 pl-4' : ''}>
      <div className="flex gap-3 group">
        <Avatar author={comment.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {comment.author && !isDeleted
              ? <Link to={`/u/${comment.author.username}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                  {comment.author.displayName || comment.author.username}
                </Link>
              : <span className="text-sm text-gray-600">{t('comments.deleted')}</span>
            }
            <span className="text-xs text-gray-600">{timeAgo(comment.createdAt, t)}</span>
            {isEdited && !isDeleted && <span className="text-xs text-gray-700 italic">{t('comments.edited')}</span>}
          </div>

          {editing ? (
            <EditForm projectId={projectId} commentId={comment.id} initialValue={comment.body}
              onSuccess={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isDeleted ? 'text-gray-600 italic' : 'text-gray-300'}`}>
              {isDeleted ? t('comments.deleted') : comment.body}
            </p>
          )}

          {!editing && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {isAuthenticated && !isDeleted && (
                <button onClick={() => setReplying((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-400 px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                  <Reply size={12} /> {t('comments.reply')}
                </button>
              )}
              {isOwn && !isDeleted && (
                <>
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                    <Pencil size={12} /> {t('comments.edit')}
                  </button>
                  <button onClick={handleDelete} disabled={deleteComment.isPending}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                    <Trash2 size={12} /> {t('comments.delete')}
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <NewCommentForm projectId={projectId} parentId={comment.id}
                placeholder={t('comments.replyPlaceholder', { name: comment.author?.username ?? '' })}
                submitLabel={t('comments.reply')}
                onSuccess={() => { setReplying(false); setShowReplies(true) }}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {hasReplies && (
        <div className="mt-3 ml-11">
          <button onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mb-3 transition-colors">
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showReplies
              ? t('comments.hideReplies', { count: comment.replies.length })
              : t('comments.showReplies', { count: comment.replies.length })}
          </button>
          {showReplies && (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} projectId={projectId} depth={Math.min(depth + 1, MAX_DEPTH)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommentsSection({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useComments(projectId)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const comments = data?.comments ?? []
  const total = data?.total ?? 0

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <MessageSquare size={14} />
        {t('comments.title')}
        {total > 0 && <><span className="text-gray-700">·</span> <span className="text-gray-600 font-normal normal-case tracking-normal">{total}</span></>}
      </h2>

      {isAuthenticated ? (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4 focus-within:border-gray-700">
          <NewCommentForm projectId={projectId} placeholder={t('comments.placeholder')} submitLabel={t('comments.post')} />
        </div>
      ) : (
        <div className="mb-6 text-center py-4 bg-gray-800/50 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-brand-400 hover:text-brand-300">{t('comments.signIn')}</Link>{' '}{t('comments.signInPrompt')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-600 text-sm">{t('comments.loading')}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">{t('comments.empty')}</div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} projectId={projectId} />
          ))}
        </div>
      )}
    </section>
  )
}
