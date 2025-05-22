import React, { useState } from 'react';
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
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigation = useNavigation();

  const sendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetEmailSent(true);
    } catch (error) {
      let message;
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/user-not-found':
          message = 'No user found with this email.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = error.message || 'Password reset failed';
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Forgot Password</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {resetEmailSent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Password reset email sent!</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.replace('SignInScreen')}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.instruction}>
              Enter your email to receive a password reset link
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={sendResetEmail}
            />
            {isLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <TouchableOpacity style={styles.button} onPress={sendResetEmail}>
                <Text style={styles.buttonText}>Send Reset Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.replace('SignInScreen')}
            >
              <Text style={styles.link}>Remember your password? Login</Text>
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
    color: '#4CAF50',
  },
  successText: {
    fontSize: 18,
    marginVertical: 20,
  },
  form: {
    width: '100%',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
  },
});

export default ForgotPasswordScreen;