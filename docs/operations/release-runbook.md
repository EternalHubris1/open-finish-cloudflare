# Eternal Dodjo — Release Runbook

## Назначение

Этот документ задаёт операционный чек-лист для релиза приватного Worker-приложения Open Finish / Eternal Dodjo. Он **не создаёт, не мигрирует, не очищает и не удаляет** данные Neon. Worker продолжает работать с текущим production-подключением к базе.

## Обязательные release-контроли

| Контроль | Ожидаемое состояние | Проверка |
|---|---|---|
| Dependency lock | Точный граф пакетов устанавливается | `pnpm install --frozen-lockfile` |
| Качество кода | TypeScript проходит во всех workspace | `pnpm run typecheck` |
| Ключевая функциональность | Проходят тесты auth, calendar, achievements и continuity | `pnpm --filter @workspace/api-server test` |
| Build output | Worker assets собираются успешно | `pnpm run build` |
| Приватность API | Анонимный запрос к `/api/dashboard` получает `401` | Инкогнито или `curl -I` |
| Заголовки | API содержит `Cache-Control: no-store` и `X-Frame-Options: DENY` | Проверка response headers |

Workflow `.github/workflows/quality.yml` запускает первые четыре контроля для каждого pull request и push в `main`.

## Secrets и конфигурация

Реальные значения secrets всегда остаются вне Git. Worker требует `DATABASE_URL` и `ADMIN_PASSWORD`. Для релиза необходимо дополнительно завести отдельный высокоэнтропийный `SESSION_SECRET` как Worker secret. Пока он не установлен, приложение сохраняет совместимость и использует пароль для подписи сессии; независимый secret всё же предпочтителен.

> Нельзя размещать database URL, пароль, session secret, token или полное cookie в issue, commit, CI log, скриншоте или чате.

После добавления `SESSION_SECRET` ранее выданные сессии перестанут валидироваться, и пользователь один раз войдёт заново. Активности, рефлексии, достижения и записи Neon при этом не меняются.

## Чек-лист перед деплоем

| Шаг | Действие | Критерий прохождения |
|---:|---|---|
| 1 | Проверить `git diff --check` | Нет whitespace errors |
| 2 | Запустить четыре quality controls | Все команды завершаются успешно |
| 3 | Убедиться, что `.dev.vars`, секрет, database dump и внутренние `.qa/`-материалы не staged | `git status --short` содержит только ожидаемые файлы |
| 4 | Убедиться, что intended Worker config не удаляет bindings `DATABASE_URL` или `ADMIN_PASSWORD` | Diff конфигурации узкий и просмотрен |
| 5 | Задеплоить через текущую Git integration | Cloudflare build завершён для нужного commit в `main` |

## Production smoke check

Используйте private browser window или неаутентифицированный HTTP-клиент. Подтвердите, что публичное приложение отвечает, а API-данные нельзя прочитать до входа; неверный пароль возвращает `401`, а корректный открывает Dashboard. Затем проверьте одно неразрушающее действие: открыть известную activity, History и Cabinet. Не создавайте тестовые production-записи, если они не являются частью реальной практики.

Повторные неверные пароли теперь ограничиваются на уровне приложения по client IP после восьми ошибок в десятиминутном окне. Это дополнительная защита; перед открытием приложения на публичном домене также стоит настроить распределённое Cloudflare WAF rate limiting rule для `/api/auth/login`.

## Rollback

Если после релиза возникает видимая пользователю регрессия, откатите узкий application commit и дайте существующей Git integration развернуть предыдущую known-good ревизию. Для visual или authentication-only релиза database rollback не нужен. Если следующий релиз будет включать миграцию базы, до деплоя нужно подготовить отдельный recovery plan и snapshot/export затрагиваемых данных.

## Готовность custom domain

`eternal.dojo-dgt.ru` можно подключать только когда `dojo-dgt.ru` станет активной зоной Cloudflare. До добавления hostname убедитесь, что у него нет конфликтующего CNAME. Планируемое изменение — единственный custom-domain route в `wrangler.jsonc`; его нужно явно просмотреть перед commit, а DNS и HTTPS проверить только после деплоя.
