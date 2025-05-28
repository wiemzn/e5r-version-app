// AppBackground.js
import React, { useState, useEffect } from 'react';
import { View, ImageBackground, ActivityIndicator, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const AppBackground = ({ children, style }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Simulate image preload for local assets
        setTimeout(() => {
          setImageLoaded(true);
        }, 100); // Adjust delay based on testing
      } catch (error) {
        console.error('Error preloading image:', error);
        setImageLoaded(true); // Proceed even if preload fails
      }
    };
    loadImage();
  }, []);

  if (!imageLoaded) {
    return (
      <View style={[styles.background, styles.fallbackBackground]}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={[styles.background, style]}
      blurRadius={5}
      onLoad={() => setImageLoaded(true)}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  fallbackBackground: {
    backgroundColor: '#f5f7fa', // Matches original design
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppBackground;