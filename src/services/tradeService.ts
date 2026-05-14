import { Trade, TradeSide } from '../core/api/database.types';
import { supabase } from '../core/api/supabase';
import { requireAuthenticatedUserId } from './authContext';

interface SupabaseErrorLike {
  message: string;
}

interface TradeHistoryResult {
  data: Trade[] | null;
  error: SupabaseErrorLike | null;
}

interface TradeCountResult {
  count: number | null;
  error: SupabaseErrorLike | null;
}

function getErrorMessage(error: SupabaseErrorLike): string {
  return error.message || 'Unknown Supabase error';
}

export async function getTradeHistory(side?: TradeSide): Promise<Trade[]> {
  const userId = await requireAuthenticatedUserId();

  let query = supabase.from('trades').select('*').eq('user_id', userId);

  if (side) {
    query = query.eq('side', side);
  }

  const { data, error } = (await query.order('executed_at', {
    ascending: false,
  })) as TradeHistoryResult;

  if (error) {
    throw new Error(`Unable to load trade history: ${getErrorMessage(error)}`);
  }

  return data ?? [];
}

export async function getTradeCount(): Promise<number> {
  const userId = await requireAuthenticatedUserId();

  const { count, error } = (await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)) as TradeCountResult;

  if (error) {
    throw new Error(`Unable to load trade count: ${getErrorMessage(error)}`);
  }

  return count ?? 0;
}
