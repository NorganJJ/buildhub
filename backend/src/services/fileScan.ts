// Каркас антивирус-сканирования загружаемых файлов.
// Сейчас — заглушка (помечает файл 'clean'); реальный сканер подключается позже
// (ClamAV через clamd-сокет или VirusTotal API) переключателем SCAN_PROVIDER.
//
// Подключение реального сканера (пример):
//   SCAN_PROVIDER=clamav  + clamd на CLAMD_HOST:CLAMD_PORT
//   SCAN_PROVIDER=virustotal + VIRUSTOTAL_API_KEY
// и реализация соответствующей ветки ниже.

export type ScanStatus = 'pending' | 'clean' | 'infected'

export async function scanFile(_diskPath: string): Promise<ScanStatus> {
  const provider = process.env.SCAN_PROVIDER || 'none'
  switch (provider) {
    // case 'clamav': return await scanWithClamAV(_diskPath)
    // case 'virustotal': return await scanWithVirusTotal(_diskPath)
    case 'none':
    default:
      // Сканер не настроен — пропускаем как 'clean' (поведение как раньше).
      // Чтобы требовать обязательную проверку, измените default на 'pending'
      // и блокируйте скачивание файлов со статусом != 'clean'.
      return 'clean'
  }
}
