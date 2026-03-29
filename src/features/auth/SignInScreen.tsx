import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { validateEmail, validatePassword } from '../../utils/validation';

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signIn, signInWithGoogle, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }

    const { error: apiError } = await signIn(email, password);
    if (apiError) setError(apiError);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: apiError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (apiError) setError(apiError);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.ui.textSec}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.ui.textSec}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error != null && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleSignIn} disabled={loading || googleLoading}>
          {loading
            ? <ActivityIndicator color={colors.ui.card} />
            : <Text style={styles.buttonText}>Sign In</Text>}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading
            ? <ActivityIndicator color={colors.ui.text} />
            : <Text style={styles.googleButtonText}>Continue with Google</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Don't have an account? Sign Up</Text>
        </Pressable>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ui.bg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ui.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.ui.textSec,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ui.text,
    backgroundColor: colors.ui.card,
    marginBottom: 12,
  },
  error: {
    color: colors.semantic.negative,
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.brand.teal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  buttonText: {
    color: colors.ui.card,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.ui.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: colors.ui.textSec,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.ui.card,
    marginBottom: 16,
  },
  googleButtonText: {
    color: colors.ui.text,
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    color: colors.brand.teal,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
