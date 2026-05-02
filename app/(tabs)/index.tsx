import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authApi, subjectsApi } from '@/services/api';

const MOCK_DATES = [
  { day: 'Mon', date: '11', active: false },
  { day: 'Tue', date: '12', active: true },
  { day: 'Wed', date: '13', active: false, highlight: true },
  { day: 'Thu', date: '14', active: false },
  { day: 'Fri', date: '15', active: false },
];

const QUICK_ACTIONS = [
  { id: 'record', title: 'Record', icon: 'mic.fill', color: '#FF4B4B', route: '/lecture/record' },
  { id: 'quiz', title: 'Quiz', icon: 'questionmark.circle', color: '#4CAF50', route: '/(tabs)/explore' },
  { id: 'scan', title: 'Scan', icon: 'pencil', color: '#2196F3', route: '/(tabs)/explore' },
  { id: 'more', title: 'More', icon: 'plus', color: '#9C27B0', route: '/(tabs)/explore' },
];

export default function HomeScreen() {
  const [user, setUser] = React.useState<{name: string} | null>(null);
  const [subjects, setSubjects] = React.useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      authApi.getMe().then(data => setUser(data.user)).catch(() => {});
      subjectsApi.getSubjects().then(data => setSubjects(data)).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{user?.name ? user.name.split(' ')[0] : 'Student'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="chart.bar.fill" size={22} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="bell.fill" size={22} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        <Card backgroundColor={Colors.light.primary} style={styles.mascotBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <View style={styles.streakBadge}>
                <IconSymbol name="bolt.fill" size={14} color="#FFF" />
                <Text style={styles.streakText}>5 DAY STREAK</Text>
              </View>
              <Text style={styles.bannerTitle}>Unleash Your Potential!</Text>
              <Text style={styles.bannerSubtitle}>You're on fire! Ready to crush today's lectures?</Text>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/lecture/record')}
              >
                <Text style={styles.bannerButtonText}>Start Recording</Text>
                <IconSymbol name="chevron.right" size={16} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.mascotCircle}>
              <Image 
                source={require('@/assets/images/mascot_study.png')} 
                style={styles.bannerMascot}
                resizeMode="contain"
              />
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsContainer}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionItem}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <IconSymbol name={action.icon as any} size={24} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          <TouchableOpacity onPress={() => router.push('/subject/add')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IconSymbol name="plus" size={16} color={Colors.light.primary} />
              <Text style={styles.viewAll}>Add New</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.gridContainer}>
          {subjects.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: '#888' }}>
              No subjects yet. Click "View All" to manage or create a new subject!
            </Text>
          ) : (
            <>
              <View style={styles.column}>
                {subjects.filter((_, i) => i % 2 === 0).map(subject => (
                  <Card 
                    key={subject.id} 
                    backgroundColor={subject.color || Colors.light.yellow}
                    style={styles.subjectCard}
                    onPress={() => router.push(`/subject/${subject.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.iconCircle}>
                        <IconSymbol name={(subject.icon as any) || 'book.fill'} size={22} color="#000" />
                      </View>
                      <View style={styles.circleOutline} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.subjectTitle}>{subject.title}</Text>
                      <Text style={styles.subjectDesc}>{subject.description || ''}</Text>
                    </View>
                  </Card>
                ))}
              </View>
              <View style={styles.column}>
                {subjects.filter((_, i) => i % 2 !== 0).map((subject, idx) => (
                  <Card 
                    key={subject.id} 
                    backgroundColor={subject.color || Colors.light.green}
                    style={[styles.subjectCard, idx === 0 && { marginTop: 40 }]}
                    onPress={() => router.push(`/subject/${subject.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.iconCircle}>
                        <IconSymbol name={(subject.icon as any) || 'book.fill'} size={22} color="#000" />
                      </View>
                      <View style={styles.circleOutline} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.subjectTitle}>{subject.title}</Text>
                      <Text style={styles.subjectDesc}>{subject.description || ''}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  name: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000',
    lineHeight: 40,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mascotBanner: {
    padding: 24,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 20,
  },
  bannerButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButtonText: {
    fontWeight: '900',
    color: Colors.light.primary,
    fontSize: 15,
  },
  mascotCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerMascot: {
    width: 80,
    height: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  subjectCard: {
    height: 160,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardContent: {
    marginTop: 'auto',
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    marginBottom: 3,
  },
  subjectDesc: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '600',
  },
});
