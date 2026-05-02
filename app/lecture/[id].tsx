import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import { authApi, subjectsApi, lecturesApi } from '@/services/api';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing,
  runOnJS,
  cancelAnimation
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_NOTES = [
  { title: 'Definition of Limits', text: 'Limits describe the behavior of a function as it approaches a certain value.' },
  { title: 'Formal Notation', text: 'The limit of f(x) as x approaches c is L, written as lim f(x) = L.' },
  { title: 'One-Sided Limits', text: 'Left-hand and right-hand limits must be equal for the general limit to exist.' },
  { title: 'Evaluation Strategy', text: 'Direct substitution is the first method to try when evaluating limits.' },
];

const MOCK_KEY_TERMS = [
  { term: 'Continuity', color: Colors.light.green },
  { term: 'Squeeze Theorem', color: Colors.light.yellow },
  { term: "L'Hôpital's Rule", color: Colors.light.pink },
  { term: 'Epsilon-Delta', color: Colors.light.blueLight },
];

const MOCK_TRANSCRIPT = [
  { time: '00:00', seconds: 0, text: "Alright class, let's get started. Today we're diving into limits." },
  { time: '02:15', seconds: 135, text: "A limit basically tells us what a function is doing as we get closer and closer to a certain point." },
  { time: '05:30', seconds: 330, text: "Remember, if the left side and the right side don't match, the limit does not exist. Keep that in mind for the exam." },
  { time: '08:45', seconds: 525, text: "Let's try a few examples on the board. The easiest way is direct substitution. Try plugging the number in first." }
];

const WAVE_DATA = Array.from({ length: 600 }, () => 4 + Math.random() * 32);
const BAR_WIDTH = 3;
const BAR_MARGIN = 3;
const TOTAL_BAR_SPACE = BAR_WIDTH + BAR_MARGIN;
const WAVE_WIDTH = WAVE_DATA.length * TOTAL_BAR_SPACE;

// ─── Waveform Component ───
const ScrollingWaveform = ({ progress, onSeekStart, onSeeking, onSeekEnd }: { 
  progress: number, 
  onSeekStart: () => void,
  onSeeking: (p: number) => void,
  onSeekEnd: (p: number) => void 
}) => {
  const animatedProgress = useSharedValue(0);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      animatedProgress.value = withTiming(progress, { 
        duration: 100, 
        easing: Easing.linear 
      });
    }
  }, [progress]);

  const onPanGestureEvent = (event: any) => {
    const deltaX = event.nativeEvent.translationX;
    const deltaProgress = -deltaX / WAVE_WIDTH;
    let newProgress = animatedProgress.value + deltaProgress;
    newProgress = Math.max(0, Math.min(1, newProgress));
    animatedProgress.value = newProgress;
    runOnJS(onSeeking)(newProgress);
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      isDragging.value = true;
      cancelAnimation(animatedProgress);
      runOnJS(onSeekStart)();
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      isDragging.value = false;
      runOnJS(onSeekEnd)(animatedProgress.value);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -animatedProgress.value * WAVE_WIDTH }],
  }));

  const renderBars = (color: string) => {
    const containerWidth = SCREEN_WIDTH - 48 - 40;
    const centerOffset = containerWidth / 2;
    return (
      <View style={styles.waveformContent}>
        <View style={{ width: centerOffset }} /> 
        {WAVE_DATA.map((h, i) => (
          <View 
            key={i} 
            style={[styles.waveBar, { height: h, width: BAR_WIDTH, marginRight: BAR_MARGIN, backgroundColor: color }]} 
          />
        ))}
        <View style={{ width: centerOffset }} />
      </View>
    );
  };

  return (
    <PanGestureHandler onGestureEvent={onPanGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <View style={styles.waveformContainer}>
        <View style={styles.playhead} />
        <View style={styles.waveformWindow} pointerEvents="none">
          <Animated.View style={[animatedStyle]}>
            {renderBars('rgba(75, 90, 225, 0.15)')}
          </Animated.View>
        </View>
        <View style={[styles.waveformWindow, styles.clippedWindow]} pointerEvents="none">
          <Animated.View style={[animatedStyle]}>
            {renderBars(Colors.light.primary)}
          </Animated.View>
        </View>
      </View>
    </PanGestureHandler>
  );
};

// ─── Main Screen ───
export default function LectureNotesScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('notes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const isUserSeeking = useRef(false);
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    fetchLectureData();
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, [id]);

  const fetchLectureData = async () => {
    try {
      const data = await lecturesApi.getLecture(id as string);
      setLecture(data);
      if (data.audio_url) {
        loadAudio(data.audio_url);
      }
    } catch (err) {
      console.error('Fetch lecture error:', err);
    } finally {
      setLoading(false);
    }
  };

  async function loadAudio(uri: string) {
    if (!uri) return;
    try {
      console.log('[Audio] Loading from:', uri);
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { 
          uri, 
          headers: { 'ngrok-skip-browser-warning': '1' } 
        },
        { shouldPlay: false, progressUpdateIntervalMillis: 50 },
        onPlaybackStatusUpdate
      );
      sound.current = newSound;
      console.log('[Audio] Loaded successfully');
    } catch (error) {
      console.error('[Audio] Error loading:', error);
    }
  }

  const handleTranscribe = async () => {
    try {
      setIsTranscribing(true);
      await lecturesApi.transcribeLecture(id as string);
      
      // Immediately refresh data to update status in UI
      await fetchLectureData();
      
      Alert.alert(
        "Transcription Started", 
        "We're processing your audio. This usually takes a few minutes. You can check back later or use the refresh button."
      );
    } catch (err) {
      console.error('Transcribe error:', err);
      Alert.alert("Error", "Failed to start transcription. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      setIsGeneratingNotes(true);
      await lecturesApi.generateNotes(id as string);
      await fetchLectureData();
      Alert.alert("Success", "Study notes and key terms generated successfully!");
    } catch (err) {
      console.error('Notes error:', err);
      Alert.alert("Error", "Failed to generate notes. Make sure transcription is complete.");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  function onPlaybackStatusUpdate(newStatus: any) {
    if (newStatus.isLoaded && !isUserSeeking.current) {
      setStatus(newStatus);
      setIsPlaying(newStatus.isPlaying);
    }
  }

  const handlePlayPause = async () => {
    if (!sound.current) return;
    if (isPlaying) {
      await sound.current.pauseAsync();
    } else {
      await sound.current.playAsync();
    }
  };

  const handleSkipTo = async (seconds: number) => {
    if (!sound.current) return;
    await sound.current.setPositionAsync(seconds * 1000);
    if (!isPlaying) await sound.current.playAsync();
  };

  const onSeekStart = () => { isUserSeeking.current = true; };
  const onSeeking = (_: number) => {};
  const onSeekEnd = async (newProgress: number) => {
    if (!sound.current || !status?.durationMillis) {
      isUserSeeking.current = false;
      return;
    }
    await sound.current.setPositionAsync(newProgress * status.durationMillis);
    isUserSeeking.current = false;
  };

  const currentSeconds = status?.positionMillis ? status.positionMillis / 1000 : 0;
  const progress = status?.durationMillis ? status.positionMillis / status.durationMillis : 0;
  
  // Use real segments for active index if available
  const segments = lecture?.segments || [];
  const activeTranscriptIndex = segments.reduce((best: number, item: any, i: number) => 
    item.start <= currentSeconds ? i : best, -1
  );

  const formatTime = (millis: number) => {
    const s = millis / 1000;
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{lecture?.title || 'Loading...'}</Text>
            <Text style={styles.headerSubtitle}>
              {lecture ? new Date(lecture.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} 
              {lecture?.duration ? ` • ${Math.round(lecture.duration / 60)} min` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={fetchLectureData}>
            <IconSymbol name="arrow.clockwise" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        {/* ─── Tab Switcher ─── */}
        <View style={styles.tabContainer}>
          <View style={styles.tabPill}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
              onPress={() => setActiveTab('notes')}
            >
              <IconSymbol name="book.fill" size={16} color={activeTab === 'notes' ? '#FFF' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
              onPress={() => setActiveTab('transcript')}
            >
              <IconSymbol name="mic.fill" size={16} color={activeTab === 'transcript' ? '#FFF' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>Transcript</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Content ─── */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'notes' ? (
            <View style={styles.notesContainer}>
              {/* Show Generate Notes if summary is empty and NOT generating */}
              {!lecture?.summary && !isGeneratingNotes && (
                <View style={styles.generateContainer}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                    <IconSymbol name="book.fill" size={32} color="#9C27B0" />
                  </View>
                  <Text style={styles.generateTitle}>No notes yet</Text>
                  <Text style={styles.generateSubtitle}>Let AI analyze your transcript to create structured study notes and key terms.</Text>
                  <TouchableOpacity 
                    style={[styles.generateButton, { backgroundColor: '#9C27B0' }]} 
                    onPress={handleGenerateNotes}
                  >
                    <Text style={styles.generateButtonText}>Generate Study Notes</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Show Generating Notes state */}
              {isGeneratingNotes && (
                <View style={styles.transcribingState}>
                  <Animated.View style={[styles.pulseContainer, { backgroundColor: 'rgba(156, 39, 176, 0.05)' }]}>
                    <IconSymbol name="sparkles" size={40} color="#9C27B0" />
                  </Animated.View>
                  <Text style={styles.transcribingTitle}>Generating Notes...</Text>
                  <Text style={styles.transcribingSubtitle}>Our AI is analyzing your transcript to extract the most important information.</Text>
                </View>
              )}

              {/* Key Terms Row */}
              {lecture?.key_terms && (
                <View style={styles.keyTermsSection}>
                  <Text style={styles.sectionLabel}>KEY TERMS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.keyTermsScroll}>
                    {(typeof lecture.key_terms === 'string' ? JSON.parse(lecture.key_terms) : lecture.key_terms).map((item: any, i: number) => (
                      <View key={i} style={[styles.keyTermChip, { backgroundColor: item.color || '#EEE' }]}>
                        <Text style={styles.keyTermText}>{item.term}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Notes Cards */}
              {lecture?.summary && (
                <>
                  <Text style={styles.sectionLabel}>SUMMARY</Text>
                  {(typeof lecture.summary === 'string' ? JSON.parse(lecture.summary) : lecture.summary).map((note: any, index: number) => (
                    <Card key={index} style={styles.noteCard}>
                      <View style={styles.noteHeader}>
                        <View style={styles.noteNumberBadge}>
                          <Text style={styles.noteNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.noteTitle}>{note.title}</Text>
                      </View>
                      <Text style={styles.noteText}>{note.text}</Text>
                    </Card>
                  ))}
                </>
              )}
            </View>
          ) : (
            <View style={styles.transcriptContainer}>
              {/* ─── Audio Player ─── */}
              <View style={styles.audioPlayer}>
                <View style={styles.playerRow}>
                  <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                    <IconSymbol 
                      name={isPlaying ? 'pause.fill' : 'play.fill'} 
                      size={28} 
                      color="#FFF" 
                    />
                  </TouchableOpacity>
                  <View style={styles.playerMeta}>
                    <Text style={styles.playerTitle}>Lecture Recording</Text>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>{formatTime(status?.positionMillis || 0)}</Text>
                      <View style={styles.timeDivider} />
                      <Text style={styles.timeTotalText}>{formatTime(status?.durationMillis || 0)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.speedBadge}>
                    <Text style={styles.speedText}>1x</Text>
                  </TouchableOpacity>
                </View>
                <ScrollingWaveform 
                  progress={progress} 
                  onSeekStart={onSeekStart}
                  onSeeking={onSeeking}
                  onSeekEnd={onSeekEnd} 
                />
              </View>

              {/* ─── Transcript Content ─── */}
              {/* Show Generate Button only if NOT transcribing and NO transcription exists */}
              {!lecture?.transcription && lecture?.status !== 'transcribing' && !isTranscribing && (
                <View style={styles.generateContainer}>
                  <View style={styles.emptyIconCircle}>
                    <IconSymbol name="mic.fill" size={32} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.generateTitle}>No transcript yet</Text>
                  <Text style={styles.generateSubtitle}>Convert your audio recording into text for easier studying.</Text>
                  <TouchableOpacity 
                    style={styles.generateButton} 
                    onPress={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    <Text style={styles.generateButtonText}>
                      {lecture?.status === 'failed' ? 'Retry Transcription' : 'Generate Transcript'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Show Progress State if currently transcribing */}
              {(lecture?.status === 'transcribing' || isTranscribing) && !lecture?.transcription && (
                <View style={styles.transcribingState}>
                  <Animated.View style={styles.pulseContainer}>
                    <IconSymbol name="waveform" size={40} color={Colors.light.primary} />
                  </Animated.View>
                  <Text style={styles.transcribingTitle}>Generating transcript...</Text>
                  <Text style={styles.transcribingSubtitle}>Your transcript is being prepared. It will appear here automatically once finished.</Text>
                  <TouchableOpacity 
                    style={styles.refreshButton} 
                    onPress={fetchLectureData}
                  >
                    <IconSymbol name="arrow.clockwise" size={14} color={Colors.light.primary} />
                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                  </TouchableOpacity>
                </View>
              )}

              {lecture?.segments && lecture.segments.length > 0 ? (
                <View style={styles.segmentsList}>
                  {lecture.segments.map((item: any, index: number) => {
                    const isActive = index === activeTranscriptIndex;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        onPress={() => handleSkipTo(item.start)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.transcriptCard, isActive && styles.activeTranscriptCard]}>
                          <View style={styles.transcriptLeft}>
                            <View style={[styles.timelineDot, isActive && styles.activeTimelineDot]} />
                            {index < lecture.segments.length - 1 && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.transcriptBody}>
                            <View style={styles.transcriptHeader}>
                              <Text style={[styles.timestampText, isActive && styles.activeTimestamp]}>
                                {Math.floor(item.start / 60).toString().padStart(2, '0')}:
                                {Math.floor(item.start % 60).toString().padStart(2, '0')}
                              </Text>
                              {isActive && (
                                <View style={styles.liveIndicator}>
                                  <View style={styles.liveDot} />
                                  <Text style={styles.liveText}>Active</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.transcriptText, isActive && styles.activeTranscriptText]}>{item.text}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : lecture?.transcription ? (
                <View style={styles.transcriptionTextContainer}>
                  <Text style={styles.realTranscriptionText}>{lecture.transcription}</Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
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
      android: { elevation: 2 },
    }),
  },
  headerCenter: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  moreButton: {
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
      android: { elevation: 2 },
    }),
  },

  // Tabs
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  activeTabText: {
    color: '#FFF',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Notes Tab ──
  notesContainer: {
    gap: 0,
  },
  keyTermsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12,
  },
  keyTermsScroll: {
    flexDirection: 'row',
  },
  keyTermChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  keyTermText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  noteCard: {
    marginBottom: 12,
    padding: 18,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    color: '#555',
    marginLeft: 40,
  },

  // ── Transcript Tab ──
  transcriptContainer: {
    gap: 0,
  },

  // Audio Player
  audioPlayer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
    }),
  },
  playerMeta: {
    flex: 1,
    marginLeft: 14,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  timeDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  timeTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BBB',
  },
  speedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '12',
  },
  speedText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
  },

  // Waveform
  waveformContainer: {
    height: 70,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  waveformWindow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  clippedWindow: {
    width: '50%',
    overflow: 'hidden',
    zIndex: 2,
  },
  waveformContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playhead: {
    position: 'absolute',
    left: '50%',
    width: 2.5,
    height: '75%',
    backgroundColor: Colors.light.primary,
    zIndex: 10,
    borderRadius: 2,
  },
  waveBar: {
    borderRadius: 2,
  },

  // Transcript Cards (Timeline Style)
  transcriptCard: {
    flexDirection: 'row',
    marginBottom: 0,
    paddingBottom: 24,
  },
  activeTranscriptCard: {},
  transcriptLeft: {
    width: 28,
    alignItems: 'center',
    marginRight: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
    zIndex: 2,
  },
  activeTimelineDot: {
    backgroundColor: Colors.light.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
    }),
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E8E8E8',
    marginTop: 4,
  },
  transcriptBody: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#BBB',
  },
  activeTimestamp: {
    color: Colors.light.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.primary,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    color: '#666',
  },
  activeTranscriptText: {
    color: '#222',
    fontWeight: '600',
  },
  // Transcription Empty/Loading States
  generateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 32,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: { elevation: 2 },
    }),
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(75, 90, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  generateTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  generateSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  generateButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: { elevation: 4 },
    }),
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  transcribingState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcribingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  transcribingSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  pulseContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(75, 90, 225, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptionTextContainer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginTop: 20,
  },
  realTranscriptionText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    fontWeight: '500',
  },
});
