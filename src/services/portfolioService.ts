import { supabase } from '../core/api/supabase';
import { Holding } from '../core/api/database.types';
import { requireAuthenticatedUserId } from './authContext';

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function getSupabaseErrorMessage(error: { message?: string }): string {
  return error.message || 'Unknown Supabase error';
}

export async function getHoldings(): Promise<Holding[]> {
  const userId = await requireAuthenticatedUserId();

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .order('symbol', { ascending: true });

  if (error) {
    throw new Error(`Failed to load holdings: ${getSupabaseErrorMessage(error)}`);
  }

  return data ?? [];
}

export async function getHolding(symbol: string): Promise<Holding | null> {
  const userId = await requireAuthenticatedUserId();
  const normalizedSymbol = normalizeSymbol(symbol);

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', normalizedSymbol)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load holding: ${getSupabaseErrorMessage(error)}`);
  }

  return data;
}
