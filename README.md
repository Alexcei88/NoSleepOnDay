# No Sleep On Day

Сайт о проблеме светового дня в России. Калькулятор показывает, сколько световых минут житель региона теряет сейчас и сколько мог бы получить, если бы часовой пояс региона сдвинуть на +1 час.

В MVP — расчёт для Кировской области.

## Стек

- **Backend:** ASP.NET Core 10 Web API, SunCalcNet
- **Frontend:** Angular 21 (standalone, signals), Angular Material, ng2-charts

## Требования

- .NET 10 SDK (см. `global.json`)
- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)

## Запуск (dev)

В двух терминалах:

```bash
# Backend → https://localhost:5001
dotnet run --project src/NoSleepOnDay.Api

# Frontend → http://localhost:4200 (прокси /api → бэк)
cd src/no-sleep-on-day-web
ng serve
```

После старта обоих процессов открой `http://localhost:4200`.

## Тесты

```bash
# Бэк
dotnet test

# Фронт
cd src/no-sleep-on-day-web
ng test
```

## Структура

```
NoSleepOnDay.slnx                         ← .NET solution
src/
├── NoSleepOnDay.Api/                     ← ASP.NET Core 10 Web API
└── no-sleep-on-day-web/                  ← Angular workspace
tests/
└── NoSleepOnDay.Api.Tests/               ← xUnit
docs/superpowers/
├── specs/                                ← дизайн-документы
└── plans/                                ← планы реализации
```

## Документация

- Спецификация: [`docs/superpowers/specs/2026-04-29-timezone-daylight-design.md`](docs/superpowers/specs/2026-04-29-timezone-daylight-design.md)
- План реализации этапа 1: [`docs/superpowers/plans/2026-04-29-timezone-daylight-mvp-plan.md`](docs/superpowers/plans/2026-04-29-timezone-daylight-mvp-plan.md)
