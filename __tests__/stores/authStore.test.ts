import { act, renderHook } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'financeapp://'),
}));

jest.mock('../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/core/api/supabase';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

beforeEach(() => {
  useAuthStore.setState({ session: null, user: null, loading: false, initialized: false });
  jest.clearAllMocks();
  (mockAuth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe('authStore — initialize', () => {
  it('loads existing session and sets initialized', async () => {
    const mockSession = { user: { id: '123', email: 'test@example.com' } } as any;
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.initialize(); });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.initialized).toBe(true);
  });

  it('sets initialized even when no session exists', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.initialize(); });

    expect(result.current.session).toBeNull();
    expect(result.current.initialized).toBe(true);
  });
});

describe('authStore — signUp', () => {
  it('resets loading to false after completion', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.signUp('test@example.com', 'password123'); });

    expect(result.current.loading).toBe(false);
  });

  it('returns null error on success', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: 'not set' };
    await act(async () => { response = await result.current.signUp('test@example.com', 'password123'); });

    expect(response.error).toBeNull();
  });

  it('returns error message on failure', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: { message: 'Email already registered' } });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: null };
    await act(async () => { response = await result.current.signUp('test@example.com', 'password123'); });

    expect(response.error).toBe('Email already registered');
  });
});

describe('authStore — signIn', () => {
  it('returns null error on success', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: 'not set' };
    await act(async () => { response = await result.current.signIn('test@example.com', 'password123'); });

    expect(response.error).toBeNull();
  });

  it('returns error message on failure', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({ error: { message: 'Invalid credentials' } });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: null };
    await act(async () => { response = await result.current.signIn('test@example.com', 'wrongpassword'); });

    expect(response.error).toBe('Invalid credentials');
  });
});

describe('authStore — signInWithGoogle', () => {
  it('returns null error when browser session succeeds', async () => {
    const WebBrowser = require('expo-web-browser');
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://google.com/oauth' }, error: null });
    (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({ error: null });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success', url: 'financeapp://?code=abc' });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: 'not set' };
    await act(async () => { response = await result.current.signInWithGoogle(); });

    expect(response.error).toBeNull();
    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('financeapp://?code=abc');
  });

  it('returns null error when user cancels browser', async () => {
    const WebBrowser = require('expo-web-browser');
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://google.com/oauth' }, error: null });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: 'not set' };
    await act(async () => { response = await result.current.signInWithGoogle(); });

    expect(response.error).toBeNull();
    expect(mockAuth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('returns error when OAuth initiation fails', async () => {
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: null },
      error: { message: 'Provider not enabled' },
    });

    const { result } = renderHook(() => useAuthStore());
    let response: { error: string | null } = { error: null };
    await act(async () => { response = await result.current.signInWithGoogle(); });

    expect(response.error).toBe('Provider not enabled');
  });
});

describe('authStore — signOut', () => {
  it('clears session and user', async () => {
    useAuthStore.setState({
      session: { user: { id: '123' } } as any,
      user: { id: '123' } as any,
    });
    (mockAuth.signOut as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.signOut(); });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
