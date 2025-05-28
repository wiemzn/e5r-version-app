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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../AppBackground';

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
    <AppBackground>
      <SafeAreaView style={styles.container}>
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
                <ActivityIndicator size="large" color="#2E7D32" />
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
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  content: {
    flexGrow: 1,
    padding: wp(4),
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: wp(15),
    color: '#2E7D32',
  },
  successText: {
    fontSize: wp(5),
    marginVertical: hp(2),
    color: '#000000',
  },
  form: {
    width: '100%',
  },
  instruction: {
    fontSize: wp(4.5),
    marginBottom: hp(2),
    textAlign: 'center',
    color: '#000000',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  button: {
    backgroundColor: '#1B5E20',
    padding: wp(4),
    borderRadius: wp(3),
    alignItems: 'center',
    marginBottom: hp(2),
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: '600',
  },
  link: {
    color: '#2E7D32',
    fontSize: wp(4),
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;