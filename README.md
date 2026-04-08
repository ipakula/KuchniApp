# KuchniApp 🥘

Aplikacja mobilna do zarządzania spiżarnią domową — redukuje marnowanie żywności i upraszcza planowanie posiłków.

## Funkcje

- 📱 **Spiżarnia** — śledzenie produktów, szybkie akcje (Skonsumuj / Otwarto / Wyrzuć)
- 📷 **Skaner kodów kreskowych** — dodawanie produktów w < 5 sekund
- 🛒 **Lista zakupów** — ręczna i automatyczna (AI sugestie)
- 🍽️ **Planer posiłków** — tygodniowy kalendarz + generator przepisów AI
- 🔔 **Powiadomienia** — alerty o kończących się produktach

## Technologie

| Warstwa | Technologia |
|---|---|
| Frontend | React Native + Expo |
| Backend | Node.js + TypeScript + Express |
| Baza danych | PostgreSQL |
| Auth | Firebase Auth |
| AI | OpenAI GPT-4o |
| Produkty | OpenFoodFacts API |

## Struktura projektu

```
kuchniapp/
├── apps/
│   ├── mobile/     # Expo React Native app
│   └── backend/    # Node.js REST API
└── package.json    # Workspace root
```

## Uruchomienie

### Wymagania

- Node.js >= 18
- Yarn >= 1.22
- PostgreSQL >= 14
- Expo CLI

### Backend

```bash
cd apps/backend
cp .env.example .env
# Uzupełnij .env
yarn install
yarn migrate
yarn dev
```

### Mobile

```bash
cd apps/mobile
yarn install
yarn start
```

## Zmienne środowiskowe

Szczegóły w `apps/backend/.env.example`.

## Roadmapa

- **Faza 0** — Setup ✅
- **Faza 1** — MVP Core (Spiżarnia, Skaner, Zakupy, Planer, Powiadomienia)
- **Faza 2** — AI & Automatyzacja (Generator przepisów, Sugestie AI)
- **Faza 3** — Polish & Launch
