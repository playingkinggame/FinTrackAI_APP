# FinTrack AI — Android-first personal finance app

A React Native + Expo + TypeScript MVP with local persistence, transaction management,
budgets, analytics, optional Supabase authentication/data sync foundations, and an
AI assistant endpoint implemented as a Supabase Edge Function.

## What works in this MVP

- Dashboard with income, expenses, balance and recent activity
- Add, edit and delete income/expense transactions
- Search and filter transaction history
- Monthly category analytics
- Create and delete monthly budgets
- Persistent local data using AsyncStorage
- Optional Supabase email/password authentication
- Supabase schema with Row Level Security policies
- AI assistant calls a server-side Supabase Edge Function
- Works in local/demo mode without Supabase credentials

## Important scope and safety notes

This is a learning MVP, not a regulated banking product. It does not connect to bank
accounts, read SMS messages, move money, or provide regulated investment/tax advice.
Use sample data while developing. Do not commit secrets or real financial records.
The Gemini API key belongs only in the Edge Function secret store, never in the app.

## 1. Prerequisites

- Node.js LTS
- VS Code
- Expo Go on an Android phone, or Android Studio + Android SDK/emulator
- A Supabase account (optional for local mode; required for cloud auth and AI)

## 2. Install

From this folder:

```bash
npm install
npx expo install --fix
```

If Expo reports missing native packages, install the Expo-compatible versions:

```bash
npx expo install expo-router expo-secure-store expo-status-bar \
  react-native-safe-area-context react-native-screens \
  @react-native-async-storage/async-storage
npm install @supabase/supabase-js react-native-url-polyfill
```

Create `.env` by copying `.env.example`. For cloud features, add your Supabase
Project URL and anon/public key:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The anon key is designed for client use when Row Level Security is correctly enabled.
Never use a service-role key in the mobile app.

Start:

```bash
npx expo start
```

Scan the QR code with Expo Go. For a physical device, ensure the phone and computer
can reach each other on the same network. If LAN discovery fails, try:

```bash
npx expo start --tunnel
```

## 3. Supabase setup

1. Create a project at https://supabase.com/dashboard
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and anon key into `.env`.
5. In Authentication settings, enable Email authentication.
6. Restart Expo after changing `.env`.

The app remains usable in local-only mode if Supabase is not configured. Local mode
stores data on the device. It does not sync across devices.

## 4. Deploy the AI Edge Function

The function is in `supabase/functions/financial-assistant/index.ts`.

Install the Supabase CLI and log in:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy financial-assistant
```

The app sends the current user's question and a limited transaction summary to this
function. The function verifies the user's JWT before calling Gemini. Configure the
Gemini model/API access in Google AI Studio. Check current Gemini API model availability
and pricing before production use.

## 5. Run type checking

```bash
npx tsc --noEmit
```

## 6. Android build

For a development/production build, configure EAS:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

For Play Store distribution, create a production AAB:

```bash
eas build --platform android --profile production
```

You must configure your own Android package identifier, app icon, privacy policy,
store listing, signing, data-safety disclosures and testing before release.

## Folder structure

```text
app/                    Expo Router screens
components/             Reusable UI components
context/                App state and local persistence
lib/                    Supabase client and theme
services/               AI and auth services
types/                  TypeScript data models
utils/                  Currency/date/calculation helpers
supabase/schema.sql     Database tables and RLS policies
supabase/functions/     Secure server-side AI function
```

## Suggested next improvements

- Add automated unit and UI tests.
- Add encrypted local storage and a clear backup/restore flow.
- Implement robust cloud sync and conflict handling.
- Add pagination and database-backed analytics for large datasets.
- Add accessibility testing, privacy review and security audit.
- Add receipt OCR only after the core app is stable.
