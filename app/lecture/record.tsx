import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { lecturesApi } from '@/services/api';

export default function RecordLectureScreen() {
  const { subjectId, subjectTitle } = useLocalSearchParams();
  const [status, setStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const statusRef = useRef(status);
  
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'recording') {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Recording logic
  const startRecordingFlow = async () => {
    try {
      // 1. Request Permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }

      // 2. Start Session on Server
      const lectureTitle = subjectTitle ? `${subjectTitle} Lecture` : 'New Lecture';
      const sessionData = await lecturesApi.startLecture(lectureTitle, subjectId as string);
      console.log(`[Session] Started: ${sessionData.sessionId}`);
      setSessionId(sessionData.sessionId);
      
      // 3. Setup Audio Mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 4. Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setStatus('recording');

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Error starting recording');
    }
  };

  const stopRecordingFlow = async () => {
    if (!recordingRef.current || !sessionId) return;
    
    setStatus('finished');
    setIsUploading(true);

    try {
      // 1. Stop and unload
      await recordingRef.current.stopAndUnloadAsync();
      const tempUri = recordingRef.current.getURI();
      
      if (tempUri) {
        // 2. Ensure directory exists and move to local storage
        const dirPath = `${FileSystem.documentDirectory}lectures/`;
        const dirInfo = await FileSystem.getInfoAsync(dirPath);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dirPath, { recursive: true });
        }
        
        const localPath = `${dirPath}${sessionId}_full.m4a`;
        await FileSystem.moveAsync({ from: tempUri, to: localPath });
        
        console.log(`Full audio saved locally at: ${localPath}`);

        // 3. Upload with progress
        await lecturesApi.uploadFull(sessionId, localPath, (progress) => {
          setUploadProgress(progress);
        });
        
        setUploadProgress(100);
        console.log('[Lecture] Full upload completed');
      }
    } catch (e: any) {
      console.error('Error in stop flow:', e);
      alert('Failed to save or upload recording');
    } finally {
      setIsUploading(false);
      recordingRef.current = null;
    }
  };

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
              
              <View style={[styles.timerContainer, { marginBottom: 30 }]}>
                <Text style={styles.timerText}>
                  {m} <Text style={styles.timerLabel}>min</Text>  {s.toString().padStart(2, '0')} <Text style={styles.timerLabel}>s</Text>
                </Text>
                <Text style={styles.finishLabel}>Total Recording Time</Text>
              </View>

              {uploadProgress < 100 ? (
                <View style={[styles.progressContainer, { width: '100%', marginBottom: 30 }]}>
                  <Text style={[styles.progressText, { marginBottom: 10, fontSize: 16 }]}>
                    Uploading your lecture...
                  </Text>
                  <View style={[styles.progressBarBg, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${uploadProgress}%`,
                          backgroundColor: Colors.light.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(uploadProgress)}% Complete
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <SuccessTick />
                  <Text style={[styles.progressText, { marginTop: 10, fontSize: 18 }]}>
                    Upload Complete!
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {status === 'idle' && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startRecordingFlow}
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
                stopRecordingFlow();
              }}
              activeOpacity={seconds < 10 ? 1 : 0.85}
              disabled={seconds < 10}
            >
              <View style={styles.stopIconSquare} />
              <Text style={styles.stopText}>
                {seconds < 10 ? `Recording (${10 - seconds}s)` : 'Stop Recording'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'finished' && (
            <TouchableOpacity
              style={[
                styles.finishButton, 
                uploadProgress < 100 && { backgroundColor: '#CCC' }
              ]}
              onPress={() => uploadProgress === 100 && router.push('/(tabs)')}
              activeOpacity={0.85}
              disabled={uploadProgress < 100}
            >
              <Text style={styles.finishText}>
                {uploadProgress < 100 ? 'Syncing...' : 'Finish & Go Home'}
              </Text>
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
    color: '#2D6A2E',
    fontWeight: '600',
    flex: 1,
  },
  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D6A2E',
    letterSpacing: 0.5,
  },
  finishedState: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
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
