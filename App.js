import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import HomeScreen from './screens/home/home_screen';
import GreenhousePage from './screens/greenhouse/greenhousepage';
import EnvironmentPage from './screens/greenhouse/environment_page';
import ReservoirPage from './screens/greenhouse/reservoir_page';
import ControlsScreen from './screens/greenhouse/controls';
import GreenEnergyPage from './screens/greenenergy/greenenergy';
import PlantDiseasePage from './screens/plantdisease/PlantDiseasePage';
import Weather from './screens/weather/weather';
import SignInScreen from './screens/logging/SignInScreen';
import SignUpScreen from './screens/logging/SignUpScreen';
import ForgotPasswordScreen from './screens/logging/ForgotPassword';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth'; 
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? "HomeScreen" : "SignInScreen"}>
          {user ? (
            <>
              <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="GreenhousePage" component={GreenhousePage} options={{ headerShown: false }} />
              <Stack.Screen name="EnvironmentPage" component={EnvironmentPage}  options={{ headerShown: false }} />
              <Stack.Screen name="ReservoirPage" component={ReservoirPage} options={{ headerShown: false }} />
              <Stack.Screen name="Controls" component={ControlsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="GreenEnergyPage" component={GreenEnergyPage} options={{ headerShown: false }} />
              <Stack.Screen name="PlantDiseasePage" component={PlantDiseasePage} options={{ headerShown: false }} />
              <Stack.Screen name="Weather" component={Weather} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="SignInScreen" component={SignInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}