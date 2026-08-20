# Визуальные наблюдения: Open Finish

Проверено 2026-08-20 на опубликованном Worker `open-finish-cloudflare.dgt-saunin.workers.dev`.

## Dashboard

- Текущая навигация понятна: основная группа Orientation, Long view и две компактные второстепенные вкладки Alerts/Profile в нижней части.
- Dashboard показывает hero, дневной итог, Energy invested, weekly chart, sessions, return cue и context link.
- Фоновая иллюстрация занимает значительную часть рабочей области. Она создаёт характер, но снижает контраст мелкого вторичного текста и усложняет восприятие data-dense секций.
- На ширине браузерного viewport около 877 px hero-title переносится на несколько строк. Нужны промежуточные responsive breakpoints между tablet и desktop, а не только lg-переключение.
- В weekly summary есть понятные доступные текстовые данные и таблица, это хорошая основа для accessibility.

## Activities

- Экран Activities содержит 8 видимых activity cards, сетка на текущем viewport превращается в три колонки и одну неполную строку.
- На карточках одновременно присутствуют: type chip, category, description, target, edit и delete. Это даёт хорошую функциональность, но маленькие action-icons слабо различимы на тёмном фоне и опасный delete находится слишком близко к edit.
- Заголовки названий длинных activities обрезаются до `Programmin...` и `Work on pro...`; нужен перенос/двухстрочная линия или адаптивная сетка.
- Новый Activity CTA заметен и последователен с визуальным языком приложения.

## Публичность

- Статические страницы и /api доступны без аутентификации. В интерфейсе показано `Sign out`, хотя сессионная защита ранее удалена; это вводит пользователя в заблуждение и не защищает доступ.

## History

- Страница визуально структурирована логично: period toggle, KPI cards, timeline, sport lane, activity legend и day details.
- На текущей ширине overview card Most active обрезает название `Work on proj...`; короткие KPI cards не имеют одинакового допустимого объёма текста.
- Timeline предлагает доступные кнопки по каждому дню с понятными aria/hint-описаниями, что положительно.
- Большой график отображает много пустых дат одинакового визуального веса; для данных с редкой активностью полезны adaptive range, collapsed quiet days или более мягкое снижение визуального контраста пустых столбцов.

## Reflections

- При переходе на Reflections браузерный снимок остаётся в визуальном loading/skeleton-состоянии и extracted markdown почти пуст.
- Это может быть кратковременная загрузка, но как UX-риск требует явного timeout/error state и проверки, что запрос к /api/reflections не зависает или не блокирует видимый экран.

## Подтверждённый runtime-сбой Reflections

Проверка без чтения тел ответов показала, что `GET /api/evidence-shelf` и `GET /api/weekly-reflections` возвращают HTTP 500. В одном последовательном прогоне `GET /api/reflections` также превысил 12-секундный timeout. При этом `/api/activities` и `/api/calendar` отвечают 200. Поскольку Reflections считает ошибкой любой сбой reflections, activities, evidence shelf или weekly reflections, наблюдаемое error state воспроизводимо и является P0-функциональным дефектом.

## Neon schema check — 2026-08-20

Neon Console доступна в авторизованной веб-сессии для проекта `neon-emerald-jacket`, ветка `main` (`br-crimson-base-auy8461n`). Интерфейс Tables после загрузки показывает выбранную базу `neondb`; следовательно, перед миграцией нельзя предполагать, что имя database равно `open_finish_recovery`. Neon MCP-коннектор в этой сессии вернул HTTP 401, поэтому проверка продолжается через Console. Данные не изменялись.

Проверка списка databases в Neon подтвердила две базы на production-ветке: `neondb` (старее, содержит несвязанные auth/course-таблицы) и `open_finish_recovery` (создана накануне). Все дальнейшие schema-проверки и потенциальная миграция должны быть строго направлены в `open_finish_recovery`, а не в default `neondb`.

Проверка `open_finish_recovery` в Neon Console завершена. В public schema присутствуют `achievements`, `activities`, `activity_logs`, `alerts`, `daily_contexts`, `profiles`, `streaks`; таблицы `evidence_shelf` и `weekly_reflections` отсутствуют. Это подтверждает причину HTTP 500 на соответствующих API. Базовые данные не удалялись и не изменялись.

Перед запуском подтверждённой migration-query SQL Editor по ошибке открыл старую сохранённую history-query `ALTER SEQUENCE activities_id_seq RESTART WITH 10`; кнопка Run для неё не нажималась, поэтому данные и последовательности не изменялись. Затем подтверждённая idempotent migration-query была восстановлена в редакторе для корректного запуска.

После отдельного подтверждения пользователя idempotent migration-query для `evidence_shelf` и `weekly_reflections` была отправлена через кнопку Run активного SQL Editor базы `open_finish_recovery`. Ожидается результат выполнения; до его проверки никаких иных SQL-команд не выполняется.

Neon SQL Editor сообщил `Statement executed successfully` для migration-query (560 ms; CREATE/DO operations). В его UI одновременно отображён внутренний пункт `7: ERROR`, хотя в query шесть целевых DDL-операций и итоговый статус успешный. Перед любым следующим изменением будет выполнена только read-only проверка наличия обеих таблиц и их API-ответов.

Read-only verification в Neon SQL Editor на `open_finish_recovery` вернула ровно две строки: `evidence_shelf` и `weekly_reflections`. Следовательно, миграция создала обе необходимые continuity-таблицы в правильной production-базе. Проверка не изменяла данных.

## Cloudflare secret recovery note — 2026-08-20

- Runtime diagnostic returned only boolean flags: `DATABASE_URL` is present, while `ADMIN_PASSWORD` is absent. No secret values were retrieved from Cloudflare.
- Worker version metadata lists both secret binding names, so the password issue is limited to the effective `ADMIN_PASSWORD` value rather than its name or database binding.
- The Cloudflare Dashboard variables page redirected to the login screen and displayed `There was a problem with verification. Please reload and try again`, so it is not a reliable manual recovery path from the sandbox session.
- Temporary local JSON payload files used for direct API attempts were removed immediately after each operation and were outside the Git repository.

## Password gate verification — 2026-08-20

Published Open Finish now renders a dedicated neutral password screen before any dashboard content. The screen identifies the workspace as private, has one password field and one enter action, and does not reveal activities, sessions, or notes before authentication.

Authenticated production verification completed successfully. The password form opened the Dashboard and exposed personal data only after session creation. Reflections now loads as a deliberately light `Session notes` page with a search field, direction filter, clear optionality wording, and a stable empty state (`0 notes kept from completed sessions`); the former HTTP 500 error state is no longer visible.
