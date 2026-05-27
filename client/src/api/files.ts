import { api, API_URL } from './client'

// Запрашивает короткоживущую подписанную ссылку на скачивание (HMAC, TTL ~2 мин)
// и возвращает абсолютный URL. Сам эндпоинт скачивания не требует токена —
// доступ подтверждается подписью, поэтому ссылку нельзя расшарить надолго.
export async function getDownloadUrl(fileId: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/files/${fileId}/download-link`)
  return data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`
}
