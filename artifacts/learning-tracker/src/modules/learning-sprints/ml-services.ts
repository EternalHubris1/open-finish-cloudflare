const zoom = 'https://github.com/DataTalksClub/mlops-zoomcamp/tree/main/';
const ev = 'https://learn.evidentlyai.com/ml-observability-course/module-2-ml-monitoring-metrics/';
const docker = 'https://docs.docker.com/';
const cisco = 'https://tutorials.ptnetacad.net/help/default/';

export const sources = {
  catalog: 'https://dataenglab.com/labs/',
  evidently: 'https://www.evidentlyai.com/ml-observability-course',
  simulation: cisco + 'mode_simulation.htm',
};

// Check IDs are stable so editing titles or course notes does not reset progress.
export type Checkpoint = {
  id: string;
  title: string;
  short: string;
  topic: string;
  why: string;
  lessons: readonly (readonly [label: string, instruction: string, href: string])[];
  lab: string;
  checks: readonly (readonly [id: string, label: string])[];
  optional?: boolean;
  simulator?: boolean;
};

export const mlServices: {
  id: string;
  title: string;
  intro: string;
  checkpoints: readonly Checkpoint[];
} = {
  id: 'ml-services',
  title: 'Разработка ML-сервисов',
  intro: 'Собери API, которое прогнозирует длительность поездки. Запусти его в Docker, проведи запрос по сети и разберись, что происходит, когда сервис или данные дают сбой.',
  checkpoints: [
    {
      id: 'model', title: 'Первая модель', short: 'Получить прогноз вне ноутбука', topic: 'Модель',
      why: 'Сервис должен уметь повторить предсказание без открытого ноутбука. Для этого сохраняют обученную модель и преобразование входных признаков.',
      lessons: [
        ['MLOps Zoomcamp · 1.1, 1.4 и 1.5', 'Посмотри вводную, загрузи Parquet и обучи модель длительности поездки. Используй отдельный месяц для оценки.', zoom + '01-intro'],
      ],
      lab: 'Возьми учебные данные такси. Сохрани преобразование зон отправления и назначения вместе с моделью. Сделай скрипт, который загрузит сохранённый артефакт и рассчитает прогноз для одной поездки.',
      checks: [
        ['split', 'Разделил данные обучения и оценки по времени.'],
        ['metric', 'Записал MAE в минутах на отложенных данных.'],
        ['predict', 'Запустил прогноз из скрипта и сверил его с ноутбуком.'],
      ],
    },
    {
      id: 'api', title: 'Модель как HTTP API', short: 'Принять JSON и вернуть прогноз', topic: 'API',
      why: 'HTTP API даёт другим приложениям простой способ запрашивать прогноз. Схема входа определяет, какие данные сервис может принять.',
      lessons: [
        ['FastAPI · Первые шаги', 'Подними приложение и отправь первый запрос в интерактивной документации /docs.', 'https://fastapi.tiangolo.com/ru/tutorial/first-steps/'],
        ['FastAPI · Тело запроса', 'Опиши поля поездки и их типы в Pydantic. Проверь, что произойдёт, если клиент пропустит обязательное поле.', 'https://fastapi.tiangolo.com/ru/tutorial/body/'],
        ['MLOps Zoomcamp · 4.1–4.2', 'Разбери онлайн-запросы, пакетный режим и пример сервиса на Flask. Перенеси идею в свой FastAPI.', zoom + '04-deployment'],
      ],
      lab: 'Сделай GET /health и POST /predict. Загружай модель при старте. В ответе /predict верни число минут и версию модели. Отправь корректный и неполный JSON.',
      checks: [
        ['health', 'Проверил /health и валидный /predict.'],
        ['invalid', 'Получил 422 на JSON без обязательного поля.'],
        ['parity', 'Сверил прогноз API и локального скрипта на одной записи.'],
      ],
    },
    {
      id: 'network', title: 'Docker и путь запроса', short: 'Различить DNS, порт и ошибку API', topic: 'Сеть',
      why: 'Имя и порт зависят от того, откуда идёт запрос. Docker Compose даёт соседним контейнерам имена сервисов, а опубликованный порт открывает отдельный путь с твоего компьютера.',
      lessons: [
        ['Docker для Python · Containerize a Python application', 'Собери образ по Dockerfile и запусти приложение через Compose.', docker + 'guides/python/'],
        ['Docker Compose · Service discovery и Debugging', 'Разбери localhost на хосте, имя сервиса между контейнерами и соответствие портов.', docker + 'compose/how-tos/networking/'],
        ['Cisco Packet Tracer · My First Lab, часть IV', 'По желанию повтори веб-запрос в Simulation Mode. Проследи DNS и HTTP в списке событий кнопкой Capture/Forward.', cisco + 'myFirstPTLab.htm'],
      ],
      lab: 'Подними predict и клиент в одной сети Compose. Проверь /health с компьютера и из контейнера. По очереди ошибись в имени сервиса, внутреннем порте и JSON. Запиши, где каждый запрос остановился.',
      checks: [
        ['hosts', 'Мой компьютер достучался до API через опубликованный порт.'],
        ['compose', 'Клиент в Compose достучался до predict:8000.'],
        ['diagnosis', 'Прошёл три сценария в тренажёре и повторил диагностику локально.'],
      ],
      simulator: true,
    },
    {
      id: 'versions', title: 'Версии и пакетный расчёт', short: 'Запускать нужную модель по версии', topic: 'MLflow',
      why: 'Чтобы объяснить изменившийся прогноз, нужно сопоставить запрос с версией модели и результатами её оценки.',
      lessons: [
        ['MLOps Zoomcamp · 2.2–2.5', 'Настрой MLflow локально. Запиши параметры, метрики и артефакты двух запусков, затем зарегистрируй модели.', zoom + '02-experiment-tracking'],
        ['MLOps Zoomcamp · 4.3 и 4.5', 'Загрузи модель по выбранной версии. Сделай пакетный расчёт прогнозов из файла.', zoom + '04-deployment'],
      ],
      lab: 'Оцени две версии на одном наборе данных. Покажи версию в ответе API, переключись на новую и верни предыдущую. Передай файл со входами в отдельный скрипт и запиши файл прогнозов.',
      checks: [
        ['runs', 'В MLflow видны две версии и их MAE на одном наборе.'],
        ['rollback', 'Могу выбрать версию модели и выполнить откат.'],
        ['batch', 'Получил прогнозы для файла одной командой.'],
      ],
    },
    {
      id: 'data', title: 'Качество данных', short: 'Найти ошибку за успешной загрузкой', topic: 'Данные',
      why: 'Зелёный статус задания означает, что оно завершилось. Дубли, пропуски и неверное объединение таблиц могут остаться незамеченными.',
      lessons: [
        ['DataEngLab · Investigate Duplicate Orders', 'Выполни пять шагов SQL-лабы. Сверь число строк и ключей, исправь объединение и проверь итоговую сумму.', 'https://dataenglab.com/labs/investigate-duplicate-orders/'],
        ['Evidently · 2.4 Data quality in machine learning', 'Разбери проверки на пропуски, дубли, типы полей и размер пакета.', ev + 'data-quality-in-ml'],
        ['DataEngLab · каталог лабораторных', 'Проверь доступность кейса Trace the Orders a Python Pipeline Silently Lost. Если открыт, проследи потери по журналу и числу строк.', sources.catalog],
      ],
      lab: 'В копии учебного файла поездок добавь дубли и убери часть записей. Сверь размер пакета и уникальность идентификаторов. Проверь, какой сигнал покажет каждую поломку.',
      checks: [
        ['sql', 'Прошёл проверку SQL-лабы и объяснил причину двойного подсчёта.'],
        ['validate', 'Мои проверки различают дубли и неожиданно маленький пакет.'],
        ['evidence', 'Записал число строк и уникальных ключей до и после исправления.'],
      ],
    },
    {
      id: 'monitoring', title: 'Мониторинг и дрейф', short: 'Понять, что изменилось в продакшене', topic: 'Метрики',
      why: 'Доступность API, состав входных данных и точность модели отвечают на разные вопросы. Дрейф виден без истинных ответов, а для MAE нужна фактическая длительность поездки.',
      lessons: [
        ['MLOps Zoomcamp · 5.1, 5.3–5.4 и 5.10', 'Подготовь эталонные данные и запусти локальный пример расчёта метрик с Grafana. Сохрани версии зависимостей примера.', zoom + '05-monitoring'],
        ['Evidently · 2.6 и 2.8 Data and prediction drift', 'Разбери разницу между дрейфом входов и прогнозов, затем сравни два пакета на практике.', ev + 'data-prediction-drift-in-ml'],
        ['Evidently · код к уроку 2.8', 'Повтори расчёт дрейфа на данных своего сервиса.', ev + 'data-prediction-drift-code-practice'],
      ],
      lab: 'Собери число запросов, долю ошибок и p95 задержки. Сравни эталонный пакет с пакетом, где изменились доли зон отправления. Проверь, что запросы могут отвечать 200 даже при заметном дрейфе.',
      checks: [
        ['metrics', 'Вижу число запросов, ошибки и p95 задержки.'],
        ['drift', 'Вижу, какие категории изменились между двумя пакетами.'],
        ['labels', 'Могу объяснить, когда уже можно считать фактическую MAE.'],
      ],
    },
    {
      id: 'release', title: 'Тесты и выпуск', short: 'Проверить сервис перед обновлением', topic: 'Релиз',
      why: 'Проверки перед выпуском защищают контракт API и позволяют обнаружить версию, которая перестала загружаться или принимать запросы.',
      lessons: [
        ['MLOps Zoomcamp · 6.1–6.2 и 6.11', 'Посмотри unit-тесты, проверку HTTP-сервиса в Compose и идею CI. Примеры AWS адаптируй к своему локальному API.', zoom + '06-best-practices'],
        ['FastAPI · Testing', 'Проверь валидное тело запроса, ошибку валидации и ответ /health.', 'https://fastapi.tiangolo.com/tutorial/testing/'],
        ['GitHub Actions · Building and testing Python', 'Запускай тесты при изменении кода. Возьми из руководства настройку Python, зависимостей и тестового шага.', 'https://docs.github.com/en/actions/tutorials/build-and-test-code/python'],
      ],
      lab: 'Подготовь README с запуском, примером запроса и откатом модели. Добавь CI. Умышленно поменяй обязательное поле и проверь, что тест поймал поломку. Потом восстанови контракт.',
      checks: [
        ['ci', 'Автотесты проверяют контракт API и запускаются в CI.'],
        ['launch', 'Проект можно запустить из чистой копии по README.'],
        ['report', 'Описал два сбоя, сигналы диагностики и результат повторной проверки.'],
      ],
    },
    {
      id: 'cloud', title: 'Сервис на удалённой машине', short: 'Перенести готовый контейнер на сервер', topic: 'Облако', optional: true,
      why: 'AWS — облако Amazon. EC2 даёт виртуальную машину, где можно запустить тот же образ. Навык переносится и на серверы других провайдеров.',
      lessons: [
        ['Amazon EC2 · Get started', 'Пройди Launch, Connect и Clean up. Проверь тариф своего аккаунта перед запуском. Если у тебя уже есть Linux VM, используй её.', 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html'],
      ],
      lab: 'Разверни проверенный образ на VM и обратись к /health через SSH-туннель. Запиши, где настраивается доступ. Затем убери тестовые облачные ресурсы, если создавал их.',
      checks: [
        ['remote', 'Получил ответ API с удалённой машины.'],
        ['rules', 'Могу объяснить, какие правила ограничивают доступ к VM.'],
        ['cleanup', 'Проверил наличие расходов и удалил временные ресурсы.'],
      ],
    },
  ],
};

export const requestStages = [
  { title: 'Клиент', detail: 'Клиент в Compose отправляет POST /predict к predict:8000.' },
  { title: 'DNS', detail: 'Compose находит адрес контейнера по имени сервиса predict.' },
  { title: 'TCP', detail: 'Клиент соединяется с портом 8000 внутри контейнера.' },
  { title: 'FastAPI', detail: 'API проверяет типы и обязательные поля JSON.' },
  { title: 'Модель', detail: 'Модель вычисляет прогноз. API возвращает HTTP 200 и версию модели.' },
];

export type FaultScenario = {
  id: string;
  title: string;
  failure: number;
  observed: string;
  choices: readonly string[];
  correct: number;
  reason: string;
};

export const faults: readonly FaultScenario[] = [
  { id: 'dns', title: 'Неверное имя', failure: 1, observed: 'Имя predcit не разрешилось. HTTP-ответа нет.',
    choices: ['Исправить имя сервиса на predict', 'Поменять схему JSON', 'Увеличить порт'],
    correct: 0, reason: 'DNS не нашёл имя. Запрос ещё не дошёл до порта и обработчика.' },
  { id: 'port', title: 'Неверный порт', failure: 2, observed: 'Адрес найден. На внутреннем порту 8080 никто не слушает, соединение отклонено.',
    choices: ['Переобучить модель', 'Обратиться к predict:8000', 'Изменить имя сервиса'],
    correct: 1, reason: 'Соседний контейнер обращается к внутреннему порту 8000. Проброс порта хоста для него не нужен.' },
  { id: 'body', title: 'Неполный JSON', failure: 3, observed: 'FastAPI вернул HTTP 422. В JSON нет зоны назначения.',
    choices: ['Сменить DNS', 'Открыть другой порт', 'Добавить поле зоны назначения'],
    correct: 2, reason: 'Полученный HTTP-ответ подтверждает, что сервер доступен. Исправить нужно входные данные.' },
];
