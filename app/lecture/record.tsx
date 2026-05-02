import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

const TIPS = [
  { icon: 'ear', text: 'Listen attentively to the lecture' },
  { icon: 'text.bubble', text: "Transcribing teacher's audio..." },
  { icon: 'pencil.and.outline', text: 'Auto-generating notes in background' },
];

const SuccessTick = () => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(2)) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tickContainer, animatedStyle]}>
      <IconSymbol name="checkmark" size={40} color="#FFF" />
    </Animated.View>
  );
};

const ScrollingRecordingWave = () => {
  const [waves, setWaves] = useState<number[]>(Array.from({ length: 60 }, () => 4));
  const translateX = useSharedValue(0);
  const BAR_WIDTH = 6; // Reduced width for more compact look
  const INTERVAL = 250; // Slower generation (4 bars per second)

  useEffect(() => {
    const interval = setInterval(() => {
      setWaves(prev => {
        const next = [...prev, 5 + Math.random() * 35];
        if (next.length > 120) next.shift();
        return next;
      });
      // Smooth continuous movement
      translateX.value = withTiming(translateX.value - (BAR_WIDTH + 4), { 
        duration: INTERVAL, 
        easing: Easing.linear 
      });
    }, INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.recordingWaveWrapper}>
      <View style={styles.recordingPlayhead} />
      <Animated.View style={[styles.recordingWaveContainer, animatedStyle]}>
        {waves.map((h, i) => (
          <View key={i} style={[styles.waveBar, { height: h, width: BAR_WIDTH }]} />
        ))}
      </Animated.View>
    </View>
  );
};

export default function RecordLectureScreen() {
  const [status, setStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'recording') {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <IconSymbol name="xmark" size={20} color="#2D6A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {status === 'idle' ? 'Ready to Record' : status === 'recording' ? 'Recording Lecture' : 'Recording Finished'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollArea} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {status === 'idle' && (
            <View style={styles.idleState}>
              <View style={styles.mascotContainer}>
                <Image 
                  source={require('@/assets/images/mascot_listen.png')} 
                  style={styles.mascot}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.idleText}>Tap the button below to start recording your lecture.</Text>
            </View>
          )}

          {status === 'recording' && (
            <View style={styles.recordingState}>
              <View style={styles.mascotContainer}>
                 <Image 
                  source={require('@/assets/images/mascot_listen.png')} 
                  style={[styles.mascot, { opacity: 0.5 }]}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.activeRecordingSection}>
                <ScrollingRecordingWave />
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>
                    {m} <Text style={styles.timerLabel}>min</Text>  {s.toString().padStart(2, '0')} <Text style={styles.timerLabel}>s</Text>
                  </Text>
                </View>

                <View style={styles.tipsContainer}>
                  {TIPS.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <View style={styles.tipIconWrap}>
                        <IconSymbol name={tip.icon as any} size={20} color="#FFF" />
                      </View>
                      <Text style={styles.tipText}>{tip.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {status === 'finished' && (
            <View style={styles.finishedState}>
              <View style={styles.mascotContainer}>
                <Image 
                  source={require('@/assets/images/mascot_success.png')} 
                  style={styles.mascot}
                  resizeMode="contain"
                />
              </View>
              
              <SuccessTick />
              
              <View style={[styles.timerContainer, { marginTop: 20 }]}>
                <Text style={styles.timerText}>
                  {m} <Text style={styles.timerLabel}>min</Text>  {s.toString().padStart(2, '0')} <Text style={styles.timerLabel}>s</Text>
                </Text>
                <Text style={styles.finishLabel}>Total Recording Time</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {status === 'idle' && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setStatus('recording')}
              activeOpacity={0.85}
            >
              <IconSymbol name="mic.fill" size={24} color="#FFF" />
              <Text style={styles.startText}>Start Recording</Text>
            </TouchableOpacity>
          )}

          {status === 'recording' && (
            <TouchableOpacity
              style={[styles.stopButton, seconds < 10 && { opacity: 0.5 }]}
              onPress={() => {
                if (seconds < 10) return;
                setStatus('finished');
              }}
              activeOpacity={seconds < 10 ? 1 : 0.85}
            >
              <View style={styles.stopIconSquare} />
              <Text style={styles.stopText}>
                {seconds < 10 ? `Recording (${10 - seconds}s)` : 'Stop Recording'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'finished' && (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => router.push('/lecture/1')}
              activeOpacity={0.85}
            >
              <Text style={styles.finishText}>Finish & Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ACEE80',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A3A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollArea: {
    flex: 1,
    width: '100%',
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  recordingState: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  finishedState: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  idleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D6A2E',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  mascot: {
    width: 200,
    height: 200,
  },
  activeRecordingSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingWaveWrapper: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  recordingWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: '50%',
    justifyContent: 'flex-start',
  },
  recordingPlayhead: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#2D6A2E',
    zIndex: 10,
    borderRadius: 1,
  },
  waveBar: {
    backgroundColor: '#2D6A2E',
    borderRadius: 2,
  },
  timerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#1A3A1A',
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D7A3D',
  },
  finishLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D7A3D',
    marginTop: 4,
  },
  tickContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A3A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  tipsContainer: {
    width: '100%',
    marginBottom: 28,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#2D6A2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(45,106,46,0.08)',
      },
    }),
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A1A',
    marginLeft: 14,
    flex: 1,
  },
  footer: {
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1A3A1A',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  stopButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FF4B4B',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  stopIconSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  stopText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  finishButton: {
    width: '100%',
    backgroundColor: '#1A3A1A',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
