# Axivo CRM
 
AI Customer Intelligence — własna platforma CRM z automatyczną analizą wiadomości e-mail.
 
## Jak uruchomić
 
### 1. Zainstaluj zależności
 
```bash
npm install
```
 
### 2. Skonfiguruj bazę danych
 
Skopiuj plik `.env.example` jako `.env`:
 
```bash
cp .env.example .env
```
 
Wpisz swój connection string do PostgreSQL. Opcje:
 
- **Lokalna baza:** `postgresql://postgres:haslo@localhost:5432/axivo_crm`
- **Neon.tech (darmowa, w chmurze):** zarejestruj się na neon.tech, utwórz projekt, skopiuj connection string
 
Wpisz też dowolny klucz API dla n8n (np. wygeneruj UUID).
 
### 3. Utwórz tabele w bazie
 
```bash
npx prisma migrate dev --name init
```
 
### 4. Uruchom
 
```bash
npm run dev
```
 
Otwórz `http://localhost:3000` — zobaczysz pusty CRM gotowy na dane.
 
### 5. Podłącz n8n
 
W node "Wyślij do CRM" w n8n wpisz:
 
- **URL:** `http://adres-twojego-crm:3000/api/v1/integrations/n8n/email`
- **Header Auth:** `X-API-Key` z wartością z pliku `.env`
 
## Struktura
 
```
prisma/schema.prisma     — definicja bazy danych
src/app/page.tsx          — frontend CRM (dashboard, klienci, timeline)
src/app/api/              — endpointy API
  v1/integrations/n8n/email/route.ts  — odbiera dane z n8n
  customers/route.ts                   — lista klientów
  customers/[id]/route.ts              — szczegóły klienta + wydarzenia
  stats/route.ts                       — statystyki dashboard
src/lib/prisma.ts         — połączenie z bazą
src/lib/event-rules.ts    — reguły ważności wydarzeń (MAJOR/MINOR)
```
 
## Przydatne komendy
 
```bash
npm run dev          # uruchom lokalnie
npm run db:studio    # przeglądarka bazy danych (Prisma Studio)
npm run db:migrate   # zastosuj migracje
```
