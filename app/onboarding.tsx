import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

const SLIDES = [
  {
    id: 0,
    title: "Master your\nlectures with us",
    image: require('@/assets/images/mascot_onboarding_blue.png'),
    backgroundColor: Colors.light.primary,
    textColor: '#FFFFFF',
    buttonText: 'Next',
    termsColor: 'rgba(255, 255, 255, 0.7)',
  },
  {
    id: 1,
    title: "Record &\nTranscribe",
    image: require('@/assets/images/mascot_onboarding_pink.png'),
    backgroundColor: Colors.light.pink,
    textColor: '#1A1A1A',
    buttonText: 'Next',
    termsColor: 'rgba(0, 0, 0, 0.5)',
  },
  {
    id: 2,
    title: "Generate\nSmart Notes",
    image: require('@/assets/images/mascot_onboarding_green.png'),
    backgroundColor: Colors.light.green,
    textColor: '#1A1A1A',
    buttonText: 'Get started',
    termsColor: 'rgba(0, 0, 0, 0.5)',
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const slide = SLIDES[currentIndex];

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/sign-in');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: slide.backgroundColor }]}>
      <FlatList
        data={SLIDES}
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <View style={[styles.slideContent, { width }]}>
            <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
            <View style={styles.imageContainer}>
              <Image 
                source={item.image} 
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((s, i) => (
            <View 
              key={s.id} 
              style={[
                styles.dot, 
                { backgroundColor: slide.textColor },
                i === currentIndex ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>

        <Button 
          title={slide.buttonText} 
          onPress={handleNext}
          style={styles.button}
          variant="primary"
        />
        <Text style={[styles.termsText, { color: slide.termsColor }]}>
          By starting or signing in, you agree{'\n'}to our Terms of use
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  image: {
    width: 300,
    height: 300,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    opacity: 1,
  },
  dotInactive: {
    width: 8,
    opacity: 0.3,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
