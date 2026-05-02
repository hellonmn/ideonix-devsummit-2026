import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';

const PAST_LECTURES = [
  { id: '1', date: 'Oct 12', title: 'Calculus Chapter 3' },
  { id: '2', date: 'Oct 10', title: 'Intro to Limits' },
  { id: '3', date: 'Oct 08', title: 'Functions Review' },
  { id: '4', date: 'Oct 05', title: 'Trigonometry Basics' },
];

export default function MergeLecturesScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="xmark" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merge Lectures</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Select two lectures to combine their notes into a single study guide.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {PAST_LECTURES.map((lecture) => {
          const isSelected = selectedIds.includes(lecture.id);
          return (
            <TouchableOpacity 
              key={lecture.id}
              style={[
                styles.lectureCard,
                isSelected && styles.lectureCardSelected
              ]}
              onPress={() => toggleSelection(lecture.id)}
            >
              <View style={styles.lectureInfo}>
                <Text style={styles.lectureTitle}>{lecture.title}</Text>
                <Text style={styles.lectureDate}>{lecture.date}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <IconSymbol name="checkmark" size={16} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={`Merge Selected (${selectedIds.length}/2)`}
          onPress={() => router.back()}
          style={styles.mergeButton}
          variant={selectedIds.length === 2 ? 'secondary' : 'primary'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.pink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  instructions: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 22,
  },
  content: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  lectureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  lectureCardSelected: {
    backgroundColor: Colors.light.yellow,
    ...Platform.select({
      android: {
        borderColor: 'rgba(0,0,0,0.1)',
      },
    }),
  },
  lectureInfo: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 3,
  },
  lectureDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  footer: {
    padding: 24,
  },
  mergeButton: {
    width: '100%',
  },
});
