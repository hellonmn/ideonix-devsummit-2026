import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AntDesign from '@expo/vector-icons/AntDesign';
import { authApi, ApiError } from '@/services/api';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(name, email, password);
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // In production, trigger Google Sign-In SDK and get the ID token.
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
            <IconSymbol name="chevron.left" size={22} color="#1A3A1A" />
          </TouchableOpacity>
          <Image 
            source={require('@/assets/images/mascot_register_v2.png')} 
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.inputContainer}>
            <IconSymbol name="person.fill" size={18} color="#BBB" />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#CCC"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <IconSymbol name="pencil" size={18} color="#BBB" />
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
              placeholder="Password (min 8 chars)"
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

          {/* Create Account */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
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
            onPress={handleGoogleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            <AntDesign name="google" size={18} color="#000" />
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text style={styles.signinLink}>Sign In</Text>
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
    backgroundColor: Colors.light.green,
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
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    color: '#1A3A1A',
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
  createButton: {
    backgroundColor: '#1A3A1A',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A1A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
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
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  signinLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3A1A',
  },
});
