import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import SensorCard from './SensorCard';
import EnvironmentCharts from './EnvironmentCharts';
import { useNavigation } from '@react-navigation/native';
import AppBackground from '../AppBackground';

const EnvironmentPage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [uid, setUid] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const database = getDatabase(app);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        console.warn('Utilisateur non connecté.');
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const controlsRef = ref(database, `users/${uid}/greenhouse`);
    const unsubscribe = onValue(
      controlsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setSensorData(data);
      },
      (error) => {
        console.error('Firebase error:', error);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showCharts ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showCharts]);

  const getUnit = (sensorName) => {
    switch (sensorName?.toLowerCase()) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'light':
        return 'lux';
      default:
        return '';
    }
  };

  const data = Object.entries(sensorData)
    .filter(([key]) => ['temperature', 'humidity', 'light'].includes(key))
    .map(([key, value]) => ({
      sensorName: key,
      value: value?.toString() || 'N/A',
      unit: getUnit(key),
    }));

  const renderSensorCards = () => (
    <View style={styles.sensorCards}>
      {data.map((item) => (
        <SensorCard
          key={item.sensorName}
          sensorName={item.sensorName}
          value={item.value}
          unit={item.unit}
        />
      ))}
    </View>
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={wp(6)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Environment</Text>
          <TouchableOpacity 
            style={styles.chartToggle}
            onPress={() => setShowCharts(!showCharts)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.iconContainer, showCharts && styles.iconContainerActive]}>
              <Icon 
                name={showCharts ? "insert-chart" : "show-chart"} 
                size={wp(6)} 
                color={showCharts ? "#FFFFFF" : "#2E7D32"} 
              />
            </View>
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {renderSensorCards()}
          </View>
          <Animated.View 
            style={[
              styles.chartsSection,
              { 
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            {showCharts && <EnvironmentCharts />}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: { 
    flex: 1 
  },
  contentContainer: { 
    padding: wp(4),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: wp(2),
  },
  title: {
    flex: 1,
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  chartToggle: {
    padding: wp(2),
  },
  iconContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: wp(6),
    width: wp(12),
    height: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainerActive: {
    backgroundColor: '#2E7D32',
  },
  cardsContainer: {
    marginBottom: hp(2),
  },
  sensorCards: {
    marginBottom: hp(2),
  },
  chartsSection: {
    marginTop: hp(2),
    overflow: 'hidden',
  },
});

export default EnvironmentPage;