<div align="center">

# BuildHub

**A catalogue platform where developers publish and discover apps — web, mobile and desktop — and ship installers without an app store.**

*Каталог-платформа, где разработчики публикуют и находят приложения (веб, мобильные, десктоп) и распространяют установщики без магазина приложений.*

Fastify · Prisma · PostgreSQL · React · Vite · Tauri · Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🇬🇧 English

### Overview

BuildHub lets developers create project pages, upload platform installers, keep a per‑version changelog, and get feedback through votes and threaded comments. It ships as a web app and as a native desktop app (Tauri) from the same React codebase.

### Features

- **Project catalogue** — hero, category sections (Popular / New / Most downloaded), search with field scope (name / tags / description), type filters with live counts, sorting and pagination.
- **Project pages** — gradient banner, screenshots, markdown description, downloads per platform, tags, developer card.
- **Versioning / changelog** — structured releases with markdown notes; "New" = published within the last 7 days, ranked by Wilson score.
- **Comments** — threaded replies, edit/delete, soft‑delete that preserves threads.
- **Voting** — like / dislike with Wilson‑score ranking.
- **Authorship** — credit a real creator when you re‑publish someone else's project.
- **Auth** — email/password with **mandatory email verification before login**, plus GitHub & Google OAuth, password reset.
- **Profiles** — avatar, bio, links, aggregate stats (projects / downloads / upvotes).
- **i18n** — full UI localization in 5 languages (English, Русский, Deutsch, Français, 中文) with CLDR pluralization; language switch in Settings.
- **External links** open in the system browser in both web and desktop (Tauri shell).

### Tech stack

| Layer | Stack |
|---|---|
| Backend | Node.js + TypeScript, Fastify, Prisma, PostgreSQL, Redis, JWT, Zod, Swagger |
| Frontend | React 18 + TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, react‑i18next, lucide‑react |
| Desktop | Tauri 2 (Rust shell) |
| Infra | Docker Compose (PostgreSQL + Redis) |

### Requirements

- Node.js 20+
- Docker Desktop
- Rust (only for the Tauri desktop build)

### Getting started

```bash
# 1. Database (PostgreSQL on port 5433 + Redis)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env          # fill in secrets (JWT, OAuth, Resend...)
npm install
npm run db:generate           # generate Prisma client
npm run db:push               # apply schema
npm run db:seed               # optional demo data
npm run dev                   # http://localhost:3001  (Swagger: /docs)

# 3. Client (new terminal)
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:3001
npm install
npm run dev                   # http://localhost:1420
```

Demo accounts after seeding: `demo@buildhub.app` / `jane@buildhub.app` — password `password123`.

#### Desktop app (Tauri)

```bash
cd client
npm run tauri:dev     # run as a native window
npm run tauri:build   # build installers (.dmg / .msi / .AppImage)
```

### Project structure

```
buildhub/
├── docker-compose.yml          # PostgreSQL + Redis
├── backend/                    # Fastify + TypeScript API
│   ├── prisma/schema.prisma    # database schema
│   └── src/
│       ├── routes/             # auth, projects, comments, versions, votes, files, users, images
│       ├── services/           # tokens, email, oauth, wilsonScore
│       └── middleware/         # auth, error handling
└── client/                     # React + Vite + Tauri
    ├── src/
    │   ├── pages/              # catalogue, project, profile, auth, settings, ...
    │   ├── components/         # Navbar, ProjectCard, Comments, Changelog, Logo, ...
    │   ├── api/                # axios + React Query hooks
    │   ├── i18n/               # locales en/ru/de/fr/zh
    │   └── stores/             # Zustand auth store
    └── src-tauri/              # Rust / Tauri shell + app icons
```

### Environment

Backend config lives in `backend/.env` (see `backend/.env.example`): database URL, JWT secrets, file storage, SMTP / Resend for verification emails, GitHub & Google OAuth credentials, CORS client URL. The client reads `VITE_API_URL` from `client/.env`.

> Secrets are never committed — `.env` is git‑ignored; only `.env.example` templates are tracked.

### Support

If BuildHub is useful to you, you can support development on [Boosty](https://boosty.to/norganjj). 💜

---

## 🇷🇺 Русский

### Описание

BuildHub позволяет разработчикам создавать страницы проектов, загружать установщики под разные платформы, вести changelog по версиям и получать обратную связь через голоса и древовидные комментарии. Поставляется как веб‑приложение и как нативное десктоп‑приложение (Tauri) из одной кодовой базы React.

### Возможности

- **Каталог проектов** — hero, секции (Популярные / Новинки / Больше всего скачиваний), поиск с выбором области (название / теги / описание), фильтры по типу со счётчиками, сортировка и пагинация.
- **Страницы проектов** — градиентный баннер, скриншоты, markdown‑описание, загрузки по платформам, теги, карточка разработчика.
- **Версионирование / changelog** — структурированные релизы с markdown‑заметками; «Новинки» = опубликованные за последние 7 дней, ранжирование по Wilson score.
- **Комментарии** — ветки ответов, редактирование/удаление с сохранением структуры веток.
- **Голосование** — лайк / дизлайк с ранжированием по Wilson score.
- **Авторство** — указание настоящего создателя, если публикуешь чужой проект.
- **Аутентификация** — email/пароль с **обязательным подтверждением почты перед входом**, GitHub и Google OAuth, сброс пароля.
- **Профили** — аватар, био, ссылки, сводная статистика (проекты / загрузки / лайки).
- **Локализация** — полный интерфейс на 5 языках (English, Русский, Deutsch, Français, 中文) с правильной плюрализацией; переключатель языка в настройках.
- **Внешние ссылки** открываются в системном браузере и в вебе, и в десктоп‑версии (Tauri shell).

### Технологии

| Слой | Стек |
|---|---|
| Бэкенд | Node.js + TypeScript, Fastify, Prisma, PostgreSQL, Redis, JWT, Zod, Swagger |
| Фронтенд | React 18 + TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, react‑i18next, lucide‑react |
| Десктоп | Tauri 2 (Rust) |
| Инфраструктура | Docker Compose (PostgreSQL + Redis) |

### Требования

- Node.js 20+
- Docker Desktop
- Rust (только для сборки десктоп‑версии Tauri)

### Быстрый старт

```bash
# 1. База данных (PostgreSQL на порту 5433 + Redis)
docker compose up -d

# 2. Бэкенд
cd backend
cp .env.example .env          # заполни секреты (JWT, OAuth, Resend...)
npm install
npm run db:generate           # генерация Prisma‑клиента
npm run db:push               # применение схемы
npm run db:seed               # опционально: демо‑данные
npm run dev                   # http://localhost:3001  (Swagger: /docs)

# 3. Клиент (новый терминал)
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:3001
npm install
npm run dev                   # http://localhost:1420
```

Демо‑аккаунты после сидинга: `demo@buildhub.app` / `jane@buildhub.app` — пароль `password123`.

#### Десктоп‑приложение (Tauri)

```bash
cd client
npm run tauri:dev     # запуск в нативном окне
npm run tauri:build   # сборка установщиков (.dmg / .msi / .AppImage)
```

### Структура проекта

См. дерево в английской секции выше — бэкенд (`backend/`, Fastify + Prisma) и клиент (`client/`, React + Vite + Tauri), база поднимается через `docker-compose.yml`.

### Окружение

Конфигурация бэкенда — в `backend/.env` (шаблон `backend/.env.example`): строка подключения к БД, JWT‑секреты, хранилище файлов, SMTP / Resend для писем подтверждения, GitHub и Google OAuth, URL клиента для CORS. Клиент читает `VITE_API_URL` из `client/.env`.

> Секреты не коммитятся: `.env` в `.gitignore`, в репозитории только шаблоны `.env.example`.

### Поддержать

Если BuildHub оказался полезен — поддержать разработку можно на [Boosty](https://boosty.to/norganjj). 💜

### Лицензия

Проект распространяется под лицензией [MIT](LICENSE) © 2026 NorganJJ.
