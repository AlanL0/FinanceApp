# CLAUDE.md — Week 2: Authentication & Database Schema
# FinanceApp — Finance Literacy App MVP

## Project Context

You are working on **FinanceApp** at `~/Development/FinanceApp`.
This is a React Native (Expo) financial literacy app with paper trading.

### What already exists (completed in Week 1):
- Expo + TypeScript project running on device
- 5-tab bottom navigator (Home, Search, Portfolio, Learn, Profile)
- Design system: `src/core/theme/` (colors, typography, spacing, Button)
- Shared components: `src/components/` (TickerAvatar, StockRow, MetricCard, etc.)
- Utility functions: `src/utils/formatters.ts`, `src/utils/portfolio.ts`
- FinnhubService: `src/core/api/finnhubService.ts`
- Jest configured, all tests passing
- Finnhub API key in `.env` with `react-native-dotenv` configured

### Tech stack:
- React Native (Expo) + TypeScript
- React Navigation (bottom tabs + stacks)
- Zustand (state management)
- Axios, Jest + RNTL
- **NEW this week**: Supabase (PostgreSQL + Auth)

---

## Week 2 Goal

Users can sign up, log in, log out, and maintain a session that persists across app restarts.
The database schema is designed and tables are created for the full MVP.

---

## SESSION 1: Supabase Project Setup

### 1.1 Create Supabase Project
- Go to https://supabase.com and create a free account
- Create a new project called "FinanceApp"
- Wait for the project to provision (~2 minutes)
- Copy the **Project URL** and **anon public key** from Settings > API

### 1.2 Install Supabase Client
```bash
npx expo install @supabase/supabase-js
npx expo install expo-secure-store
```

### 1.3 Add Supabase credentials to .env
Add these to the existing `.env` file:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Update `env.d.ts` to include the new variables:
```typescript
declare module '@env' {
  export const FINNHUB_API_KEY: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}
```

Update `__mocks__/@env.ts`:
```typescript
export const FINNHUB_API_KEY = 'test_mock_key';
export const SUPABASE_URL = 'https://test.supabase.co';
export const SUPABASE_ANON_KEY = 'test_anon_key';
```

### 1.4 Create Supabase Client

File: `src/core/api/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Test: verify the client can be imported without errors.

---

## SESSION 2: Authentication Screens & Auth State

### 2.1 Auth Store (Zustand)

File: `src/stores/authStore.ts`
```typescript
import { create } from 'zustand';
import { supabase } from '../core/api/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
```

Test the store:
- Mock supabase module
- signUp sets loading true then false
- signIn with valid creds sets session
- signOut clears session and user
- initialize loads existing session

### 2.2 Auth Screens

Create these files:

**File: `src/features/auth/SignInScreen.tsx`**
- Email input field with validation (must contain @)
- Password input field (secureTextEntry, min 6 chars)
- "Sign In" PrimaryButton
- "Don't have an account? Sign Up" link at bottom
- Error message display (red text below form)
- Loading indicator on button during API call
- On success: navigation handled by auth state (no manual redirect)

**File: `src/features/auth/SignUpScreen.tsx`**
- Email input field with validation
- Password input field (min 6 chars)
- Confirm password field (must match)
- "Create Account" PrimaryButton
- "Already have an account? Sign In" link
- Error message display
- Success message: "Check your email for a confirmation link"

**File: `src/features/auth/ForgotPasswordScreen.tsx`**
- Email input field
- "Reset Password" PrimaryButton
- Calls `supabase.auth.resetPasswordForEmail(email)`
- Success message: "Password reset email sent"
- "Back to Sign In" link

### 2.3 Form validation helper

File: `src/utils/validation.ts`
```typescript
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match';
  return null;
}
```

Tests:
- validateEmail returns null for valid emails
- validateEmail returns error for empty, missing @, no domain
- validatePassword returns error for empty, too short
- validatePasswordMatch returns error when mismatched

### 2.4 Auth-Gated Navigation

File: `src/navigation/RootNavigator.tsx`
```typescript
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator = () => {
  const { initialized, session, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <AppNavigator /> : <AuthNavigator />;
};
```

File: `src/navigation/AuthNavigator.tsx`
- Stack navigator with: SignIn, SignUp, ForgotPassword screens

Update `App.tsx`:
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### 2.5 Profile Screen — Sign Out

Update `src/features/profile/ProfileScreen.tsx`:
- Display user email from `useAuthStore().user?.email`
- "Sign Out" button that calls `useAuthStore().signOut()`

---

## SESSION 3: Database Schema

### 3.1 Create Tables in Supabase SQL Editor

Run this SQL in the Supabase Dashboard > SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  virtual_balance DECIMAL(12,2) DEFAULT 100000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holdings table
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  shares DECIMAL(12,4) NOT NULL CHECK (shares > 0),
  avg_cost_basis DECIMAL(12,4) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type VARCHAR(6) NOT NULL CHECK (order_type IN ('market', 'limit')),
  shares DECIMAL(12,4) NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(10) DEFAULT 'executed' CHECK (status IN ('executed', 'pending', 'cancelled')),
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Pending orders table
CREATE TABLE public.pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  limit_price DECIMAL(12,4) NOT NULL,
  shares DECIMAL(12,4) NOT NULL,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create indexes for common queries
CREATE INDEX idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_user_symbol ON public.trades(user_id, symbol);
CREATE INDEX idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX idx_pending_orders_user_status ON public.pending_orders(user_id, status);
```

### 3.2 Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own row
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Holdings: full CRUD on own data
CREATE POLICY "Users can manage own holdings" ON public.holdings
  FOR ALL USING (auth.uid() = user_id);

-- Trades: read own, insert own
CREATE POLICY "Users can view own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist: full CRUD on own data
CREATE POLICY "Users can manage own watchlist" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Pending orders: full CRUD on own data
CREATE POLICY "Users can manage own orders" ON public.pending_orders
  FOR ALL USING (auth.uid() = user_id);
```

### 3.3 Auto-create user profile on signup

```sql
-- Function to create a user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, virtual_balance)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    100000.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.4 Enable email/password auth
In Supabase Dashboard:
- Go to Authentication > Providers
- Enable Email provider
- Disable "Confirm email" for development (re-enable for production)

---

## SESSION 4: Seed Data & End-to-End Test

### 4.1 Create a seed script

File: `scripts/seed-test-data.ts`

This script creates test holdings, trades, and watchlist items for the logged-in user.
Run it once for development purposes.

### 4.2 End-to-end manual test checklist:
1. Start app → see Sign In screen (not the main app)
2. Tap "Sign Up" → create account with email/password
3. Sign in with new account → see main app with 5 tabs
4. Go to Profile → see email displayed
5. Tap Sign Out → return to Sign In screen
6. Close and reopen app → still signed in (session persists)
7. Check Supabase Dashboard → user row created in public.users with $100,000 balance

### 4.3 Commit
```bash
git add .
git commit -m "feat: add auth with Supabase, database schema, and RLS policies"
git push
```

---

## File Structure After Week 2

```
src/
  core/
    api/
      supabase.ts              # Supabase client with SecureStore
      finnhubService.ts        # (from Week 1)
    auth/                      # (empty — auth logic in store)
    theme/                     # (from Week 1)
  features/
    auth/
      SignInScreen.tsx
      SignUpScreen.tsx
      ForgotPasswordScreen.tsx
    home/                      # (from Session 2 of UI work)
    profile/
      ProfileScreen.tsx        # Updated with sign out
  navigation/
    AppNavigator.tsx           # (from Week 1 — main app tabs)
    AuthNavigator.tsx          # NEW — auth stack
    RootNavigator.tsx          # NEW — auth gate
  stores/
    authStore.ts               # NEW — Zustand auth state
  utils/
    formatters.ts              # (from Week 1)
    portfolio.ts               # (from Week 1)
    validation.ts              # NEW — form validation
```

---

## Rules for Claude Code

1. **TDD** — Write test files first, then implement.
2. **Use existing theme** — Import from `src/core/theme/`. Never hardcode colors.
3. **StyleSheet.create** — No inline style objects.
4. **TypeScript strict** — Interfaces for all props. No `any`.
5. **Zustand for state** — Auth state in `src/stores/authStore.ts`.
6. **Supabase calls only through the client** — Never use raw fetch to Supabase.
7. **Mock Supabase in tests** — Use `jest.mock('@supabase/supabase-js')`.
8. **Conventional commits** — `feat:`, `test:`, `chore:` prefixes.
9. **Run tests after each file** — `npx jest --verbose`.
10. **SQL runs in Supabase Dashboard** — Not from the app. Provide the SQL for copy-paste.

## Execution Order

```
Session 1:
  1. Create Supabase project (manual — Dashboard)
  2. Install @supabase/supabase-js + expo-secure-store
  3. Update .env, env.d.ts, __mocks__/@env.ts
  4. Create src/core/api/supabase.ts

Session 2:
  5. Create src/utils/validation.ts + tests
  6. Create src/stores/authStore.ts + tests
  7. Create src/features/auth/SignInScreen.tsx + test
  8. Create src/features/auth/SignUpScreen.tsx + test
  9. Create src/features/auth/ForgotPasswordScreen.tsx
  10. Create src/navigation/AuthNavigator.tsx
  11. Create src/navigation/RootNavigator.tsx
  12. Update App.tsx

Session 3 (manual — Supabase Dashboard):
  13. Run CREATE TABLE SQL
  14. Run RLS policies SQL
  15. Run trigger SQL
  16. Enable email auth provider

Session 4:
  17. Update ProfileScreen with sign out
  18. End-to-end manual test
  19. Commit and push
```
