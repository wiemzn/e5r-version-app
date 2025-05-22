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

const cubes = [
  { 
    title: 'Greenhouse',
    icon: 'eco',
    color: '#2E7D32',
    gradient: ['#43A047', '#1B5E20'],
    description: 'Monitor and control your greenhouse'
  },
  { 
    title: 'Green Energy',
    icon: 'bolt',
    color: '#FF8F00',
    gradient: ['#FFA000', '#FF6F00'],
    description: 'Track energy production'
  },
  { 
    title: 'Plant Health',
    icon: 'health-and-safety',
    color: '#C62828',
    gradient: ['#E53935', '#C62828'],
    description: 'Check plant conditions'
  },
  { 
    title: 'Weather',
    icon: 'wb-sunny',
    color: '#0288D1',
    gradient: ['#039BE5', '#0277BD'],
    description: 'View weather forecast'
  },
];

const { width } = Dimensions.get('window');
const numColumns = 2;
const cubeSize = (width - wp(12)) / numColumns;

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
            <Icon name={item.icon} size={wp(12)} color="#FFFFFF" />
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.background}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Icon name="logout" size={wp(5)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Animatable.View 
            animation="fadeInDown" 
            delay={200}
            style={styles.connectionStatus}
          >
            <Icon name="agriculture" size={wp(4)} color="#FFFFFF" />
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
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: hp(2),
  },
  header: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: wp(4),
    color: '#E8F5E9',
    marginBottom: hp(0.5),
  },
  userName: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: wp(2.5),
    borderRadius: wp(6),
  },
  connectionStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  connectionText: {
    fontSize: wp(3.5),
    color: '#FFFFFF',
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
    padding: wp(3),
    paddingBottom: hp(2),
  },
  cubeWrapper: {
    margin: wp(2),
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
    padding: wp(4),
    overflow: 'hidden',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  cubeTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  cubeDescription: {
    fontSize: wp(3.2),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default HomePage;