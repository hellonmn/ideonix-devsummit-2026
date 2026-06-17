import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AntDesign from '@expo/vector-icons/AntDesign';
import { authApi, ApiError } from '@/services/api';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    console.log('[SignIn] Starting login...');
    setLoading(true);
    try {
      console.log('[SignIn] Calling authApi.login...');
      await authApi.login(email, password);
      console.log('[SignIn] Login successful, navigating...');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('[SignIn] Login failed:', err?.message, err?.status);
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Sign In Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // In production, trigger Google Sign-In SDK and get the ID token.
    // For now, navigate to setup-profile as a placeholder.
    router.push('/setup-profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Image 
            source={require('@/assets/images/mascot_login_secure.png')} 
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
        </View>

        <View style={styles.formCard}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <IconSymbol name="person.fill" size={18} color="#BBB" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#CCC"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={18} color="#BBB" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#CCC"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <IconSymbol name={showPassword ? "eye" : "eye.slash"} size={20} color="#BBB" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            <AntDesign name="google" size={18} color="#000" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>No account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up' as any)}>
              <Text style={styles.signupLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  image: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 8,
    marginBottom: 20,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  signInButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCC',
    marginHorizontal: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.primary,
  },
});
