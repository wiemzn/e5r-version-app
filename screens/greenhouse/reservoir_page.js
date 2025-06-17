import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import SensorCard from './SensorCard';
import ReservoirCharts from './ReservoirCharts';
import { useNavigation } from '@react-navigation/native';
import AppBackground from '../AppBackground';

const { width } = Dimensions.get('window');

const ReservoirPage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [uid, setUid] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

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

  const getUnit = (sensorName) => {
    switch (sensorName?.toLowerCase()) {
      case 'ph':
        return 'pH';
      case 'water_level':
        return '%';
      case 'ec':
        return 'mS/cm';
      default:
        return '';
    }
  };

  const data = Object.entries(sensorData)
    .filter(([key]) => ['ph', 'water_level', 'ec'].includes(key))
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={wp(6)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Reservoir</Text>
          <TouchableOpacity 
            style={styles.chartToggle}
            onPress={() => setShowCharts(!showCharts)}
          >
            <Icon 
              name={showCharts ? "insert-chart" : "show-chart"} 
              size={wp(6)} 
              color="#2E7D32" 
            />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {renderSensorCards()}
          {showCharts && (
            <View style={styles.chartsSection}>
              <ReservoirCharts />
            </View>
          )}
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
    padding: wp(4) 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
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
  sensorCards: {
    marginBottom: hp(2),
  },
  chartsSection: {
    marginTop: hp(2),

    borderRadius: wp(3),
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
});

export default ReservoirPage;