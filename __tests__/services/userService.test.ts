jest.mock('../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '../../src/core/api/supabase';
import { UserProfile } from '../../src/core/api/database.types';
import { getBalance, getCurrentUser } from '../../src/services/userService';
import {
  createQueryBuilderMock,
  mockSupabaseAuthUser,
  mockSupabaseFrom,
  mockSupabaseUnauthenticated,
} from '../../test-utils/mockSupabase';

const userProfile: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  virtual_balance: 10000,
  created_at: '2026-05-14T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userService', () => {
  it('getCurrentUser returns data when authenticated', async () => {
    mockSupabaseAuthUser(userProfile.id);
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({ data: userProfile, error: null }),
    });
    mockSupabaseFrom('users', builder);

    await expect(getCurrentUser()).resolves.toEqual(userProfile);
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.eq).toHaveBeenCalledWith('id', userProfile.id);
    expect(builder.single).toHaveBeenCalled();
  });

  it('getCurrentUser returns null when unauthenticated', async () => {
    mockSupabaseUnauthenticated();

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('getBalance returns virtual_balance', async () => {
    mockSupabaseAuthUser(userProfile.id);
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({
        data: { virtual_balance: userProfile.virtual_balance },
        error: null,
      }),
    });
    mockSupabaseFrom('users', builder);

    await expect(getBalance()).resolves.toBe(userProfile.virtual_balance);
    expect(builder.select).toHaveBeenCalledWith('virtual_balance');
    expect(builder.eq).toHaveBeenCalledWith('id', userProfile.id);
  });

  it('getBalance returns null when unauthenticated', async () => {
    mockSupabaseUnauthenticated();

    await expect(getBalance()).resolves.toBeNull();
  });

  it('getCurrentUser throws readable error on Supabase failure', async () => {
    mockSupabaseAuthUser(userProfile.id);
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    });
    mockSupabaseFrom('users', builder);

    await expect(getCurrentUser()).rejects.toThrow('Failed to load current user: database unavailable');
  });

  it('getBalance throws readable error on Supabase failure', async () => {
    mockSupabaseAuthUser(userProfile.id);
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    });
    mockSupabaseFrom('users', builder);

    await expect(getBalance()).rejects.toThrow('Failed to load balance: database unavailable');
  });
});
