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
      signUp: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import { SignUpScreen } from '../../../src/features/auth/SignUpScreen';
import { supabase } from '../../../src/core/api/supabase';

beforeEach(() => jest.clearAllMocks());

describe('SignUpScreen', () => {
  it('renders email, password, and confirm password inputs', () => {
    const { getByPlaceholderText } = render(<SignUpScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
  });

  it('renders the Create Account button', () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('renders the Sign In link', () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText('Already have an account? Sign In')).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'different');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => expect(getByText('Passwords do not match')).toBeTruthy());
  });

  it('shows success message on sign up', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() =>
      expect(getByText('Check your email for a confirmation link')).toBeTruthy()
    );
  });

  it('shows API error on failed sign up', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      error: { message: 'Email already registered' },
    });
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => expect(getByText('Email already registered')).toBeTruthy());
  });

  it('navigates to SignIn when link is tapped', () => {
    const { getByText } = render(<SignUpScreen />);
    fireEvent.press(getByText('Already have an account? Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('SignIn');
  });
});
