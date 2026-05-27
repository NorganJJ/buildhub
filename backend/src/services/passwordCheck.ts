import { createHash } from 'crypto'

// Проверка пароля по утечкам через HaveIBeenPwned (k-anonymity):
// наружу уходит только первые 5 символов SHA-1, сам пароль не передаётся.
// Fail-open: если сервис недоступен — не блокируем регистрацию.
export async function isPwnedPassword(password: string): Promise<boolean> {
  if (process.env.DISABLE_HIBP === 'true') return false
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'BuildHub' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return false
    const text = await res.text()
    for (const line of text.split('\n')) {
      const [hashSuffix, countStr] = line.trim().split(':')
      if (hashSuffix === suffix && parseInt(countStr || '0', 10) > 0) return true
    }
    return false
  } catch {
    return false // fail-open
  }
}
