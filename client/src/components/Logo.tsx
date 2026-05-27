// Логотип BuildHub.
// Знак: 3 левовыровненные полоски в скруглённом квадрате (убывают кверху) —
// «отступ кода / стек релизов». Геометрия: радиус 25%, паддинг 22%.

interface MarkProps {
  size?: number
  bg?: string
  fg?: string
  radius?: number
  className?: string
  style?: React.CSSProperties
}

export function BuildHubMark({ size = 32, bg = '#4f6ef0', fg = '#fff', radius, className = '', style }: MarkProps) {
  const r = radius != null ? radius : size * 0.25
  const pad = size * 0.22
  const barH = size * 0.10
  const gap = size * 0.06
  const widths = [size - pad * 2, (size - pad * 2) * 0.72, (size - pad * 2) * 0.42]
  const totalH = barH * 3 + gap * 2
  const yStart = (size - totalH) / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width={size} height={size} rx={r} ry={r} fill={bg} />
      {widths.map((w, i) => {
        const y = yStart + (2 - i) * (barH + gap) // index 0 = нижняя (самая широкая)
        return <rect key={i} x={pad} y={y} width={w} height={barH} rx={barH / 2} ry={barH / 2} fill={fg} />
      })}
    </svg>
  )
}

interface LogoProps {
  size?: number
  color?: string
  accent?: string
  markBg?: string
  markFg?: string
  weight?: number
  gap?: number
  className?: string
}

// Горизонтальная связка: знак + словесная часть «Build» + акцентный «Hub»
export function BuildHubLogo({ size = 28, color = 'currentColor', accent = '#4f6ef0', markBg = '#4f6ef0', markFg = '#fff', weight = 600, gap = 8, className = '' }: LogoProps) {
  return (
    <span className={'inline-flex items-center ' + className} style={{ gap }}>
      <BuildHubMark size={size} bg={markBg} fg={markFg} />
      <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: weight, fontSize: size * 0.62, color, letterSpacing: '-0.01em', lineHeight: 1 }}>
        Build<span style={{ color: accent }}>Hub</span>
      </span>
    </span>
  )
}

export default BuildHubLogo
