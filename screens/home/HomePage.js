import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Dimensions, Animated, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { auth } from '../../firebaseConfig';
import AuthService from '../logging/AuthService';
import * as Animatable from 'react-native-animatable';
import AppBackground from '../AppBackground';

const cubes = [
  { 
    title: 'Greenhouse',
    icon: 'eco',
    color: '#A5D6A7',
    gradient: ['#A5D6A7', '#66BB6A'],
    description: 'Monitor and control your greenhouse'
  },
  { 
    title: 'Green Energy',
    icon: 'bolt',
    color: '#FFCC80',
    gradient: ['#FFCC80', '#FFB300'],
    description: 'Track energy production'
  },
  { 
    title: 'Plant Health',
    icon: 'health-and-safety',
    color: '#EF9A9A',
    gradient: ['#EF9A9A', '#F44336'],
    description: 'Check plant conditions'
  },
  { 
    title: 'Weather',
    icon: 'wb-sunny',
    color: '#81D4FA',
    gradient: ['#81D4FA', '#42A5F5'],
    description: 'View weather forecast'
  },
];

const { width } = Dimensions.get('window');
const numColumns = 2;
const cubeSize = (width - wp(12)) / numColumns - wp(4); // Ajustement pour éviter le rognage

const HomePage = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email.split('@')[0]);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCubePress = (title) => {
    if (title === 'Greenhouse') {
      navigation.navigate('GreenhousePage');
    } else if (title === 'Green Energy') {
      navigation.navigate('GreenEnergyPage');
    } else if (title === 'Plant Health') {
      navigation.navigate('PlantDiseasePage');
    } else if (title === 'Weather') {
      navigation.navigate('Weather');
    }
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    navigation.replace('SignInScreen');
  };

  const renderCube = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={300 * index}
      duration={800}
    >
      <TouchableOpacity 
        onPress={() => handleCubePress(item.title)}
        activeOpacity={0.9}
        style={styles.cubeWrapper}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cube, { width: cubeSize, height: cubeSize }]}
        >
          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={wp(10)} color="#FFFFFF" />
          </View>
          <Text style={styles.cubeTitle}>{item.title}</Text>
          <Text style={styles.cubeDescription}>{item.description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Home</Text>
            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Icon name="logout" size={wp(5)} color="#000000" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.greetingContainer, { opacity: fadeAnim }]}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </Animated.View>

          <Animatable.View 
            animation="fadeInDown" 
            delay={200}
            style={styles.connectionStatus}
          >
            <Icon name="agriculture" size={wp(4)} color="#000000" />
            <Text style={styles.connectionText}>System Online</Text>
            <View style={styles.statusDot} />
          </Animatable.View>
          
          <FlatList
            data={cubes}
            renderItem={renderCube}
            keyExtractor={(item) => item.title}
            numColumns={numColumns}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
          
          <Animatable.View 
            animation="fadeInUp"
            delay={1200}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </Animatable.View>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: hp(2), // Ajout pour éviter le rognage en bas
  },
  content: {
    flex: 1,
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
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
  logoutButton: {
    padding: wp(2.5),
  },
  greetingContainer: {
    marginBottom: hp(2),
  },
  greeting: {
    fontSize: wp(4),
    color: '#555555',
    marginBottom: hp(0.5),
  },
  userName: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
  connectionStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  connectionText: {
    fontSize: wp(3.5),
    color: '#000000',
    marginLeft: wp(2),
    flex: 1,
  },
  statusDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#4CAF50',
    marginLeft: wp(2),
  },
  grid: {
    padding: wp(1), // Réduit le padding
    paddingBottom: hp(2),
  },
  cubeWrapper: {
    margin: wp(1), // Réduit la marge
    borderRadius: wp(4),
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  cube: {
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(2), // Réduit le padding interne
    overflow: 'hidden',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  cubeTitle: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp(0.5),
  },
  cubeDescription: {
    fontSize: wp(3),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: wp(1),
  },
  footer: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: wp(3.2),
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

export default HomePage;