import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Alert, Modal, TextInput } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useFocusEffect } from '@react-navigation/native';
import { subjectsApi, lecturesApi } from '@/services/api';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const [subject, setSubject] = useState<any>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);

  const toggleSelection = (lectureId: string) => {
    setSelectedLectures(prev => 
      prev.includes(lectureId) 
        ? prev.filter(id => id !== lectureId) 
        : [...prev, lectureId]
    );
  };

  const handleLongPress = (lectureId: string) => {
    setIsSelectionMode(true);
    toggleSelection(lectureId);
  };

  const handleDeleteSelected = () => {
    if (selectedLectures.length === 0) return;
    
    Alert.alert(
      "Delete Lectures",
      `Are you sure you want to delete ${selectedLectures.length} selected lecture(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Delete each selected lecture (assuming API supports single delete)
              await Promise.all(selectedLectures.map(id => lecturesApi.deleteLecture(id)));
              setLectures(prev => prev.filter(l => !selectedLectures.includes(l.id)));
              setSelectedLectures([]);
              setIsSelectionMode(false);
            } catch (err) {
              Alert.alert("Error", "Failed to delete some lectures");
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    setShowMoreModal(false);
    Alert.alert(
      "Delete Subject",
      "Are you sure you want to delete this subject and all its lectures?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await subjectsApi.deleteSubject(id as string);
              router.replace('/(tabs)');
            } catch (err) {
              Alert.alert("Error", "Failed to delete subject");
            }
          }
        }
      ]
    );
  };

  const handleRename = async () => {
    if (!newTitle.trim()) return;
    try {
      await subjectsApi.updateSubject(id as string, { title: newTitle });
      setSubject({ ...subject, title: newTitle });
      setShowRenameModal(false);
    } catch (err) {
      Alert.alert("Error", "Failed to rename subject");
    }
  };

  const showMoreMenu = () => {
    setShowMoreModal(true);
  };

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    try {
      const [subjectData, lectureData] = await Promise.all([
        subjectsApi.getSubject(id as string),
        lecturesApi.getLecturesBySubject(id as string)
      ]);
      setSubject(subjectData);
      setLectures(lectureData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.topBanner, { backgroundColor: '#F0F0F0' }]}>
          <View style={styles.header}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <Skeleton width={120} height={20} />
            <Skeleton width={44} height={44} borderRadius={14} />
          </View>
          <View style={styles.subjectHero}>
            <Skeleton width={64} height={64} borderRadius={20} />
            <View style={[styles.heroText, { gap: 8 }]}>
              <Skeleton width={150} height={24} />
              <Skeleton width={100} height={16} />
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
          <View style={styles.quickActions}>
            <Skeleton width="48%" height={120} borderRadius={20} />
            <Skeleton width="48%" height={120} borderRadius={20} />
          </View>
          <Skeleton width={120} height={20} style={{ marginVertical: 16 }} />
          {[1,2,3].map(i => (
            <Skeleton key={i} width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!subject) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#666' }}>Subject not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.light.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const subjectName = subject.title;
  const subjectColor = subject.color || Colors.light.yellow;
  const subjectIcon = subject.icon || 'book.fill';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBanner, { backgroundColor: isSelectionMode ? '#FF4B4B' : subjectColor }]}>
        <View style={styles.header}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity 
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedLectures([]);
                }} 
                style={styles.backButton}
              >
                <IconSymbol name="xmark" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: '#FFF' }]}>{selectedLectures.length} Selected</Text>
              <TouchableOpacity 
                style={[styles.moreButton, selectedLectures.length === 0 && { opacity: 0.5 }]} 
                onPress={handleDeleteSelected}
                disabled={selectedLectures.length === 0}
              >
                <IconSymbol name="trash.fill" size={22} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol name="chevron.left" size={26} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Subject Details</Text>
              <TouchableOpacity style={styles.moreButton} onPress={showMoreMenu}>
                <IconSymbol name="ellipsis" size={24} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.subjectHero}>
          <View style={styles.iconContainer}>
            <IconSymbol name={subjectIcon as any} size={40} color="#000" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.subjectNameText}>{subjectName}</Text>
            <Text style={styles.subjectSubtitle}>{lectures.length} Lectures • 0% Progress</Text>
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
            onPress={() => router.push({
              pathname: '/lecture/record',
              params: { subjectId: id, subjectTitle: subjectName }
            })}
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
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.viewAll}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {lectures.length === 0 ? (
          <View style={styles.emptyLectures}>
            <Text style={styles.emptyText}>No lectures recorded yet.</Text>
          </View>
        ) : (
          lectures.map((lecture, index) => {
            const isSelected = selectedLectures.includes(lecture.id);
            return (
              <TouchableOpacity 
                key={lecture.id}
                onPress={() => isSelectionMode ? toggleSelection(lecture.id) : router.push(`/lecture/${lecture.id}`)}
                onLongPress={() => handleLongPress(lecture.id)}
                activeOpacity={0.8}
              >
                <Card style={[styles.lectureCard, isSelected && { borderColor: '#FF4B4B', borderWidth: 2 }]}>
                  <View style={styles.lectureMain}>
                    {isSelectionMode && (
                      <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                        {isSelected && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                      </View>
                    )}
                    <View style={styles.lectureIconBox}>
                      <IconSymbol 
                        name={lecture.status === 'recording' ? 'mic.fill' : 'doc.plaintext.fill'} 
                        size={22} 
                        color={isSelected ? '#FF4B4B' : subjectColor} 
                      />
                    </View>
                    <View style={styles.lectureDetails}>
                      <Text style={styles.lectureTitleText}>{lecture.title}</Text>
                      <Text style={[
                        styles.lectureSubText, 
                        lecture.status === 'recording' && { color: Colors.light.primary, fontWeight: '700' }
                      ]}>
                        {lecture.status === 'recording' 
                          ? `Recording... (${lecture.total_chunks} chunks)` 
                          : `${new Date(lecture.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Ready`
                        }
                      </Text>
                    </View>
                    {!isSelectionMode && <IconSymbol name="chevron.right" size={20} color="#CCC" />}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

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
      {/* Options Dropdown Modal */}
      <Modal
        visible={showMoreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMoreModal(false)}
        >
          <View style={styles.dropdownContent}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setShowMoreModal(false);
                setNewTitle(subject.title);
                setShowRenameModal(true);
              }}
            >
              <IconSymbol name="pencil" size={20} color="#000" />
              <Text style={styles.dropdownText}>Rename Subject</Text>
            </TouchableOpacity>
            
            <View style={styles.dropdownDivider} />
            
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={handleDelete}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF4B4B" />
              <Text style={[styles.dropdownText, { color: '#FF4B4B' }]}>Delete Subject</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowRenameModal(false)}
        >
          <View style={styles.renameModalContent}>
            <Text style={styles.modalTitleText}>Rename Subject</Text>
            <TextInput
              style={styles.renameInput}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              placeholder="Enter new subject name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleRename}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
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
    color: '#666',
    fontWeight: '600',
  },
  emptyLectures: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
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
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorActive: {
    backgroundColor: '#FF4B4B',
    borderColor: '#FF4B4B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 16,
  },
  renameInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContent: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 8,
    width: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
});
