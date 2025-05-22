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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

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
      // Check if CIN exists in both requests and clients collections
      const cinDocRequest = await getDoc(doc(db, 'requests', cin.trim()));
      const cinDocClient = await getDoc(doc(db, 'clients', cin.trim()));
      
      if (cinDocRequest.exists() || cinDocClient.exists()) {
        setIsLoading(false);
        Alert.alert('Error', 'CIN already registered');
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      try {
        // Store user data in requests collection
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

        // Sign out and redirect immediately
        await signOut(auth);
        setIsLoading(false);
        navigation.replace('SignInScreen');
        
        // Show success message after navigation
        

      } catch (firestoreError) {
        // If Firestore save fails, delete the auth account
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
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Create Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          ref={nameInputRef}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="CIN"
          value={cin}
          onChangeText={setCin}
          keyboardType="numeric"
          ref={cinInputRef}
          returnKeyType="next"
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
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          ref={phoneInputRef}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          ref={passwordInputRef}
          returnKeyType="done"
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={signUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
});

export default SignUpScreen;
