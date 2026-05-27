# Changelog

All notable changes to BuildHub are documented here. / Все значимые изменения BuildHub.

## [0.4.9-beta] — 2026-05-27

### Security · Безопасность
- **Refresh tokens moved to an httpOnly cookie.** The refresh token is no longer exposed to JavaScript (XSS-resistant); it is stored in an `httpOnly`, `SameSite=Lax`, `Secure`-in-production cookie. Login responses now return only the user and a short-lived access token.
  *Refresh-токены перенесены в httpOnly cookie.* Refresh-токен больше недоступен из JavaScript (защита от XSS); хранится в `httpOnly`, `SameSite=Lax`, `Secure` (в проде) cookie. Ответ логина теперь содержит только пользователя и короткоживущий access-токен.
- **Signed download links.** Files are served via short-lived HMAC-signed URLs (TTL ~2 min) instead of a token in the query string; the link is validated without exposing JWTs.
  *Подписанные ссылки на скачивание.* Файлы отдаются по короткоживущим HMAC-ссылкам (TTL ~2 мин) вместо токена в URL; ссылка проверяется без раскрытия JWT.
- **Hardened HTTP layer.** Added `helmet` (HSTS, nosniff, no-referrer, frame protection), a 1 MB body limit, and per-route rate limits (stricter on auth endpoints).
  *Усиленный HTTP-слой.* Добавлены `helmet` (HSTS, nosniff, no-referrer, защита от фреймов), лимит тела 1 МБ и порутовые rate-limit (строже на auth-эндпоинтах).
- **OAuth CSRF protection.** The OAuth `state` is bound to an httpOnly cookie and validated on callback.
  *Защита OAuth от CSRF.* Параметр `state` привязан к httpOnly cookie и проверяется на callback.
- **Breached-password check (HIBP).** Passwords are checked against Have I Been Pwned via k-anonymity on register and reset (fail-open).
  *Проверка паролей на утечки (HIBP).* Пароли сверяются с Have I Been Pwned по k-анонимности при регистрации и сбросе (fail-open).
- **Tokens hashed at rest, safer errors, secret guard.** Email/reset tokens are stored as SHA-256 hashes; 5xx responses no longer leak internals; the app refuses to boot in production with weak or duplicate JWT secrets.
  *Хеширование токенов, безопасные ошибки, проверка секретов.* Токены подтверждения/сброса хранятся как SHA-256; ответы 5xx не раскрывают внутренности; в проде приложение не стартует со слабыми или одинаковыми JWT-секретами.
- **Upload validation.** Extension allow-list + magic-byte sniffing, with a malware-scan hook scaffolded for later integration.
  *Валидация загрузок.* Allow-list расширений и проверка magic-байтов, плюс каркас антивирусного скана для последующей интеграции.

### Added · Добавлено
- **Support button.** A help button in the navbar opens a dialog with a direct Telegram contact (@NorganJJ) and a copyable bug-report template.
  *Кнопка поддержки.* Кнопка помощи в навбаре открывает диалог с прямым контактом в Telegram (@NorganJJ) и копируемым шаблоном сообщения об ошибке.
- **Account deletion (GDPR).** Settings → Danger zone lets a user permanently delete their account, cascading projects/comments and cleaning up files on disk.
  *Удаление аккаунта (GDPR).* Настройки → Опасная зона позволяют безвозвратно удалить аккаунт с каскадным удалением проектов/комментариев и очисткой файлов на диске.
- **MIT license** and deployment-hardening templates: `Dockerfile.backend` (non-root), `nginx.conf` (TLS/HSTS/CSP), Dependabot config, `SECURITY.md`, and `.env.production.example`.
  *Лицензия MIT* и шаблоны для безопасного деплоя: `Dockerfile.backend` (non-root), `nginx.conf` (TLS/HSTS/CSP), конфиг Dependabot, `SECURITY.md` и `.env.production.example`.

## [0.4.5-beta] — 2026-05-26

### Added / Добавлено
- **Light theme with a switcher.** A full light/white theme alongside the existing dark theme; toggle in **Settings → Appearance**. Dark remains the default. The choice is saved (localStorage) and works in both the web and the Tauri desktop build, with no flash on load.
  *Светлая тема и переключатель.* Полноценная светлая тема рядом с тёмной; переключатель в **Настройки → Оформление**. Тёмная остаётся по умолчанию. Выбор сохраняется и работает и в web, и в десктоп-версии (Tauri), без мигания при загрузке.

### Changed / Security · Изменено / Безопасность
- **Downloads now require authentication.** Distributable files are served only through an authenticated endpoint (stream, not redirect); the direct static-link bypass is closed; guests see a “sign in to download” prompt. Images stay public. (Voting and commenting already required auth.)
  *Скачивание теперь требует авторизации.* Файлы-дистрибутивы отдаются только через авторизованный эндпоинт (стрим, не редирект); прямой доступ по статической ссылке закрыт; гостям показывается приглашение войти. Картинки остаются публичными. (Голосование и комментарии уже требовали авторизации.)

### Fixed / Исправлено
- **Catalogue ranking is now deterministic.** Projects with equal Wilson score (e.g. all zero-vote posts) are ordered by date as a stable tiebreaker, so a like reliably ranks a project above zero-vote ones and voting no longer randomly reshuffles ties.
  *Ранжирование каталога стало детерминированным.* Проекты с одинаковым Wilson score (например, все без голосов) упорядочиваются по дате как стабильный вторичный ключ — лайк гарантированно поднимает проект выше «нулевых», и голосование больше не перетасовывает ничьи случайно.
- Minor i18n pluralization fixes for counters and removal of React Router deprecation warnings.
  *Мелкие правки плюрализации счётчиков и устранение предупреждений React Router.*

## [0.4.3-beta] — previous release / предыдущий релиз

Baseline that the 0.4.5-beta changes build on:
- Rebrand to **BuildHub** (logo, app icons, favicon).
- Full UI redesign (catalogue with hero & category sections, project pages, profiles, table-style “My projects”, settings).
- Project **versioning / changelog**, threaded **comments**, **votes** (Wilson score), creator attribution.
- **Search** with field scope (name / tags / description) and category sections.
- **i18n** in 5 languages (English, Русский, Deutsch, Français, 中文).
- Email verification required before login; GitHub & Google OAuth.
- Boosty support links.
