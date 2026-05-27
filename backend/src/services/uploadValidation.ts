// Валидация загружаемых файлов-дистрибутивов: allowlist расширений + базовая
// проверка сигнатуры (magic bytes), чтобы отсечь явно неподходящее/подменённое.

const ALLOWED_EXT = new Set([
  'dmg', 'pkg',                 // macOS
  'exe', 'msi',                 // Windows
  'apk', 'aab',                 // Android
  'deb', 'rpm', 'appimage',     // Linux
  'zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', // archives
  'jar', 'whl', 'gem', 'nupkg', // packages
  'ipa',                        // iOS
  'bin', 'run', 'sh',           // generic installers/scripts
])

export function extOf(filename: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

export function isAllowedExtension(filename: string): boolean {
  // tar.gz → проверяем последнее расширение (gz), оно в списке
  return ALLOWED_EXT.has(extOf(filename))
}

// Проверка по первым байтам: явно опасные/неуместные форматы режем.
// (HTML/SVG/скрипты, выдающие себя за бинарь, и т.п. отсекаются заранее по ext,
//  здесь — защита от подмены контента.)
const DENY_SIGNATURES: { name: string; bytes: number[] }[] = [
  { name: 'html', bytes: [0x3c, 0x21, 0x44, 0x4f, 0x43] }, // <!DOC
  { name: 'html', bytes: [0x3c, 0x68, 0x74, 0x6d, 0x6c] }, // <html
  { name: 'svg/xml', bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c] }, // <?xml
]

export function looksDisallowedByMagic(head: Buffer): boolean {
  for (const sig of DENY_SIGNATURES) {
    if (head.length >= sig.bytes.length && sig.bytes.every((b, i) => head[i] === b)) return true
  }
  return false
}
