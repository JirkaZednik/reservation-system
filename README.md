# Rezervační systém

Webová aplikace pro rezervaci sportovních hřišť. Uživatel si vybere datum, jedno až osm časových slotů a hřiště; aktuální obsazenost se načítá ze Supabase. Po vytvoření rezervace systém odešle potvrzovací e-mail s odkazem pro její správu a zrušení. 

## Funkce

- Výběr datumu, hřiště a dostupných hodinových slotů.
- Validace formuláře na klientovi i serveru.
- Kontrola dostupnosti a ukládání rezervací do Supabase.
- Potvrzovací e-mail a možnost zrušit rezervaci přes zabezpečený odkaz.
- Administrace chráněná přihlášením a rolí správce/admin.
- Omezení počtu požadavků na vytváření rezervací.
- Responzivní rozhraní a navigace mezi stránkami bez opětovného načtení aplikace (SPA)

## Použité technologie

- React + TypeScript + Vite
- SCSS
- React Router
- React Hook Form + Zod
- Supabase - Auth, PostgreSQL, Row-Level Security, Edge Functions
- Resend pro emailing
- Vercel

## Požadavky

- Node.js a npm
- Supabase projekt s aplikovanými migracemi a nasazenými Edge Functions (create-reservation, cancel-reservation)
- Resend účet a ověřená odesílací e-mailová adresa pro odesílání potvrzení

## Spuštění lokálně

Nainstaluj závislosti a vytvoř lokální env soubor z ukázky:

```powershell
npm install
Copy-Item .env.example .env.local
```

Doplň do `.env.local` údaje svého Supabase projektu:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Potom spusť vývojový server:

```bash
npm run dev
```

Vite vypíše lokální adresu aplikace, obvykle `http://localhost:5173`.

Pro odesílání rezervací a e-mailů musí být v Supabase nastavené také Edge Functions a jejich tajné proměnné, včetně `RESEND_API_KEY`, `RESERVATION_EMAIL_FROM` a `APP_URL`. `SUPABASE_SERVICE_ROLE_KEY` patří výhradně na server do prostředí Edge Functions; nikdy ho nevkládej do `VITE_*` proměnné ani do klientského kódu.

## Dostupné příkazy

```bash
npm run dev      # vývojový server
npm run lint     # kontrola ESLintem
npm run build    # TypeScript kontrola a produkční sestavení
npm run preview  # lokální náhled sestavené aplikace
```

Produkční soubory se vytvoří ve složce `dist/`.

## Struktura projektu

- `src/pages/` – stránky aplikace
- `src/components/` – opakovaně použitelné komponenty včetně kalendáře dostupnosti
- `src/schemas/` – validační schémata formulářů
- `src/services/` – komunikace frontendové aplikace se Supabase funkcemi
- `src/lib/` – konfigurace klienta Supabase
- `supabase/migrations/` – databázové tabulky, omezení, RLS politiky a funkce
- `supabase/functions/` – Edge Functions pro vytváření a rušení rezervací

## Bezpečnost

Databázové tabulky používají Row-Level Security. Oprávnění správce se ověřuje podle role v `app_metadata`; veřejné vytváření a rušení rezervací zpracovávají Edge Functions. Soubor `.env.local` ani jiné soubory se skutečnými tajnými hodnotami necommituj do GitHubu (.gitignore).
