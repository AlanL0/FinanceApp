import { supabase } from '../core/api/supabase';
import type { WatchlistItem } from '../core/api/database.types';
import { requireAuthenticatedUserId } from './authContext';

interface SupabaseReadableError {
  code?: string;
  message?: string;
}

interface SupabaseQueryResult<T> {
  data: T | null;
  error: SupabaseReadableError | null;
}

interface WatchlistOrderQuery {
  order(column: 'added_at', options: { ascending: boolean }): Promise<SupabaseQueryResult<WatchlistItem[]>>;
}

interface WatchlistFilterQuery {
  eq(column: 'user_id', value: string): WatchlistOrderQuery;
}

interface WatchlistInsertQuery {
  select(columns: '*'): {
    single(): Promise<SupabaseQueryResult<WatchlistItem>>;
  };
}

interface WatchlistDeleteFirstFilterQuery {
  eq(column: 'user_id', value: string): WatchlistDeleteSecondFilterQuery;
}

interface WatchlistDeleteSecondFilterQuery {
  eq(column: 'symbol', value: string): Promise<{ error: SupabaseReadableError | null }>;
}

interface WatchlistTableQuery {
  select(columns: '*'): WatchlistFilterQuery;
  insert(values: { user_id: string; symbol: string }): WatchlistInsertQuery;
  delete(): WatchlistDeleteFirstFilterQuery;
}

interface WatchlistSupabaseClient {
  from(table: 'watchlist'): WatchlistTableQuery;
}

const watchlistSupabase = supabase as unknown as WatchlistSupabaseClient;

function normalizeSymbol(symbol: string): string {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error('Symbol is required');
  }

  return normalizedSymbol;
}

function getErrorMessage(error: SupabaseReadableError): string {
  return error.message || 'Unknown Supabase error';
}

function isDuplicateError(error: SupabaseReadableError): boolean {
  const message = error.message?.toLowerCase() ?? '';

  return error.code === '23505' || message.includes('duplicate');
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await watchlistSupabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: true });

  if (error) {
    throw new Error(`Unable to fetch watchlist: ${getErrorMessage(error)}`);
  }

  return data ?? [];
}

export async function addSymbol(symbol: string): Promise<WatchlistItem> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await watchlistSupabase
    .from('watchlist')
    .insert({ user_id: userId, symbol: normalizedSymbol })
    .select('*')
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      throw new Error('Symbol is already in watchlist');
    }

    throw new Error(`Unable to add symbol: ${getErrorMessage(error)}`);
  }

  if (!data) {
    throw new Error('Unable to add symbol: No watchlist item returned');
  }

  return data;
}

export async function removeSymbol(symbol: string): Promise<void> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const userId = await requireAuthenticatedUserId();
  const { error } = await watchlistSupabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', normalizedSymbol);

  if (error) {
    throw new Error(`Unable to remove symbol: ${getErrorMessage(error)}`);
  }
}
