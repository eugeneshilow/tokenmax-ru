# AGENTS.md — tokmax

Отдельный репозиторий (международная тула, не РУ-монорепо `vibecoding-ru`).

**Сессии обычно стартуют из `vibecoding-ru`** — оттуда грузится полный `AGENTS.md`
(git-флоу, стиль доков, Правило Семи, размещение). Здесь это **не дублируем**:
универсальные правила берём из основного проекта. Этот файл — только tokmax-специфика
(и страховка, если сессию открыли прямо здесь).

## Что это
`npx tokmax` — CLI: считает API-equivalent $ по логам Codex + Claude Code и публикует на
лидерборд `tokmax.vibecoding.tech`. Стек: Next 16 / React 19 / TS / Tailwind / Convex;
CLI — Node, zero-dep. Карта проекта — [docs/README.md](docs/README.md).

## Правила tokmax
- **Интернейшнл-артефакт** (RU/EN-сплит): продукт глобальный, страница двуязычная; личный
  ру-бренд сюда не тащим.
- **`/api/tmx/publish` — публичный анонимный write-endpoint, security-sensitive.** Правки
  бережно (rate-limit / value-cap / анти-poisoning), защиту не ослаблять. 3 P1 из аудита —
  закрыть до публичного лонча.
- **Convex** — файлы snake_case; дев-деплой `chatty-boar-479`; прод-деплой = gate перед лончем.
- **Домены**: canonical `tokmax.vibecoding.tech` (Porkbun); редиректы `tokmax.ru` / `tokenmax.ru`
  (reg.ru). DNS правится по API.
- **Solo-репо**: можно коммитить прямо в `main` (без PR-церемонии), но код — через quality gate.
- **Доки** — `docs/` (4 слоя); решения — `docs/decision-log.md`.
