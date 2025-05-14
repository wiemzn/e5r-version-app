import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios'; // Added axios dependency

const PlantDiseasePage = () => {
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

    // Create FormData for the image
    const fileName = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileName);
    const fileType = match ? `image/${match[1]}` : `image`;
    const formData = new FormData(); // Ajouté ici
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    });
    try {
      const response = await axios.post('http://192.168.132.81:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Assuming the server returns an object like { disease: string, confidence: number }
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#E1F5FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Plant Disease Detection</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto} disabled={isLoading}>
            <Icon name="camera-alt" size={wp(6)} color="#FFFFFF" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage} disabled={isLoading}>
            <Icon name="photo-library" size={wp(6)} color="#FFFFFF" />
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity style={styles.submitButton} onPress={submitImage} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {prediction && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Detection Result</Text>
            <Text style={styles.resultText}>Disease: {prediction.disease}</Text>
            <Text style={styles.resultText}>Confidence: {(prediction.confidence * 100).toFixed(2)}%</Text>
          </View>
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    backgroundColor: '#388E3C',
    paddingVertical: hp(2),
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  appBarTitle: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: wp(4),
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp(90),
    marginVertical: hp(2),
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: wp(3),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(42),
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  buttonText: {
    fontSize: wp(4),
    color: '#FFFFFF',
    marginLeft: wp(2),
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
  image: {
    width: wp(80),
    height: hp(30),
    borderRadius: wp(3),
    marginBottom: hp(2),
  },
  submitButton: {
    backgroundColor: '#F44336',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: wp(2),
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  submitButtonText: {
    fontSize: wp(4.5),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#424242',
    padding: wp(4),
    borderRadius: wp(3),
    width: wp(90),
    marginTop: hp(2),
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  resultTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: hp(1),
  },
  resultText: {
    fontSize: wp(4),
    color: '#FFFFFF',
  },
});

export default PlantDiseasePage;