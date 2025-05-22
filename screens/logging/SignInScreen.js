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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Attempting login with email: ${email.trim()}`);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      console.log(`User logged in: ${userCredential.user.uid}`);

      console.log(`Querying Firestore clients collection for authUid: ${userCredential.user.uid}`);
      const q = query(
        collection(db, 'clients'),
        where('authUid', '==', userCredential.user.uid),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`No client document found for UID: ${userCredential.user.uid}`);
        Alert.alert('Error', 'Account not found. Please sign up.');
        await auth.signOut();
        return;
      }

      const doc = querySnapshot.docs[0];
      console.log(`Client document found: ${doc.id}, data: ${JSON.stringify(doc.data())}`);
      const status = doc.data().status;
      console.log(`Client status: ${status}`);

      if (status === 'approved') {
        Alert.alert('Success', 'Login successful!');
        navigation.replace('HomePage');
      } else {
        console.log('Account not approved, signing out');
        Alert.alert('Error', `Account is ${status}. Please wait for approval.`);
        await auth.signOut();
        console.log('User signed out due to non-approved status');
      }
    } catch (error) {
      let message;
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = error.message || 'Login failed';
      }
      console.log(`FirebaseAuthException: ${error.code}, ${message}`);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      console.log(`Login process completed, isLoading: ${isLoading}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Login</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => this.passwordInput.focus()}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          ref={(input) => (this.passwordInput = input)}
          onSubmitEditing={login}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUpScreen')}
        >
          <Text style={styles.link}>Create New Account</Text>
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

export default SignInScreen;