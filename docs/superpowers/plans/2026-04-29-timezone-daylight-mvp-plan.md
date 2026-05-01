# План реализации: «No Sleep On Day» — этап 1 (MVP калькулятор)

**Дата:** 2026-04-29
**Спека:** [`docs/superpowers/specs/2026-04-29-timezone-daylight-design.md`](../specs/2026-04-29-timezone-daylight-design.md)
**Этап:** 1 из 2 (текущий — калькулятор без аутентификации; этап 2 — VK-голосование и комментарии — описан отдельно после релиза этого этапа)

---

## Принципы исполнения

- **TDD-подход** для бэка: сначала тесты на чистые расчётные функции с эталонными значениями, потом реализация.
- **Атомарные коммиты**: один шаг = один коммит. Сообщение фиксирует, что зелёное (`tests pass`).
- **Точки проверки** в конце каждого этапа: что должно работать руками или автоматически.
- **Не выходим за рамки спеки**. Любое отступление — обсуждаем перед коммитом.

---

## Этап A — Скелет проектов

**Цель:** работающий моно-репо с тремя пустыми проектами, которые компилируются и запускаются.

### A.1 .NET solution + Web API проект
- Создать `NoSleepOnDay.sln` в корне.
- Создать `src/NoSleepOnDay.Api/` — ASP.NET Core 10 Web API (`dotnet new webapi`).
- Удалить пример `WeatherForecast` (контроллер, модель, схему openapi-примера), оставить минимальный `Program.cs`.
- Включить `OpenAPI`/`Swashbuckle` для удобства dev-инспекции.
- Включить CORS-policy `AllowAngularDev` → `http://localhost:4200`.
- Проверка: `dotnet run --project src/NoSleepOnDay.Api` поднимает API на `https://localhost:5001` и отдаёт корневой 404.

### A.2 Тестовый проект xUnit
- Создать `tests/NoSleepOnDay.Api.Tests/` — `dotnet new xunit`.
- Добавить ProjectReference на `NoSleepOnDay.Api`.
- Добавить пакеты: `Microsoft.AspNetCore.Mvc.Testing`, `FluentAssertions`.
- Один пустой smoke-тест `True_is_true` проходит.
- Проверка: `dotnet test` зелёный.

### A.3 Angular проект
- В `src/no-sleep-on-day-web/` создать через `ng new no-sleep-on-day-web --routing --style=scss --standalone --skip-git`.
- Поднять Angular 17+ (или последний LTS-совместимый).
- Установить:
  - `@angular/material`
  - `chart.js`, `ng2-charts`
  - `@angular/localize`
- Создать `proxy.conf.json` для проксирования `/api` → `https://localhost:5001`.
- Подключить `proxy` в `angular.json` (`serve.options.proxyConfig`).
- Проверка: `ng serve` поднимает на `http://localhost:4200`, страница показывает заголовок Angular.

### A.4 README + .gitignore
- Корневой `README.md`: описание проекта (1 абзац), требования (.NET 10 SDK, Node 20+, Angular CLI), команды запуска бэка и фронта.
- `.gitignore` уже создан, проверить, что покрывает `bin/`, `obj/`, `node_modules/`, `dist/`, `.angular/`.

**Точка проверки A:** одновременно работают `dotnet run` и `ng serve`; в браузере открывается стартовая Angular-страница; `dotnet test` зелёный.
**Коммит:** `chore: скелет solution, web api, тестов и angular-приложения`

---

## Этап B — Backend: расчётная модель (TDD)

**Цель:** чистая, протестированная бизнес-логика расчёта световых минут. Без HTTP, без DI — только классы и методы.

### B.1 Domain-типы
В `src/NoSleepOnDay.Api/Domain/`:
- `Region.cs` — `record Region(string Id, string Name, double Latitude, double Longitude, string TimeZoneId)`.
- `WakeWindow.cs` — `record WakeWindow(TimeOnly WakeTime, double SleepHours)` с вычисляемым `SleepTime` и `WindowDuration`.
- `PeriodType.cs` — `enum { Year, Quarter }`.
- `DateRange.cs` — `record DateRange(DateOnly Start, DateOnly End)` + factory-метод `FromYearOrQuarter(int year, int? quarter)`.
- `DaylightSeriesPoint.cs` — `record(DateOnly Date, int CurrentMinutes, int ShiftedMinutes)`.
- `AnalysisResult.cs` — соответствует JSON-контракту из спеки 3.6.

Тестов на голые рекорды не пишем — только конструкторские инварианты (например, `WakeWindow` валидирует диапазон).

**Тесты:**
- `WakeWindowTests`: `WakeTime` вне `[04:00, 10:00]` → `ArgumentOutOfRangeException`; `SleepHours` вне `[8.0, 10.0]` → исключение; `SleepHours` не кратен 0.5 → исключение.
- `DateRangeTests`: квартал 1 → `[Jan 1, Mar 31]`; високосный год для Q1 → `[Jan 1, Mar 31]`; год → `[Jan 1, Dec 31]`; невалидный квартал (0 или 5) → исключение.

**Коммит:** `feat(api): доменные типы расчётной модели`

### B.2 SunCalculator (обёртка над SunCalcNet)
- Установить NuGet `SunCalcNet`.
- `ISunCalculator` + `SunCalculator` в `Services/`.
- Метод `SunTimes GetSunTimes(DateOnly date, double lat, double lon, string timeZoneId)`.
- Внутри: вызов SunCalcNet → конвертация UTC-времени восхода/заката в локальное TZ через `TimeZoneInfo.FindSystemTimeZoneById`.
- Возвращаемый тип `SunTimes(DateTime SunriseLocal, DateTime SunsetLocal)`.

**Тесты `SunCalculatorTests`:**
- 21 июня 2026, координаты Москвы (`55.7558, 37.6173`, `Europe/Moscow`) — восход около 03:43 (UTC+3), заход около 21:18. Проверяем с допуском ±2 минуты.
- 21 декабря 2026, координаты Кирова (`58.6035, 49.6680`, `Europe/Kirov`) — короткий зимний день. Проверяем `sunrise > sunset_previous_day` и длину дня в разумном диапазоне.

**Коммит:** `feat(api): SunCalculator — обёртка над SunCalcNet`

### B.3 DaylightAnalysisService
- `IDaylightAnalysisService` + `DaylightAnalysisService` в `Services/`.
- Внутренняя функция `int IntersectMinutes(DateTime sunrise, DateTime sunset, DateTime windowStart, DateTime windowEnd)` — пересечение двух временных интервалов, возвращает минуты.
- Метод `AnalysisResult Analyze(Region region, DateRange period, WakeWindow wakeWindow, int shiftHours)`:
  1. Для каждого дня периода вычисляем `current` и `shifted` минуты (используя сдвиг окна на `−shiftHours`).
  2. Аккумулируем суммы и собираем `series`.
  3. Считаем `optimal`: перебор `optimal_wake` ∈ [04:00, 10:00] с шагом 15 мин (25 кандидатов), для каждого — сумма по периоду; берём argmax.
  4. Заполняем `clampedToBounds`, если `optimal_wake` совпал с границей.

**Тесты `DaylightAnalysisServiceTests`** (Кировская область, фиксированные даты):
- **Один день — 21 июня 2026, wake=06:00, sleep=8h** → проверяем точное `currentMinutes` (вычисляем эталон вручную, документируем в комментарии теста).
- **Один день — 21 декабря 2026, wake=06:00** → `currentMinutes = sunset - sunrise` если оба внутри окна (короткий зимний день полностью внутри 06–22).
- **Один день, sleep=10h** → окно бодрствования становится 14 часов (06:00–20:00); проверяем, что результат отличается от 8h-варианта.
- **Сравнение `current` vs `shifted` для +1ч** — на летний день дельта положительная, на зимний — близка к нулю или положительная (вечерний свет важнее).
- **Q1 (зима/начало весны) для Кирова** — общая сумма за квартал, точное значение sanity-проверяется.
- **Год для Кирова, поиск оптимального wake** — проверяем, что `optimal_wake` отличается от 06:00 и `clampedToBounds = false`.
- **Sanity на агрегации**: `series.Length == period.Days`; `series.Sum(currentMinutes) == current.totalDaylightMinutes`.

Сначала пишем падающие тесты, потом реализацию до зелёного.

**Коммит:** `feat(api): DaylightAnalysisService с поиском оптимального окна`

**Точка проверки B:** `dotnet test` зелёный, покрытие — все ветки `Analyze` и `IntersectMinutes` через тесты.

---

## Этап C — Backend: HTTP-слой

**Цель:** работающий REST API, который можно дёргать из браузера/Swagger.

### C.1 RegionCatalog
- `IRegionCatalog` + `RegionCatalog` в `Services/`.
- Внутри: `IReadOnlyList<Region> All { get; }` и `Region? FindById(string id)`.
- Для MVP — один регион:
  ```csharp
  new Region("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov")
  ```

**Тесты `RegionCatalogTests`:** возвращает один регион; `FindById("kirov")` находит; `FindById("unknown")` — `null`.

**Коммит:** `feat(api): RegionCatalog с Кировской областью`

### C.2 Contracts (DTO для API)
- `Contracts/RegionDto.cs`, `AnalysisResultDto.cs` и под-DTO.
- Mapping-методы из доменных типов в DTO.
- Все длительности — в минутах (как в спеке).

**Тесты:** один-два маппинг-теста (минимум).

**Коммит:** `feat(api): DTO-контракты для REST API`

### C.3 RegionsController
- `GET /api/regions` → `IReadOnlyList<RegionDto>`.
- DI на `IRegionCatalog`.

**Тесты `RegionsControllerTests`** через `WebApplicationFactory`:
- 200 + список из одного региона.

**Коммит:** `feat(api): GET /api/regions`

### C.4 DaylightController
- `GET /api/daylight/analysis` со всеми параметрами из спеки 5.4.
- Валидация (через атрибуты + ручные проверки):
  - `regionId` — обязательный; неизвестный → 404.
  - `periodType` — `year` | `quarter`.
  - `quarter` — обязательный, если `periodType=quarter`, диапазон 1..4.
  - `wakeTime` — опционально, default `06:00`, диапазон `04:00..10:00`, шаг 15 мин.
  - `sleepHours` — опционально, default `8.0`, диапазон `8.0..10.0`, шаг 0.5.
  - `shiftHours` — опционально, default `1`.
- Глобальный exception handler middleware → `ProblemDetails`.

**Тесты `DaylightControllerTests`** через `WebApplicationFactory`:
- Happy path: `regionId=kirov&periodType=year&year=2026` → 200 + структура соответствует контракту, числа разумные.
- 404 на неизвестном регионе.
- 400 на `wakeTime=03:00` (вне диапазона), `sleepHours=7.0`, `quarter=5`.
- 400 на отсутствие `quarter`, когда `periodType=quarter`.

**Коммит:** `feat(api): GET /api/daylight/analysis с валидацией`

### C.5 OpenAPI и dev-удобства
- Swashbuckle: `Swashbuckle.AspNetCore` + `app.UseSwagger()` / `app.UseSwaggerUI()` только в dev.
- Логирование запросов через стандартный `Microsoft.Extensions.Logging`.

**Коммит:** `chore(api): swagger UI для dev-режима`

**Точка проверки C:** руками открываем `/swagger`, дёргаем оба endpoint'а, видим валидные JSON-ответы; `dotnet test` зелёный.

---

## Этап D — Frontend: каркас

**Цель:** Angular-приложение с роутингом, темой, моделями и API-сервисами. Без визуальной полировки.

### D.1 Тема Angular Material + базовые стили
- Подключить тему Material (через `ng add @angular/material`, выбрать кастомную тему).
- Создать `styles/_palette.scss` с переменными:
  - `--accent-warm: #F4A300` (янтарь, утро)
  - `--accent-cool: #1E2A6E` (индиго, вечер)
  - `--bg: #FAF8F4` (off-white)
  - `--text: #1F2329` (графит)
- Подключить шрифт `Manrope` (через Google Fonts CDN или npm-пакет).

**Коммит:** `feat(web): тема Material, палитра, шрифт`

### D.2 API-модели и сервисы
В `src/app/core/models/`:
- TypeScript-зеркала контрактов: `Region`, `AnalysisResult`, `Period`, `WakeWindow`, и т.д.

В `src/app/core/api/`:
- `regions.service.ts` → `getAll(): Observable<Region[]>`.
- `daylight.service.ts` → `analyze(params): Observable<AnalysisResult>`.

**Тесты:** один компактный тест на каждый сервис с `HttpTestingController`.

**Коммит:** `feat(web): TypeScript-модели и API-сервисы`

### D.3 DashboardPage скелет
- `features/dashboard/dashboard.page.ts` — standalone-компонент, единственный route `/`.
- Поднять signals для состояния: `selectedRegion`, `wakeTime`, `sleepHours`, `periodType`, `year`, `quarter`, `analysis`, `isLoading`, `error`.
- При изменении любого параметра — `effect` дебаунсит 300 мс и вызывает API.
- На странице пока — голые контролы и `<pre>{{ analysis | json }}</pre>` для отладки.

**Точка проверки D:** в браузере выбираешь регион из dropdown'а, видишь JSON-ответ от бэка.
**Коммит:** `feat(web): dashboard скелет с signals и API-связкой`

---

## Этап E — Frontend: компоненты UI

**Цель:** все компоненты экрана в нужных позициях, данные из API распределены по карточкам и графику.

### E.1 Селекторы
- `region-selector` — `mat-select` с регионами.
- `wake-time-picker` — `mat-select` со списком значений (04:00, 04:15, ..., 10:00 — 25 опций).
- `sleep-duration-picker` — `mat-select` со списком (8.0, 8.5, ..., 10.0 — 5 опций).
- `period-selector` — `mat-button-toggle-group` (Год / Q1 / Q2 / Q3 / Q4) + `mat-select` для года (2024..2027 для MVP).

Каждый компонент — input/output (или `model()` сигнал).

**Коммит:** `feat(web): компоненты-селекторы`

### E.2 Summary cards
- `summary-cards/summary-card.component.ts` — переиспользуемая карточка `[title, value, unit, accent?]`.
- На уровне `summary-cards.component.ts` — три карточки: Сейчас / Если +1 час / Разница.
- Форматирование: значения < 60 минут → `«X мин/день»`; иначе → `«Y ч/период»` (фронт делит на 60).
- Карточка «Разница» подсвечена `--accent-warm`.

**Коммит:** `feat(web): summary cards с тремя метриками`

### E.3 Daylight chart
- `daylight-chart.component.ts` — `ng2-charts` line chart с двумя сериями (`current`, `shifted`).
- X — даты (форматирование: для года — месяцы, для квартала — даты).
- Y — минуты в окне.
- Тон линий: `current` — графит, `shifted` — янтарь.
- Tooltip показывает обе серии и дельту.

**Коммит:** `feat(web): daylight chart с двумя сериями`

### E.4 Optimal schedule card
- `optimal-schedule-card` — отдельный блок, выделенный визуально.
- Показывает: `«Оптимальный подъём для вашего региона: HH:MM — даст +N минут света в день в среднем»`.
- Если `clampedToBounds=true` — добавляется приписка _«(оптимум, возможно, лежит за разрешённым диапазоном 04:00–10:00)»_.

**Коммит:** `feat(web): карточка оптимального расписания`

**Точка проверки E:** на dashboard'е сверху селекторы, под ними три карточки, ниже график, ниже карточка оптимального расписания. Все данные приходят из API.

---

## Этап F — Hero-секция и финальный визуал

**Цель:** сайт выглядит готово, не как конструктор. Главный визуальный месседж — на месте.

### F.1 Подбор иллюстраций
- Найти/подготовить две парные SVG-иллюстрации в одном стиле (`unDraw`/`Storyset` или иные CC0 источники):
  - **morning.svg** — солнце светит, человек спит в кровати.
  - **evening.svg** — лето, около 19:00, темно, дети у мерцающего экрана.
- Положить в `src/assets/illustrations/`.
- Лёгкая адаптация цветов под палитру (заменить акцент на янтарный/индиго).

**Коммит:** `feat(web): hero-иллюстрации (морнинг и ивнинг)`

### F.2 Hero-компонент
- `features/dashboard/hero-illustration/hero.component.ts`:
  - Слева/сверху — `morning.svg` с подписью «Солнце уже взошло — а вы ещё спите».
  - Справа/снизу — `evening.svg` с подписью «Ещё лето, ещё рано — а на улице уже ночь».
  - Между ними / над ними — заголовок «Россия живёт в неудобном времени» и подзаголовок.
- На мобильных — стек по вертикали.

**Коммит:** `feat(web): hero-секция с парными иллюстрациями`

### F.3 Полировка стилей и анимаций
- Карточки: fade + slide-up на 200 мс при первом появлении и при пересчёте.
- Числа в карточках: count-up при изменении (простой signal-effect или библиотека `@rx-angular/animations` / самописный).
- Адаптивность: проверяем брейкпоинты 1024 / 640.
- Lighthouse mobile прогон, фикс крупных предупреждений (alt-тексты у SVG, контраст текста).

**Коммит:** `style(web): полировка анимаций, адаптивность, a11y`

**Точка проверки F:** руками — на десктопе и мобильном (или в DevTools-эмуляторе) сайт выглядит цельно, hero привлекает взгляд, все взаимодействия плавные.

---

## Этап G — Финальная сборка и проверка

**Цель:** проект готов к ручной демонстрации.

### G.1 Loader + ErrorState
- На блоке результатов — `mat-progress-spinner` поверх содержимого пока `isLoading=true`.
- HTTP-интерсептор → `MatSnackBar` на ошибки.
- Базовая обработка: 400 → «проверьте параметры», 500 → «попробуйте позже».

**Коммит:** `feat(web): индикаторы загрузки и обработка ошибок`

### G.2 README — финальная версия
- Скриншот hero-секции (опционально).
- Полные инструкции запуска.
- Описание архитектуры в одном абзаце.
- Ссылка на спеку.

**Коммит:** `docs: финальный README с инструкцией и описанием`

### G.3 Smoke-тест golden path
Руками:
1. Поднимаем бэк и фронт.
2. Открываем `http://localhost:4200`.
3. По умолчанию — Кировская область, 06:00, 8ч сна, год.
4. Видим hero, карточки, график, оптимум.
5. Меняем `wakeTime` на 09:00 → числа меняются, график перерисовывается.
6. Меняем `sleepHours` на 10.0 → числа меняются (окно 14ч).
7. Переключаем на Q1 → данные за зимний квартал, дельта +1ч заметнее.
8. Симулируем ошибку (отключаем бэк) → snackbar с сообщением.

Если что-то ломается — фикс + соответствующий коммит.

---

## Риски и неизвестные

- **SunCalcNet точность** — может расходиться с эталоном на минуту. Решение: допуск ±2 мин в тестах, документирование в комментарии.
- **`Europe/Kirov` IANA-id на Windows** — `TimeZoneInfo` может не найти его в reduced TZ-DB. Решение: при необходимости — подключить `TimeZoneConverter` NuGet или NodaTime.
- **Поиск иллюстраций в нужном стиле** — может оказаться, что готовых пар нет. Тогда либо берём похожие (компромисс), либо рисуем/заказываем (выходит за MVP).
- **Шрифт Manrope** — если CDN недоступен в проде, нужно положить self-hosted. Для MVP — CDN.

---

## Out of scope (намеренно)

Эти вещи не делаем в этап 1, согласно спеке (раздел 12):
- VK OAuth, голосование, комментарии (этап 2).
- Карта России, геолокация, мульти-регион.
- БД любого вида.
- E2E-тесты на фронте.
- Деплой в облако.

---

## Порядок коммитов (краткая шпаргалка)

1. `chore: скелет solution, web api, тестов и angular-приложения`
2. `feat(api): доменные типы расчётной модели`
3. `feat(api): SunCalculator — обёртка над SunCalcNet`
4. `feat(api): DaylightAnalysisService с поиском оптимального окна`
5. `feat(api): RegionCatalog с Кировской областью`
6. `feat(api): DTO-контракты для REST API`
7. `feat(api): GET /api/regions`
8. `feat(api): GET /api/daylight/analysis с валидацией`
9. `chore(api): swagger UI для dev-режима`
10. `feat(web): тема Material, палитра, шрифт`
11. `feat(web): TypeScript-модели и API-сервисы`
12. `feat(web): dashboard скелет с signals и API-связкой`
13. `feat(web): компоненты-селекторы`
14. `feat(web): summary cards с тремя метриками`
15. `feat(web): daylight chart с двумя сериями`
16. `feat(web): карточка оптимального расписания`
17. `feat(web): hero-иллюстрации (морнинг и ивнинг)`
18. `feat(web): hero-секция с парными иллюстрациями`
19. `style(web): полировка анимаций, адаптивность, a11y`
20. `feat(web): индикаторы загрузки и обработка ошибок`
21. `docs: финальный README с инструкцией и описанием`
