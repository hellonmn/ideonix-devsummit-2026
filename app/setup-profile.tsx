import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/icon-symbol';

const EDUCATION_LEVELS = ['High School', 'Undergraduate', 'Postgraduate', 'Other'];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function SetupProfileScreen() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  // Custom Date Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2000);

  const [education, setEducation] = useState('');
  const [institution, setInstitution] = useState('');

  const isValid = name.trim().length > 0;

  const handleConfirmDate = () => {
    const formattedDay = selectedDay.toString().padStart(2, '0');
    const formattedMonth = (selectedMonth + 1).toString().padStart(2, '0');
    setDob(`${formattedDay} / ${formattedMonth} / ${selectedYear}`);
    setShowPicker(false);
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Image 
              source={require('@/assets/images/mascot_avatar_v2.png')} 
              style={{ width: 104, height: 104 }} 
              resizeMode="cover" 
            />
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Edit Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <View pointerEvents="none">
              <Input
                label="Date of Birth"
                placeholder="DD / MM / YYYY"
                value={dob}
                editable={false}
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Education Level</Text>
          <View style={styles.chipGrid}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  education === level && styles.chipActive,
                ]}
                onPress={() => setEducation(level)}
              >
                <Text style={[
                  styles.chipText,
                  education === level && styles.chipTextActive,
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Institution / College"
            placeholder="e.g. MIT, Stanford, etc."
            value={institution}
            onChangeText={setInstitution}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={() => {
            if (isValid) router.replace('/(tabs)');
          }}
          activeOpacity={0.85}
          disabled={!isValid}
        >
          <Text style={[styles.continueText, !isValid && styles.continueTextDisabled]}>
            Continue
          </Text>
          <IconSymbol name="chevron.right" size={20} color={isValid ? '#FFF' : '#999'} />
        </TouchableOpacity>
      </View>

      {/* Custom Date Picker Modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleConfirmDate}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {/* Day Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Day</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                    <TouchableOpacity 
                      key={day} 
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Month</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity 
                      key={month} 
                      style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Year</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <TouchableOpacity 
                      key={year} 
                      style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
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
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  changePhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 90, 225, 0.1)',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  formSection: {
    gap: 0,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#000',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    ...Platform.select({
      android: {
        borderColor: Colors.light.primary,
      },
    }),
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 18,
    paddingVertical: 18,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E8E8E8',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  continueTextDisabled: {
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 380,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalCancel: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  modalDone: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '800',
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColumnLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
  },
  pickerScroll: {
    paddingBottom: 40,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(75, 90, 225, 0.1)',
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerItemTextSelected: {
    color: Colors.light.primary,
    fontWeight: '800',
    fontSize: 20,
  },
});
