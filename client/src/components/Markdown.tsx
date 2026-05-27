import React from 'react'
import { handleExternalClick } from './../utils/openExternal'

// Лёгкий безопасный markdown-рендерер: строит React-элементы (без dangerouslySetInnerHTML, нет XSS).
// Поддерживает: заголовки (#..###), списки (-, *, 1.), **жирный**, *курсив*, `код`, [ссылки](url).

// Инлайн-разбор одной строки в массив React-узлов
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Порядок важен: ссылка, код, жирный, курсив
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const key = `${keyPrefix}-${i++}`

    if (m[1]) {
      // [text](url) — рендерим только http(s)-ссылки, иначе как обычный текст
      const url = m[3]
      if (/^https?:\/\//i.test(url)) {
        nodes.push(
          <a key={key} href={url} target="_blank" rel="noreferrer noopener" onClick={handleExternalClick(url)}
            className="text-brand-400 hover:text-brand-300 underline">
            {m[2]}
          </a>
        )
      } else {
        nodes.push(m[2])
      }
    } else if (m[4]) {
      nodes.push(
        <code key={key} className="bg-gray-800 text-brand-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono">
          {m[5]}
        </code>
      )
    } else if (m[6]) {
      nodes.push(<strong key={key} className="font-semibold text-white">{m[7]}</strong>)
    } else if (m[8]) {
      nodes.push(<em key={key}>{m[9]}</em>)
    } else if (m[10]) {
      nodes.push(<em key={key}>{m[11]}</em>)
    }

    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function Markdown({ children, className = '' }: { children: string; className?: string }) {
  const lines = children.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Пустые строки — разделители
    if (line.trim() === '') { i++; continue }

    // Заголовки
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const content = parseInline(heading[2], `h${key}`)
      const cls = level === 1 ? 'text-lg font-bold text-white mt-2'
        : level === 2 ? 'text-base font-semibold text-white mt-2'
        : 'text-sm font-semibold text-gray-200 mt-1'
      blocks.push(level === 1
        ? <h3 key={key++} className={cls}>{content}</h3>
        : level === 2
        ? <h4 key={key++} className={cls}>{content}</h4>
        : <h5 key={key++} className={cls}>{content}</h5>)
      i++
      continue
    }

    // Маркированный список
    if (/^\s*[-*]\s+/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\s*[-*]\s+/, '')
        items.push(<li key={items.length}>{parseInline(text, `ul${key}-${items.length}`)}</li>)
        i++
      }
      blocks.push(<ul key={key++} className="list-disc list-inside space-y-1 text-gray-300">{items}</ul>)
      continue
    }

    // Нумерованный список
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\s*\d+\.\s+/, '')
        items.push(<li key={items.length}>{parseInline(text, `ol${key}-${items.length}`)}</li>)
        i++
      }
      blocks.push(<ol key={key++} className="list-decimal list-inside space-y-1 text-gray-300">{items}</ol>)
      continue
    }

    // Параграф — собираем подряд идущие непустые не-блочные строки
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="text-gray-300 leading-relaxed">
        {para.map((l, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {parseInline(l, `p${key}-${idx}`)}
          </React.Fragment>
        ))}
      </p>
    )
  }

  return <div className={`space-y-2 text-sm ${className}`}>{blocks}</div>
}
