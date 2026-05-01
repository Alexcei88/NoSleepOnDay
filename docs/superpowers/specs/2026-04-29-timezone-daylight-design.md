# Дизайн: «No Sleep On Day» — сайт о проблеме светового дня в России

**Дата:** 2026-04-29
**Статус:** утверждён
**Аудитория:** разработчик(-и) проекта

---

## 1. Контекст и цель

Большинство регионов России живут в часовом поясе, который смещает световой день на утренние часы: рассвет ранний, но закат тоже ранний — вечером темно даже днём. Цель сайта — наглядно показать масштаб этой проблемы конкретному жителю региона: сколько световых минут он фактически проводит в окне бодрствования сейчас и сколько мог бы получить, если бы часовой пояс региона сдвинуть на +1 час.

**Целевой тон:** смешанный — факты и цифры в центре, с чётким тезисом «вот почему это важно». Не агитация, но и не сухая аналитика.

**MVP-регион:** Кировская область. Архитектура с самого начала рассчитана на расширение на все регионы России.

---

## 2. Сценарий использования (MVP)

1. Пользователь открывает сайт.
2. Выбирает регион из выпадающего списка (в MVP — только Кировская область).
3. Задаёт **длительность сна** (по умолчанию 8 часов, диапазон 8–10 часов с шагом 30 минут — то есть 5 точек: 8.0, 8.5, 9.0, 9.5, 10.0) и **время подъёма** (по умолчанию 06:00, диапазон 04:00–10:00). Окно бодрствования вычисляется как `24h − sleepHours` (от 14 до 16 часов).
4. Выбирает период анализа: год или конкретный квартал.
5. Видит:
   - **Сейчас** — суммарные световые часы в окне бодрствования за период.
   - **Если +1 час** — то же значение при гипотетическом сдвиге часового пояса региона на +1 час.
   - **Разница** — сколько света приобрёл бы житель.
   - Линейный график с динамикой по дням.
   - Рекомендованное оптимальное время подъёма для максимизации света в окне.

---

## 3. Расчётная модель

### 3.1 Входные данные

| Параметр | Источник / значение |
|---|---|
| Координаты центра региона (широта, долгота) | Справочник `RegionCatalog` |
| Часовой пояс региона (IANA) | Справочник `RegionCatalog`. Для Кирова: `Europe/Kirov` (UTC+3) |
| Время подъёма | Параметр пользователя, диапазон 04:00–10:00, шаг 15 мин |
| Длительность сна | Параметр пользователя, диапазон 8–10 часов, шаг 30 мин (по умолчанию 8) |
| Длительность окна бодрствования | Вычисляется: `24h − sleepHours` (от 14 до 16 часов) |
| Время засыпания | Вычисляется: `wakeTime + (24h − sleepHours)` |
| Сдвиг часового пояса для гипотезы | По умолчанию +1 час |
| Период | Год целиком или один из четырёх кварталов |

### 3.2 Базовый расчёт для одного дня

```
sunrise, sunset  ← SunCalcNet(date, lat, lon) с конвертацией в локальный TZ
sleepTime        = wakeTime + (24h − sleepHours)
window           = [wakeTime, sleepTime]                  // длина 14–16 часов
daylightMinutes  = |[sunrise, sunset] ∩ window|
```

Формула пересечения отрезков:
```
overlap = max(0, min(sunset, sleepTime) − max(sunrise, wakeTime))
```

### 3.3 Сравнение часовых поясов

Сдвиг TZ региона на +N часов математически эквивалентен сдвигу окна бодрствования на −N часов в том же абсолютном времени. Используем это упрощение:

```
currentDaylight  = |[sunrise, sunset] ∩ [wakeTime, sleepTime]|
shiftedDaylight  = |[sunrise, sunset] ∩ [wakeTime − N, sleepTime − N]|
delta            = shiftedDaylight − currentDaylight
```

### 3.4 Оптимальное окно бодрствования

При оптимизации **длительность окна сохраняется** — то есть если пользователь спит 9 часов, оптимизатор тоже работает с 15-часовым окном. Перебираем допустимую координату `optimal_wake` ∈ [04:00, 10:00] с шагом 15 минут (всего 25 точек). Для каждого кандидата считаем сумму световых минут за период. Возвращаем тот, что даёт максимум:

```
windowDuration = 24h − sleepHours
optimal_wake   = argmax_w∈[04:00..10:00 step 15min]
                  [ sum_over_period(daylight_in([w, w + windowDuration])) ]
optimal_sleep  = optimal_wake + windowDuration
```

Если максимум достигается на одной из границ диапазона (`04:00` или `10:00`), в результат добавляется флаг `clampedToBounds: true` — это сигнал UI отметить, что «настоящий» оптимум, возможно, лежит за пределами разрешённой зоны.

### 3.5 Агрегации за период

- Суммарные световые минуты (`current`, `shifted`)
- Среднее в день (`current`, `shifted`)
- Дельта: `shifted − current` (всего и в среднем за день)
- Серия `[{ date, currentMinutes, shiftedMinutes }]` для графика (массив на верхнем уровне `AnalysisResult.series`)

### 3.6 Структура `AnalysisResult` (контракт API)

`series` — это массив точек `{ date, currentMinutes, shiftedMinutes }` (одна запись на каждый день периода). Используется фронтом для построения графика.

Все длительности — в **минутах** (бэк не делает никаких преобразований единиц). Фронт форматирует их в часы/минуты/проценты по своему усмотрению (например, `412 ч/год` рассчитывается фронтом как `totalDaylightMinutes / 60`).

```json
{
  "region": { "id": "kirov", "name": "Кировская область", "latitude": 58.6035, "longitude": 49.668, "timeZone": "Europe/Kirov" },
  "period": { "type": "year", "year": 2026, "quarter": null, "startDate": "2026-01-01", "endDate": "2026-12-31" },
  "wakeWindow": { "wakeTime": "06:00", "sleepTime": "22:00", "sleepHours": 8.0 },
  "shiftHours": 1,
  "current":  { "totalDaylightMinutes": 24720, "avgDaylightPerDay": 67 },
  "shifted":  { "totalDaylightMinutes": 28680, "avgDaylightPerDay": 78 },
  "delta":    { "totalGainMinutes": 3960,      "avgGainPerDay":     11 },
  "optimal":  {
    "wakeTime": "07:30",
    "sleepTime": "23:30",
    "totalDaylightMinutes": 30120,
    "avgDaylightPerDay": 82,
    "clampedToBounds": false
  },
  "series": [
    { "date": "2026-01-01", "currentMinutes": 32, "shiftedMinutes": 47 },
    { "date": "2026-01-02", "currentMinutes": 33, "shiftedMinutes": 48 }
  ]
}
```

---

## 4. Архитектура высокого уровня

```
┌─────────────────────────┐         ┌─────────────────────────────┐
│  Angular SPA            │  HTTP   │  ASP.NET Core 10 Web API    │
│  - выбор региона        │ ──────▶ │  - REST endpoints           │
│  - время подъёма        │ ◀────── │  - DaylightAnalysisService  │
│  - период               │   JSON  │  - RegionCatalog            │
│  - карточки + график    │         │  - SunCalculator (SunCalcNet)│
└─────────────────────────┘         └─────────────────────────────┘
```

**Ключевые решения:**
- **БД отсутствует.** Справочник регионов — в коде (in-memory массив). Расчёты делаются на лету: SunCalcNet считает восход/заход за миллисекунды. БД появится, когда добавим сохранение пользовательских предпочтений или историю.
- **Без внешних API.** SunCalcNet (NuGet-пакет) считает астрономию локально и детерминированно — это точнее и надёжнее, чем зависеть от внешнего сервиса.

---

## 5. Backend — ASP.NET Core 10

### 5.1 Стек

- **.NET 10**, ASP.NET Core Web API
- **SunCalcNet** (NuGet) — расчёт восхода/заката
- **NodaTime** (опционально) — для аккуратной работы с IANA TZ; иначе `TimeZoneInfo.FindSystemTimeZoneById`
- **xUnit** — юнит-тесты

### 5.2 Структура проекта

```
src/NoSleepOnDay.Api/
├── Program.cs                            ← минимальный hosting + DI + CORS
├── Controllers/
│   ├── RegionsController.cs              ← GET /api/regions
│   └── DaylightController.cs             ← GET /api/daylight/analysis
├── Domain/
│   ├── Region.cs                         ← record(Id, Name, Latitude, Longitude, TimeZone)
│   ├── WakeWindow.cs                     ← record(WakeTime, SleepHours); SleepTime = WakeTime + (24h − SleepHours)
│   ├── DateRange.cs                      ← год или квартал → [start, end]
│   ├── DaylightSeriesPoint.cs            ← record(Date, CurrentMinutes, ShiftedMinutes)
│   └── AnalysisResult.cs                 ← полный отчёт (см. 3.6)
├── Services/
│   ├── IRegionCatalog.cs / RegionCatalog.cs
│   ├── ISunCalculator.cs / SunCalculator.cs
│   └── IDaylightAnalysisService.cs / DaylightAnalysisService.cs
└── Contracts/                            ← DTO для API (mapped из Domain)

tests/NoSleepOnDay.Api.Tests/
├── DaylightAnalysisServiceTests.cs
└── SunCalculatorTests.cs
```

### 5.3 Сервисы

**`IRegionCatalog`** — справочник регионов. Для MVP:
```csharp
new Region("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov")
```

**`ISunCalculator`** — обёртка над SunCalcNet:
```csharp
SunTimes GetSunTimes(DateOnly date, double latitude, double longitude, string timeZoneId);
// SunTimes: Sunrise, Sunset как DateTimeOffset в локальном TZ региона
```

**`IDaylightAnalysisService`** — основная логика:
```csharp
AnalysisResult Analyze(
    string regionId,
    PeriodType periodType,        // Year | Quarter
    int year,
    int? quarter,
    TimeOnly wakeTime,
    double sleepHours,            // 8.0..10.0 step 0.5
    int shiftHours);
```

### 5.4 API endpoints

```
GET /api/regions
    → 200 OK [ { id, name, latitude, longitude, timeZone }, ... ]

GET /api/daylight/analysis
    Query:
      regionId       (required, string)
      periodType     (required, "year" | "quarter")
      year           (required, int)
      quarter        (required, если periodType=quarter; 1..4)
      wakeTime       (optional, "HH:mm", default "06:00", range 04:00–10:00, шаг 15 мин)
      sleepHours     (optional, decimal, default 8.0, range 8.0–10.0, шаг 0.5)
      shiftHours     (optional, int, default 1)
    → 200 OK AnalysisResult (см. 3.6)
    → 400 Bad Request ProblemDetails (если параметры невалидны)
    → 404 Not Found ProblemDetails (если regionId неизвестен)
```

---

## 6. Frontend — Angular 17+

### 6.1 Стек

- **Angular 17+** (standalone components, signals для реактивного состояния)
- **Angular Material** — `mat-select`, `mat-form-field`, time picker
- **ng2-charts + Chart.js** — линейный график
- **@angular/localize** — i18n-инфраструктура (RU only в MVP)

### 6.2 Структура проекта

```
src/no-sleep-on-day-web/
└── src/app/
    ├── core/
    │   ├── api/
    │   │   ├── regions.service.ts            ← HTTP-клиент /api/regions
    │   │   └── daylight.service.ts           ← HTTP-клиент /api/daylight/analysis
    │   └── models/                            ← TypeScript-типы из Contracts
    ├── features/dashboard/
    │   ├── dashboard.page.ts                  ← главная страница
    │   ├── region-selector/
    │   ├── wake-time-picker/                  ← диапазон 04:00–10:00, шаг 15 мин
    │   ├── sleep-duration-picker/             ← 8.0–10.0 ч, шаг 0.5
    │   ├── period-selector/                   ← год / квартал
    │   ├── summary-cards/                     ← карточки «Сейчас / +1 час / Разница»
    │   ├── daylight-chart/                    ← линейный график
    │   └── optimal-schedule-card/             ← рекомендация подъёма
    └── shared/
```

### 6.3 Главный экран (макет)

```
┌──────────────────────────────────────────────────────────────┐
│  [Заголовок и тезис: «Россия живёт в неудобном времени»]      │
├──────────────────────────────────────────────────────────────┤
│  [Регион ▼] [Подъём: 06:00 ▼] [Сон: 8 ч ▼] [Период: Год ▼]    │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│  │ Сейчас    │ │ Если +1ч  │ │ Разница   │                   │
│  │ 412 ч/год │ │ 478 ч/год │ │ +66 ч/год │                   │
│  │           │ │           │ │ +11 м/день│                   │
│  └───────────┘ └───────────┘ └───────────┘                   │
├──────────────────────────────────────────────────────────────┤
│  [Линейный график: световые минуты в окне по дням]            │
│   ── current (текущий TZ)   ── shifted (+1ч)                  │
├──────────────────────────────────────────────────────────────┤
│  💡 Оптимальный подъём для вашего региона: 07:30              │
│     даст +X минут света в день в среднем                      │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 Поведение

- Изменение любого фильтра → один HTTP-запрос на `/api/daylight/analysis` → обновление всех карточек и графика разом.
- Дебаунс 300 мс на time-picker.
- Лоадер на блоке результатов; фильтры остаются доступны.
- Дев-режим: фронт (`ng serve` на 4200) проксирует `/api/*` на бэк (5001) через `proxy.conf.json`.

---

## 7. Локализация

- MVP — только русский язык.
- Тексты UI хранятся в `@angular/localize` или простом `messages.ru.json`. Это упрощает добавление английского позже без рефакторинга.
- Бэк не возвращает текстовые сообщения для пользователя — только данные и структурированные коды ошибок (`ProblemDetails`).

---

## 8. Тестирование (MVP)

**Бэк (xUnit):**
- `DaylightAnalysisServiceTests` — фиксированные даты (зимнее солнцестояние, летнее, равноденствия) и координаты Кирова. Проверяем:
  - точные значения `current`, `shifted`, `delta`
  - корректность поиска оптимального сдвига
  - граничные случаи (полярная ночь / день — невозможны для Кирова, но для будущих регионов ≈ Мурманск важно)
- `SunCalculatorTests` — sanity-проверки против эталонных времён (например, для Москвы 21 июня).

**Фронт:**
- Компонент-тест на `DashboardPage` с моком сервисов (один сценарий рендера).
- E2E не делаем для MVP.

---

## 9. Обработка ошибок

**Бэк:** глобальный `ExceptionHandler` middleware → возвращает `ProblemDetails` (RFC 7807). Валидация параметров запроса (например, `wakeTime` вне диапазона) → 400 с понятным `detail`.

**Фронт:** HTTP-интерсептор перехватывает ошибки и показывает их через `MatSnackBar`. Дополнительная клиентская валидация в формах (range на time-picker, обязательные поля).

---

## 10. Запуск (для разработчика)

```bash
# Бэк
dotnet run --project src/NoSleepOnDay.Api
# → https://localhost:5001

# Фронт (отдельный терминал)
cd src/no-sleep-on-day-web
ng serve
# → http://localhost:4200, прокси /api на бэк
```

README в корне репозитория описывает эти шаги и требования (.NET 10 SDK, Node.js 20+, Angular CLI).

---

## 11. Структура репозитория

```
d:\projects\noSleepOnDay\
├── src/
│   ├── NoSleepOnDay.Api/             ← .NET бэк
│   └── no-sleep-on-day-web/          ← Angular фронт
├── tests/
│   └── NoSleepOnDay.Api.Tests/       ← xUnit
├── docs/
│   └── superpowers/specs/            ← дизайн-документы
├── NoSleepOnDay.sln
├── README.md
└── .gitignore
```

---

## 12. Что вне MVP

Эти пункты осознанно отложены — сейчас не реализуем, чтобы не раздувать первую версию:

- Все регионы России (сейчас только Кировская область).
- Интерактивная карта России для выбора региона.
- Геолокация и автоопределение региона.
- Сохранение предпочтений пользователя (требует БД и/или auth).
- Социальные шеры результатов.
- Английская локализация.
- Деплой в облако (пока только локальный запуск / Docker).
- E2E-тесты на фронте.
