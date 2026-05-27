import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { HelpCircle, X, Send, Copy, Check } from 'lucide-react'
import { openExternal } from '../../utils/openExternal'
import toast from 'react-hot-toast'

const TELEGRAM_HANDLE = '@NorganJJ'
const TELEGRAM_URL = 'https://t.me/NorganJJ'

export default function SupportButton() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Хэндл подставляется в шаблон, чтобы пользователь сразу видел, кому писать.
  const template = t('support.template', { handle: TELEGRAM_HANDLE })

  // Закрытие по Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template)
      setCopied(true)
      toast.success(t('support.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('support.copyFailed'))
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t('support.title')}
        className="w-9 h-9 rounded-lg hover:bg-gray-900 text-gray-400 hover:text-brand-400 flex items-center justify-center transition-colors">
        <HelpCircle size={16} />
      </button>

      {/* Через портал в body — иначе position:fixed привязывается к навбару (backdrop-blur). */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100 flex items-center gap-2"><HelpCircle size={16} className="text-brand-400" /> {t('support.title')}</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-md hover:bg-gray-800 text-gray-400 hover:text-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">{t('support.intro')}</p>

              <button
                onClick={() => openExternal(TELEGRAM_URL)}
                className="w-full h-11 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <Send size={15} /> {t('support.writeTelegram', { handle: TELEGRAM_HANDLE })}
              </button>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('support.templateLabel')}</span>
                  <button onClick={handleCopy} className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-gray-200">
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copied ? t('support.copied') : t('support.copy')}
                  </button>
                </div>
                <pre className="text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-lg p-3.5 whitespace-pre-wrap font-mono leading-relaxed">{template}</pre>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
