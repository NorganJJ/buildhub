# Changelog

All notable changes to BuildHub are documented here. / Все значимые изменения BuildHub.

## [1.0.0] — 2026-05-28

First stable release. / Первый стабильный релиз.

### Added · Добавлено
- **Admin role & moderation.** Users can be marked as administrators; an admin can edit and delete any project, edit/delete any comment, and delete any user account. Moderation controls surface in the UI (project page, comments) for admins. Create the admin with `npm run create-admin` (password supplied via `ADMIN_PASSWORD`).
  *Роль администратора и модерация.* Пользователя можно сделать администратором; админ может редактировать и удалять любой проект, редактировать/удалять любой комментарий и удалять любого пользователя. Элементы модерации появляются в интерфейсе (страница проекта, комментарии). Админ создаётся командой `npm run create-admin` (пароль — через `ADMIN_PASSWORD`).
- **Per-post upload limit.** All distributable files within a single post must total under **500 MB**; uploads beyond the cap are rejected.
  *Лимит на размер поста.* Суммарный размер всех дистрибутивов в одном посте не может превышать **500 МБ**; превышение отклоняется.

### Changed · Изменено
- **Clean start.** Demo/test users and projects were removed from the seed; a fresh deployment starts with an empty catalogue and a single admin account.
  *Чистый старт.* Демо/тестовые пользователи и проекты убраны из сидов; свежий деплой стартует с пустым каталогом и единственным аккаунтом администратора.
- **Migration baseline fixed.** All schema changes that were previously applied only via `db push` (file scan status, project versions, creator fields, admin flag) are now captured in a migration, so `prisma migrate deploy` builds the correct schema in production.
  *Исправлена база миграций.* Все изменения схемы, ранее применявшиеся только через `db push` (статус скана файлов, версии проектов, поля автора, флаг администратора), теперь зафиксированы в миграции — `prisma migrate deploy` корректно собирает схему в проде.

## [0.5.0] — 2026-05-27

First release aimed at public distribution — desktop installers + a deployable backend. / Первый релиз под публичное распространение — десктоп-инсталляторы и разворачиваемый бэкенд.

### Added · Добавлено
- **Desktop installer pipeline.** A GitHub Actions workflow builds the Tauri client for macOS and Windows on a runner matrix and attaches the installers to a release.
  *Конвейер сборки инсталляторов.* GitHub Actions собирает Tauri-клиент под macOS и Windows на matrix-раннерах и прикладывает инсталляторы к релизу.
- **Production deployment config.** `deploy/docker-compose.prod.yml` (PostgreSQL + API, no Redis, `restart: unless-stopped`, API bound to localhost behind nginx) plus `POSTGRES_*` in the production env template.
  *Конфигурация для прод-деплоя.* `deploy/docker-compose.prod.yml` (PostgreSQL + API, без Redis, `restart: unless-stopped`, API только на localhost за nginx) и переменные `POSTGRES_*` в шаблоне прод-окружения.

### Changed · Изменено
- **Desktop-aware CORS.** The API now accepts the packaged Tauri origins (`tauri://localhost`, `https://tauri.localhost`) alongside the web client origin(s) from `CLIENT_URL`.
  *CORS с учётом десктопа.* API принимает origin'ы установленного Tauri-приложения (`tauri://localhost`, `https://tauri.localhost`) наряду с web-клиентом из `CLIENT_URL`.
- **Cross-site auth cookies.** In production the refresh/OAuth cookies use `SameSite=None; Secure` so they survive cross-site requests from the desktop app (`Lax` is kept in development).
  *Cross-site auth-cookie.* В проде refresh/OAuth-cookie используют `SameSite=None; Secure`, чтобы доходить из десктоп-приложения (в dev остаётся `Lax`).

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
