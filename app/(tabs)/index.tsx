import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal, FlatList, RefreshControl } from 'react-native';
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
  const [user, setUser] = useState<{name: string} | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      console.log('[Home] Fetching home data...');
      const [userData, subjectsData] = await Promise.all([
        authApi.getMe(),
        subjectsApi.getSubjects()
      ]);
      console.log('[Home] Got user:', userData?.user?.name, '| Subjects:', subjectsData?.length);
      setUser(userData.user);
      setSubjects(subjectsData);
    } catch (err: any) {
      console.error('[Home] Refresh error:', err?.message, err?.status, err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  const handleStartRecording = (subject?: any) => {
    if (subject) {
      setShowSubjectModal(false);
      router.push({
        pathname: '/lecture/record',
        params: { subjectId: subject.id, subjectTitle: subject.title }
      });
    } else {
      setShowSubjectModal(true);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHomeData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
      >
        
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
              <Text style={styles.bannerTitle}>Unleash Your Potential!</Text>
              <Text style={styles.bannerSubtitle}>You're on fire! Ready to crush today's lectures?</Text>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => handleStartRecording()}
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
              onPress={() => action.id === 'record' ? handleStartRecording() : router.push(action.route as any)}
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

      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSubjectModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <IconSymbol name="xmark" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Which subject are you recording for today?</Text>
            
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.subjectItem}
                  onPress={() => handleStartRecording(item)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: item.color || Colors.light.primary }]}>
                    <IconSymbol name={(item.icon || 'book.fill') as any} size={20} color="#FFF" />
                  </View>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectItemTitle}>{item.title}</Text>
                    <Text style={styles.subjectItemDesc}>{item.description || 'No description'}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color="#CCC" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySubjects}>
                  <Text style={styles.emptyText}>No subjects found.</Text>
                  <TouchableOpacity 
                    style={styles.addSubjectButton}
                    onPress={() => {
                      setShowSubjectModal(false);
                      router.push('/subject/add');
                    }}
                  >
                    <Text style={styles.addSubjectText}>Add Subject</Text>
                  </TouchableOpacity>
                </View>
              }
              contentContainerStyle={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },
  modalList: {
    paddingBottom: 20,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  subjectItemDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  emptySubjects: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addSubjectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
  },
  addSubjectText: {
    color: '#FFF',
    fontWeight: '700',
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
