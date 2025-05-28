import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // State to track image loading
  const navigation = useNavigation();

  const nameInputRef = useRef(null);
  const cinInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Preload the background image
  useEffect(() => {
    const loadImage = async () => {
      try {
        // Simulate image preload (replace with Image.prefetch if using a remote image)
        setTimeout(() => {
          setImageLoaded(true); // Set to true after a short delay to simulate load
        }, 100); // Adjust delay based on testing
      } catch (error) {
        console.error('Error preloading image:', error);
        setImageLoaded(true); // Proceed even if preload fails
      }
    };
    loadImage();
  }, []);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!cin.trim()) {
      Alert.alert('Error', 'Please enter your CIN');
      return false;
    }
    if (!/^\d{8}$/.test(cin.trim())) {
      Alert.alert('Error', 'CIN must be exactly 8 digits');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!/^\+?\d{8}$/.test(phone.trim())) {
      Alert.alert('Error', 'Phone number must be exactly 8 digits');
      return false;
    }
    if (password.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const signUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const cinDocRequest = await getDoc(doc(db, 'requests', cin.trim()));
      const cinDocClient = await getDoc(doc(db, 'clients', cin.trim()));

      if (cinDocRequest.exists() || cinDocClient.exists()) {
        setIsLoading(false);
        Alert.alert('Error', 'CIN already registered');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      try {
        await setDoc(doc(db, 'requests', cin.trim()), {
          cin: cin.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          requestType: 'Client Signup',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          authUid: userCredential.user.uid,
        });

        await signOut(auth);
        setIsLoading(false);
        navigation.replace('SignInScreen');

        Alert.alert('Success', 'Registration successful! Please wait for approval.');
      } catch (firestoreError) {
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Error deleting user after failed Firestore save:', deleteError);
        }
        throw firestoreError;
      }
    } catch (error) {
      setIsLoading(false);
      let message;
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection and try again.';
          break;
        default:
          message = error.message || 'Registration failed';
      }
      Alert.alert('Error', message);
    }
  };

  useEffect(() => {
    return () => {
      nameInputRef.current = null;
      cinInputRef.current = null;
      emailInputRef.current = null;
      phoneInputRef.current = null;
      passwordInputRef.current = null;
    };
  }, []);

  // Show a loading indicator or fallback background until the image is loaded
  if (!imageLoaded) {
    return (
      <View style={[styles.background, styles.fallbackBackground]}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      blurRadius={5}
      onLoad={() => setImageLoaded(true)} // Ensure imageLoaded is true when image loads
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')} style={styles.backButton}>
              <Icon name="arrow-back" size={wp(6)} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>Sign Up</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            ref={nameInputRef}
            returnKeyType="next"
            onSubmitEditing={() => cinInputRef.current.focus()}
          />
          <TextInput
            style={styles.input}
            placeholder="CIN"
            value={cin}
            onChangeText={setCin}
            keyboardType="numeric"
            ref={cinInputRef}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current.focus()}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            ref={emailInputRef}
            returnKeyType="next"
            onSubmitEditing={() => phoneInputRef.current.focus()}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            ref={phoneInputRef}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current.focus()}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            ref={passwordInputRef}
            returnKeyType="done"
            onSubmitEditing={signUp}
          />
          {isLoading ? (
            <ActivityIndicator size="large" color="#2E7D32" />
          ) : (
            <TouchableOpacity onPress={signUp} style={styles.button}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  fallbackBackground: {
    backgroundColor: '#f5f7fa', // Fallback color to match original design
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: wp(4),
  },
  title: {
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  content: {
    flexGrow: 1,
    padding: wp(4),
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    width: wp(90),
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  button: {
    backgroundColor: '#1B5E20',
    paddingVertical: hp(1.8),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(2),
    width: wp(90),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: wp(4.2),
    fontWeight: '600',
  },
  link: {
    marginTop: hp(2),
    textAlign: 'center',
    color: '#2E7D32',
    fontSize: wp(3.8),
  },
});

export default SignUpScreen;