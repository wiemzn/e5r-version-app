import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../AppBackground';
import GreenEnergyCharts from './GreenEnergyCharts';

const { width } = Dimensions.get('window');

const GreenEnergyPage = () => {
  const [energyData, setEnergyData] = useState({});
  const [uid, setUid] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const database = getDatabase(app);
  const navigation = useNavigation();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        console.warn('User not logged in.');
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const energyRef = ref(database, `users/${uid}/greenenergy`);
    const unsubscribe = onValue(
      energyRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setEnergyData(data);
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

  const dailyProduction = energyData.daily_production != null ? Number(energyData.daily_production) : 0.0;
  const energyConsumption = energyData.energy_consumption != null ? Number(energyData.energy_consumption) : 0.0;

  const storedEnergy = energyData.stored_energy != null ? Number(energyData.stored_energy) : 0.0;

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={wp(6)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Green Energy</Text>
          <TouchableOpacity 
            style={styles.chartToggle}
            onPress={() => setShowCharts(!showCharts)}
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
        <ScrollView style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="wb-sunny" size={wp(6)} color="#2E7D32" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Daily Production</Text>
                <Text style={styles.cardValue}>{dailyProduction.toFixed(2)} kWh</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="power" size={wp(6)} color="#2E7D32" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Energy Consumed</Text>
                <Text style={styles.cardValue}>{energyConsumption.toFixed(2)} kWh</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="battery-charging-full" size={wp(6)} color="#2E7D32" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Stored Energy</Text>
                <Text style={styles.cardValue}>{storedEnergy.toFixed(2)} Kw</Text>
              </View>
            </View>
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
            {showCharts && <GreenEnergyCharts />}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: wp(2.5),
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
  statsContainer: {
    flexDirection: 'column',
    gap: hp(1.5),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    marginVertical: hp(1),
    padding: wp(4),
    width: '100%',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  iconContainer: {
    padding: wp(3),
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: wp(2),
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: wp(4),
    color: '#555555',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: wp(5),
    color: '#000000',
    fontWeight: 'bold',
    marginTop: hp(0.5),
  },
  chartsSection: {
    marginTop: hp(2),
    overflow: 'hidden',
  },
});

export default GreenEnergyPage;