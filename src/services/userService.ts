import { supabase } from '../core/api/supabase';
import { UserProfile } from '../core/api/database.types';
import { getAuthenticatedUserId } from './authContext';

interface SupabaseResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

function getSupabaseErrorMessage(error: { message?: string }): string {
  return error.message || 'Unknown Supabase error';
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to load current user: ${getSupabaseErrorMessage(error)}`);
  }

  return data;
}

export async function getBalance(): Promise<number | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = (await supabase
    .from('users')
    .select('virtual_balance')
    .eq('id', userId)
    .single()) as SupabaseResult<Pick<UserProfile, 'virtual_balance'>>;

  if (error) {
    throw new Error(`Failed to load balance: ${getSupabaseErrorMessage(error)}`);
  }

  if (!data) {
    throw new Error('Failed to load balance: No user returned');
  }

  return data.virtual_balance;
}
