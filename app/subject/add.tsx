import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';

const ICONS = [
  { name: 'book.fill', color: Colors.light.yellow },
  { name: 'bolt.fill', color: Colors.light.pink },
  { name: 'person.fill', color: Colors.light.blueLight },
  { name: 'folder.fill', color: Colors.light.green },
  { name: 'lightbulb', color: '#FFA07A' },
  { name: 'headphones', color: '#7FDBCA' },
  { name: 'pencil', color: '#D8C4F0' },
  { name: 'function', color: Colors.light.pink },
  { name: 'laptopcomputer', color: Colors.light.blueLight },
  { name: 'music.note', color: Colors.light.yellow },
  { name: 'chart.pie.fill', color: Colors.light.green },
  { name: 'star.fill', color: '#FFD580' },
];

import { subjectsApi } from '@/services/api';

export default function AddSubjectScreen() {
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a subject name');
      return;
    }
    
    setLoading(true);
    try {
      const icon = ICONS[selectedIcon];
      await subjectsApi.addSubject(title, description, icon.color, icon.name);
      router.back();
    } catch (err: any) {
      alert(err.message || 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <IconSymbol name="xmark" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Let's start a new subject</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Input 
          label="Name" 
          placeholder="Type subject name" 
          value={title}
          onChangeText={setTitle}
        />
        <Input 
          label="Description"
          placeholder="Describe the subject"
          multiline
          style={{ height: 100, textAlignVertical: 'top' }}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionLabel}>Icon & Color</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedIcon(index)}
              style={[
                styles.iconBox,
                { backgroundColor: icon.color },
                selectedIcon === index && styles.iconBoxSelected
              ]}
            >
              <IconSymbol name={icon.name as any} size={26} color="#000" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={loading ? "Saving..." : "Save Subject"} 
          onPress={handleSave} 
          variant="secondary" 
          disabled={loading}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
    marginTop: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxSelected: {
    borderWidth: 2.5,
    borderColor: Colors.light.primary,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
});
