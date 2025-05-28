import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AppBackground from '../AppBackground';

const { width, height } = Dimensions.get('window');

const PlantDiseasePage = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!cameraStatus.granted) {
        Toast.show({
          type: 'error',
          text1: 'Camera Permission Denied',
          text2: 'Please enable camera access in settings to take photos.',
        });
      }
      if (!mediaStatus.granted) {
        Toast.show({
          type: 'error',
          text1: 'Media Library Permission Denied',
          text2: 'Please enable media library access in settings to upload images.',
        });
      }
    })();
  }, []);

  const takePhoto = async () => {
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
    if (!cameraStatus.granted) {
      Toast.show({
        type: 'error',
        text1: 'Camera Access Denied',
        text2: 'Please enable camera permissions in your device settings.',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setPrediction(null);
        Toast.show({
          type: 'success',
          text1: 'Photo Captured',
          text2: 'Image ready for submission.',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Action Canceled',
          text2: 'No photo was taken.',
        });
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: 'Failed to open camera. Please try again.',
      });
    }
  };

  const pickImage = async () => {
    const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!mediaStatus.granted) {
      Toast.show({
        type: 'error',
        text1: 'Media Library Access Denied',
        text2: 'Please enable media library permissions in your device settings.',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setPrediction(null);
        Toast.show({
          type: 'success',
          text1: 'Image Selected',
          text2: 'Image ready for submission.',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Action Canceled',
          text2: 'No image was selected.',
        });
      }
    } catch (error) {
      console.error('Error launching gallery:', error);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Failed to open gallery. Please try again.',
      });
    }
  };

  const submitImage = async () => {
    if (!imageUri) {
      Toast.show({
        type: 'error',
        text1: 'No Image',
        text2: 'Please take or upload an image first.',
      });
      return;
    }

    setIsLoading(true);

    const fileName = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileName);
    const fileType = match ? `image/${match[1]}` : `image`;
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    });
    
    try {
      const response = await axios.post('http://192.168.1.53:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const predictionData = response.data;
      setPrediction(predictionData);
      Toast.show({
        type: 'success',
        text1: 'Image Processed',
        text2: `Detected: ${predictionData.disease || 'Unknown'}`,
      });
    } catch (error) {
      console.error('Error submitting image:', error);
      setPrediction({ disease: 'Error', confidence: 0 });
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not process the image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={wp(5)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Plant Disease Scanner</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Identify plant diseases with AI</Text>

          {!imageUri ? (
            <View style={styles.uploadSection}>
              <View style={styles.uploadIllustration}>
                <View style={styles.iconContainer}>
                  <Icon name="photo-camera" size={wp(15)} color="#4CAF50" />
                </View>
                <Text style={styles.uploadText}>Capture or upload an image of your plant</Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cameraButton]} 
                  onPress={takePhoto} 
                  disabled={isLoading}
                >
                  <Icon name="camera-alt" size={wp(6)} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.uploadButton]} 
                  onPress={pickImage} 
                  disabled={isLoading}
                >
                  <Icon name="photo-library" size={wp(6)} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <View style={styles.imageActions}>
                  <TouchableOpacity 
                    style={styles.changeImageButton} 
                    onPress={() => setImageUri(null)}
                  >
                    <Icon name="close" size={wp(5)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={submitImage} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="search" size={wp(5)} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.submitButtonText}>Analyze Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {prediction && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Analysis Results</Text>
              
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Icon name="local-florist" size={wp(6)} color="#4CAF50" />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultLabel}>Disease Detected</Text>
                    <Text style={styles.resultValue}>{prediction.disease}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.resultRow}>
                  <Icon name="assessment" size={wp(6)} color="#4CAF50" />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultLabel}>Confidence Level</Text>
                    <Text style={styles.resultValue}>{(prediction.confidence * 100).toFixed(2)}%</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.tipsButton}>
                <Text style={styles.tipsButtonText}>View Treatment Tips</Text>
                <Icon name="chevron-right" size={wp(5)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Toast />
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: wp(2.5),
  },
  title: {
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: wp(4),
    color: '#555555',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  content: {
    flex: 1,
    padding: wp(5),
  },
  uploadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIllustration: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: hp(5),
  },
  iconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Fond vert clair pour l'icône
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  uploadIcon: {
    // Supprimé ici car géré par iconContainer
  },
  uploadText: {
    fontSize: wp(5), // Taille augmentée
    fontWeight: 'bold', // Texte en gras
    color: '#424242', // Couleur plus sombre
    textAlign: 'center',
    lineHeight: hp(3.5), // Espacement ajusté
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(4),
  },
  button: {
    flexDirection: 'row',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(42),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  uploadButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: wp(4),
    color: '#FFFFFF',
    marginLeft: wp(2),
    fontWeight: '600',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    width: wp(90),
    height: hp(40),
    borderRadius: wp(4),
    overflow: 'hidden',
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageActions: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  changeImageButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(3),
    padding: wp(2),
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    paddingVertical: hp(2),
    paddingHorizontal: wp(8),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: wp(80),
  },
  submitButtonText: {
    fontSize: wp(4.5),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    width: '100%',
    marginTop: hp(3),
  },
  resultTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: hp(2),
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(1),
  },
  resultTextContainer: {
    marginLeft: wp(4),
  },
  resultLabel: {
    fontSize: wp(3.8),
    color: '#757575',
  },
  resultValue: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#424242',
    marginTop: hp(0.5),
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: hp(1),
  },
  tipsButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsButtonText: {
    fontSize: wp(4),
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: wp(2),
  },
});

export default PlantDiseasePage;