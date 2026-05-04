# No Sleep On Day

Сайт о проблеме светового дня в России. Калькулятор показывает, сколько световых минут житель региона теряет сейчас и сколько мог бы получить, если бы часовой пояс региона сдвинуть на +1 час. Также рекомендует оптимальное время подъёма для максимизации света в окне бодрствования.

В MVP — расчёт для Кировской области. Например: за год 2026 при подъёме в 06:00 и 8 часах сна Киров получает ≈ 4096 часов света; при сдвиге +1 час — ≈ 4278 часов. Разница — около **30 минут света в день**, или **182 часа в год**.

## Стек

- **Backend:** ASP.NET Core 10 Web API, SunCalcNet, TimeZoneConverter
- **Frontend:** Angular 21 (standalone, signals), Angular Material, ng2-charts
- **Тесты:** xUnit + AwesomeAssertions (бэк), Karma/Jasmine (фронт)

## Архитектура

- Бэкенд считает астрономию локально через SunCalcNet — без внешних API.
- БД нет: справочник регионов в коде, расчёты на лету (миллисекунды).
- Фронт — single-page dashboard на signals, `ng serve` проксирует `/api/*` на бэк.
- Фаза 1 (MVP) — калькулятор. Фаза 2 (отдельная спека) — VK OAuth, голосование, комментарии.

## Требования

- .NET 10 SDK (см. `global.json`)
- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`

## Запуск

В двух терминалах:

```bash
# Backend → https://localhost:5001
dotnet run --project src/NoSleepOnDay.Api

# Frontend → http://localhost:4200 (прокси /api → бэк)
cd src/no-sleep-on-day-web
ng serve
```

После старта обоих процессов открой `http://localhost:4200`.

OpenAPI-схема бэка доступна в dev-режиме на `https://localhost:5001/openapi/v1.json`,
интерактивная документация — на `https://localhost:5001/scalar/v1`.

## Тесты

```bash
# Бэк (≈70 тестов, включая интеграционные через WebApplicationFactory)
dotnet test

# Фронт
cd src/no-sleep-on-day-web
ng test
```

## Структура

```
NoSleepOnDay.slnx                         ← .NET solution
global.json                               ← пин SDK 10.0.200
src/
├── NoSleepOnDay.Api/                     ← ASP.NET Core 10 Web API
│   ├── Domain/                           ← Region, WakeWindow, AnalysisResult, ...
│   ├── Services/                         ← RegionCatalog, SunCalculator,
│   │                                       DaylightAnalysisService
│   ├── Controllers/                      ← Regions, Daylight
│   └── Contracts/                        ← DTO + ContractMapper
└── no-sleep-on-day-web/                  ← Angular workspace
    ├── public/illustrations/             ← morning.svg, evening.svg
    └── src/app/
        ├── core/                         ← API-сервисы и модели
        └── features/dashboard/           ← Hero, фильтры, карточки, график
tests/
└── NoSleepOnDay.Api.Tests/               ← xUnit (домен + сервисы + контроллеры)
docs/superpowers/
├── specs/                                ← дизайн-документ
└── plans/                                ← план реализации
```

## Документация

- Спецификация: [`docs/superpowers/specs/2026-04-29-timezone-daylight-design.md`](docs/superpowers/specs/2026-04-29-timezone-daylight-design.md)
- План реализации этапа 1: [`docs/superpowers/plans/2026-04-29-timezone-daylight-mvp-plan.md`](docs/superpowers/plans/2026-04-29-timezone-daylight-mvp-plan.md)

## API

```
GET  /api/regions
     → 200 [{ id, name, latitude, longitude, timeZone }]

GET  /api/daylight/analysis
     ?regionId=kirov
     &periodType=year|quarter
     &year=2026
     &quarter=1                  (если periodType=quarter)
     &wakeTime=06:00             (опц., 04:00–10:00, шаг 15 мин)
     &sleepHours=8               (опц., 8.0–10.0, шаг 0.5)
     &shiftHours=1               (опц., по умолчанию 1)
     → 200 AnalysisResult
     → 400 ProblemDetails (невалидные параметры)
     → 404 ProblemDetails (неизвестный регион)
```

`AnalysisResult` содержит: `current`/`shifted`/`delta` (минуты в окне бодрствования сейчас и при сдвиге TZ), `optimal` (рекомендованное wake/sleep с пометкой `clampedToBounds`), `series` — серия точек по дням для графика.
