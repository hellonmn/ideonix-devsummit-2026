import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';

const MOCK_LECTURES = [
  { id: '1', title: 'Calculus Chapter 3', date: 'Oct 12', duration: '45 mins', icon: 'function' },
  { id: '2', title: 'Intro to Limits', date: 'Oct 10', duration: '50 mins', icon: 'line.diagonal' },
  { id: '3', title: 'Derivatives 101', date: 'Oct 08', duration: '38 mins', icon: 'arrow.up.right' },
];

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  
  const subjectName = id === '2' ? 'Physics' : 'Mathematics';
  const subjectColor = id === '2' ? Colors.light.green : Colors.light.yellow;
  const subjectIcon = id === '2' ? 'lightbulb' : 'function';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBanner, { backgroundColor: subjectColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subject Details</Text>
          <TouchableOpacity style={styles.moreButton}>
            <IconSymbol name="ellipsis" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.subjectHero}>
          <View style={styles.iconContainer}>
            <IconSymbol name={subjectIcon as any} size={40} color="#000" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.subjectNameText}>{subjectName}</Text>
            <Text style={styles.subjectSubtitle}>12 Lectures • 88% Progress</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActions}>
          <Card 
            backgroundColor={Colors.light.primary} 
            style={styles.actionCard}
            onPress={() => router.push('/lecture/record')}
          >
            <View style={styles.actionIconWrap}>
              <IconSymbol name="mic.fill" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionCardTitle}>Record Now</Text>
          </Card>

          <Card 
            backgroundColor={Colors.light.pink} 
            style={styles.actionCard}
            onPress={() => router.push('/lecture/merge')}
          >
            <View style={styles.actionIconWrap}>
              <IconSymbol name="plus.rectangle.on.rectangle" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionCardTitle}>Merge Notes</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Lectures</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {MOCK_LECTURES.map((lecture, index) => (
          <TouchableOpacity 
            key={lecture.id}
            onPress={() => router.push(`/lecture/${lecture.id}`)}
            activeOpacity={0.8}
          >
            <Card style={styles.lectureCard}>
              <View style={styles.lectureMain}>
                <View style={styles.lectureIconBox}>
                  <IconSymbol name={lecture.icon as any} size={22} color={subjectColor === Colors.light.yellow ? '#D4A017' : '#2D6A2E'} />
                </View>
                <View style={styles.lectureDetails}>
                  <Text style={styles.lectureTitleText}>{lecture.title}</Text>
                  <Text style={styles.lectureSubText}>{lecture.date} • {lecture.duration}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#CCC" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Card backgroundColor="#1A1A2E" style={styles.mascotCard}>
          <View style={styles.mascotContent}>
            <View style={styles.mascotTextContainer}>
              <Text style={styles.mascotTitle}>You're doing great!</Text>
              <Text style={styles.mascotSubtitle}>3 more lectures to complete the Calculus module. Keep going!</Text>
            </View>
            <Image 
              source={require('@/assets/images/mascot_celebrate.png')} 
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBanner: {
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  subjectHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
    }),
  },
  heroText: {
    marginLeft: 20,
    flex: 1,
  },
  subjectNameText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  subjectSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 4,
  },
  content: {
    padding: 24,
    paddingTop: 32,
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
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  lectureCard: {
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  lectureMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lectureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lectureDetails: {
    flex: 1,
    marginLeft: 16,
  },
  lectureTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
  },
  lectureSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  mascotCard: {
    marginTop: 24,
    padding: 20,
  },
  mascotContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascotTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  mascotTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  mascotSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    lineHeight: 18,
  },
  mascotImage: {
    width: 80,
    height: 80,
  },
});
