import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        setHasToken(!!token);
      } catch (e) {
        console.error('Failed to check token', e);
      } finally {
        setIsLoading(false);
      }
    }
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ACEE80' }}>
        <ActivityIndicator size="large" color="#2D6A2E" />
      </View>
    );
  }

  if (hasToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
