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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const navigation = useNavigation();

  const nameInputRef = useRef(null);
  const cinInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);

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
    if (!/^\+?\d{10,15}$/.test(phone.trim())) {
      Alert.alert('Error', 'Please enter a valid phone number (10-15 digits)');
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

  return (
    <LinearGradient colors={['#f5f7fa', '#e4f5e8']} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.appBar}>
          <View style={styles.appBarGradient}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.iconBackground}>
                <Icon name="arrow-back" size={wp(6)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.appBarTitle}>Create Account</Text>
            </View>
            <View style={styles.emptySpace} />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
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
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity onPress={signUp}>
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.button}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  appBar: {
    overflow: 'hidden',
    borderBottomLeftRadius: wp(5),
    borderBottomRightRadius: wp(5),
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  appBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  iconBackground: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: wp(5),
    padding: wp(2),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    marginRight: wp(2),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emptySpace: {
    width: wp(10),
  },
  content: {
    flexGrow: 1,
    padding: wp(4),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
    marginTop: hp(2),
    borderRadius: wp(3),
    paddingVertical: hp(1.8),
    alignItems: 'center',
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
