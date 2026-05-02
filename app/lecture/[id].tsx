import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
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
  const isUserSeeking = useRef(false);
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  async function loadAudio() {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('@/assets/audio/audio_sample.mp3'),
        { shouldPlay: false, progressUpdateIntervalMillis: 50 },
        onPlaybackStatusUpdate
      );
      sound.current = newSound;
    } catch (error) {
      console.log('Error loading audio:', error);
    }
  }

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
  const activeTranscriptIndex = MOCK_TRANSCRIPT.reduce((best, item, i) => item.seconds <= currentSeconds ? i : best, 0);

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
            <Text style={styles.headerTitle}>Calculus Ch 3</Text>
            <Text style={styles.headerSubtitle}>Oct 12 • 45 min</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <IconSymbol name="ellipsis" size={22} color="#555" />
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
              {/* Key Terms Row */}
              <View style={styles.keyTermsSection}>
                <Text style={styles.sectionLabel}>KEY TERMS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.keyTermsScroll}>
                  {MOCK_KEY_TERMS.map((item, i) => (
                    <View key={i} style={[styles.keyTermChip, { backgroundColor: item.color }]}>
                      <Text style={styles.keyTermText}>{item.term}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Notes Cards */}
              <Text style={styles.sectionLabel}>SUMMARY</Text>
              {MOCK_NOTES.map((note, index) => (
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

              {/* ─── Transcript List ─── */}
              {MOCK_TRANSCRIPT.map((item, index) => {
                const isActive = index === activeTranscriptIndex;
                return (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => handleSkipTo(item.seconds)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.transcriptCard, isActive && styles.activeTranscriptCard]}>
                      <View style={styles.transcriptLeft}>
                        <View style={[styles.timelineDot, isActive && styles.activeTimelineDot]} />
                        {index < MOCK_TRANSCRIPT.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.transcriptBody}>
                        <View style={styles.transcriptHeader}>
                          <Text style={[styles.timestampText, isActive && styles.activeTimestamp]}>{item.time}</Text>
                          {isActive && (
                            <View style={styles.liveIndicator}>
                              <View style={styles.liveDot} />
                              <Text style={styles.liveText}>Live</Text>
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
});
