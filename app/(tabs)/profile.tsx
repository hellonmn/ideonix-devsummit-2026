import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authApi } from '@/services/api';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authApi.getMe();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.replace('/sign-in');
    } catch (err) {
      Alert.alert('Logout Error', 'There was a problem logging out.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <IconSymbol name="person.fill" size={44} color="#FFF" />
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 10 }} />
        ) : (
          <>
            <Text style={styles.name}>{user?.name || 'Student'}</Text>
            <Text style={styles.email}>{user?.email || 'student@university.edu'}</Text>
          </>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.light.yellow }]}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Lectures</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.light.green }]}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.light.pink }]}>
          <Text style={styles.statNumber}>8h</Text>
          <Text style={styles.statLabel}>Recorded</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem}>
          <IconSymbol name="gear" size={22} color="#555" />
          <Text style={styles.menuText}>Settings</Text>
          <IconSymbol name="chevron.right" size={18} color="#CCC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <IconSymbol name="questionmark.circle" size={22} color="#555" />
          <Text style={styles.menuText}>Help & Support</Text>
          <IconSymbol name="chevron.right" size={18} color="#CCC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <IconSymbol name="info.circle" size={22} color="#555" />
          <Text style={styles.menuText}>About</Text>
          <IconSymbol name="chevron.right" size={18} color="#CCC" />
        </TouchableOpacity>
        
        {/* Logout Button */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <IconSymbol name="arrow.right.square" size={22} color="#E53935" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  email: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 4,
  },
  menuList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginLeft: 14,
  },
  logoutItem: {
    marginTop: 10,
    backgroundColor: '#FFF5F5',
    ...Platform.select({
      android: {
        borderColor: '#FFEBEE',
      }
    }),
  },
  logoutText: {
    color: '#E53935',
  },
});
