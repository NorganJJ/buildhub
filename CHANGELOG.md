# Changelog

All notable changes to BuildHub are documented here. / Все значимые изменения BuildHub.

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
