import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'financeapp://'),
}));

import { SignInScreen } from '../../../src/features/auth/SignInScreen';
import { supabase } from '../../../src/core/api/supabase';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignInScreen', () => {
  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<SignInScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders the Sign In button', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders the Sign Up link', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText("Don't have an account? Sign Up")).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'notanemail');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(getByText('Invalid email format')).toBeTruthy());
  });

  it('shows validation error for short password', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'abc');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(getByText('Password must be at least 6 characters')).toBeTruthy());
  });

  it('shows API error on failed sign in', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(getByText('Invalid login credentials')).toBeTruthy());
  });

  it('navigates to SignUp when link is tapped', () => {
    const { getByText } = render(<SignInScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('renders the Continue with Google button', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText('Continue with Google')).toBeTruthy();
  });
});
