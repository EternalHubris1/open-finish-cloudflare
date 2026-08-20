# Cloudflare Access для Open Finish

**Статус:** рекомендуемая ручная настройка после P1-релиза.

**Область:** только Worker `open-finish-cloudflare`; данных Neon, кода Worker и секретов не касается.

## Назначение

Cloudflare Access ставит проверку личности **перед** запуском Worker. Это добавляет независимый от приложения внешний барьер: неавторизованный посетитель не увидит даже форму Open Finish, а запрос не дойдёт до password-gate или API. Текущий пароль Open Finish остаётся включённым и становится вторым слоем защиты. Cloudflare применяет Access-политику к каждому запросу до выполнения Worker.[1]

> **Рекомендуемая схема:** `Cloudflare Access` → `Open Finish password-gate` → `HttpOnly session` → `защищённый API` → `Neon`.

| Решение | Что выбрать для Open Finish | Причина |
| --- | --- | --- |
| Область защиты | **Один Worker** `open-finish-cloudflare` | Не затрагивает другие Workers аккаунта. |
| Трафик | **All traffic** | Защищает и production URL, и preview deployments. |
| Базовая политика | **Cloudflare account** для одного владельца | Самый узкий и простой вариант: доступ только у участника Cloudflare-аккаунта. |
| Доступ для дополнительного человека | отдельная **Allow** policy с selector **Emails** | Точная allowlist конкретных адресов; не открывает доступ всему почтовому домену.[2] |
| Session duration | 24 часа или 7 дней | Меньше повторных входов, но сохранён разумный срок повторной проверки. |

## Настройка через Cloudflare Dashboard

Сначала откройте [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages), выберите Worker **`open-finish-cloudflare`**, затем откройте вкладку **Access**. Нажмите **Protect this Worker behind Access**. Это штатный путь Worker-level Access: он распространяется на все домены выбранного Worker, включая `workers.dev`, custom domains и preview deployments.[1]

В диалоге выберите **All traffic**. В поле **Authentication policy** для личного workspace выберите **Cloudflare account** и укажите текущий Cloudflare account. Если доступ нужен ещё одному конкретному адресу, после создания защиты откройте Cloudflare Zero Trust → **Access** → **Applications**, выберите приложение Open Finish и добавьте политику с действием **Allow**, правилом **Include**, selector **Emails** и нужным точным email-адресом. Access deny-by-default: пользователь, не соответствующий Allow-политике, не сможет пройти дальше.[2]

Задайте session duration в 24 часа; при необходимости её можно увеличить до 7 дней. Затем нажмите **Apply Access**. Если Zero Trust ещё не активирован в аккаунте, Cloudflare сначала предложит завершить его первичную настройку; это требование для Access.[1]

## Проверка после включения

Откройте `https://open-finish-cloudflare.dgt-saunin.workers.dev` в приватном окне браузера. Ожидаемый порядок выглядит так:

1. Сначала появляется страница Cloudflare Access и требуется вход разрешённым Cloudflare account или email-провайдером.
2. После успешного прохождения Access отображается существующий экран ввода пароля Open Finish.
3. После правильного пароля открывается Dashboard.
4. В новом приватном окне без Cloudflare Access-сессии Dashboard и API не должны быть доступны.

| Проверка | Ожидаемый результат |
| --- | --- |
| Открытие URL без Access-сессии | Cloudflare предлагает вход или блокирует запрос; приложение не загружается. |
| Вход под разрешённой учётной записью | Появляется password-gate Open Finish. |
| Запрос `/api/healthz` без пароля Open Finish после Access | `401 Authentication required`. |
| Выход из Open Finish | Сбрасывает только сессию Open Finish; Access-сессия живёт до своего expiry. |

## Безопасные границы и откат

Не выбирайте **Protect all Workers**, поскольку это может затронуть текущие и будущие Workers в аккаунте. Для Open Finish нужна защита одного Worker. Не добавляйте правило **Bypass / Everyone**: оно отключает enforcement Access для совпадающего трафика.[2]

Эта настройка не меняет Neon, не удаляет записи и не меняет `DATABASE_URL` или `ADMIN_PASSWORD`. При проблеме с доступом откройте **Workers & Pages → open-finish-cloudflare → Access** и отключите Worker-level Access либо скорректируйте Allow policy. После отката парольная защита Open Finish продолжит работать как раньше.[1]

## Ограничение

Worker-level Access в настоящий момент не подходит для Worker, которому нужны WebSocket upgrade requests: такие запросы будут завершаться `403`. Open Finish не использует WebSockets, поэтому это ограничение не препятствует текущей конфигурации.[1]

## References

[1]: https://developers.cloudflare.com/workers/configuration/cloudflare-access/ "Cloudflare Access for Workers — official documentation"
[2]: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/ "Cloudflare Access policies — official documentation"
[3]: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/ "Choosing an Access application type — official documentation"
