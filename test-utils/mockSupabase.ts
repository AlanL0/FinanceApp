import { supabase } from '../src/core/api/supabase';

export interface QueryBuilderMock {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
}

export function mockSupabaseAuthUser(userId = 'user-123') {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

export function mockSupabaseUnauthenticated() {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

export function createQueryBuilderMock(overrides: Partial<QueryBuilderMock> = {}): QueryBuilderMock {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as QueryBuilderMock;

  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);

  Object.entries(overrides).forEach(([key, value]) => {
    builder[key as keyof QueryBuilderMock] = value;
  });

  return builder;
}

export function mockSupabaseFrom(tableName: string, builder: QueryBuilderMock) {
  (supabase.from as jest.Mock).mockImplementation((requestedTable: string) => {
    if (requestedTable !== tableName) {
      throw new Error(`Unexpected table: ${requestedTable}`);
    }

    return builder;
  });
}
