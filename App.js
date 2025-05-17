import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import HomeScreen from './screens/home/home_screen';
import GreenhousePage from './screens/greenhouse/greenhousepage';
import EnvironmentPage from './screens/greenhouse/environment_page';
import ReservoirPage from './screens/greenhouse/reservoir_page';
import GreenEnergyPage from './screens/greenenergy/greenenergy';
import PlantDiseasePage from './screens/plantdisease/PlantDiseasePage';
import Weather from './screens/weather/weather';
import SignInScreen from './screens/auth/SignInScreen';
import SignUpScreen from './screens/auth/SignUpScreen';
const Stack = createStackNavigator();
export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeScreen">
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="GreenhousePage" component={GreenhousePage} />
          <Stack.Screen name="EnvironmentPage" component={EnvironmentPage} />
          <Stack.Screen name="ReservoirPage" component={ReservoirPage} />
          <Stack.Screen name="GreenEnergyPage" component={GreenEnergyPage} />
          <Stack.Screen name="PlantDiseasePage" component={PlantDiseasePage} />
          <Stack.Screen name="Weather" component={Weather} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}