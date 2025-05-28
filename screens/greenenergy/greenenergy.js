import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AppBackground from '../AppBackground';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CHART_WIDTH = wp(90) - wp(8); // Ajusté pour prendre en compte le padding de chartCard

const GreenEnergyPage = () => {
  const [energyData, setEnergyData] = useState({});
  const [uid, setUid] = useState(null);
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

  const dailyProduction = energyData.daily_production != null ? Number(energyData.daily_production) : 0.0;
  const energyConsumption = energyData.energy_consumption != null ? Number(energyData.energy_consumption) : 0.0;
  const storedEnergy = energyData.stored_energy != null ? Number(energyData.stored_energy) : 0.0;

  const buildStatCard = (label, value, unit, icon, color) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}33` }]}>
        <Icon name={icon} size={wp(7)} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardValue, { color }]}>{value != null ? `${value} ${unit}` : '--'}</Text>
      </View>
    </View>
  );

  const buildEnergyProductionChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Daily Production</Text>
      <LineChart
        data={{
          labels: ['00:00', '06:00', '12:00', '18:00', '23:59'],
          datasets: [{ data: [0, 5, 15, 10, 8] }],
        }}
        width={CHART_WIDTH}
        height={hp(25)} // Réduit pour meilleure adaptation
        chartConfig={{
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: wp(3),
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#4CAF50',
          },
        }}
        bezier
        style={styles.chart}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={true}
      />
    </View>
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={wp(5)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Green Energy</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {buildEnergyProductionChart()}
          <View style={styles.statsContainer}>
            {buildStatCard('Daily Production', dailyProduction, 'kWh', 'eco', '#4CAF50')}
            {buildStatCard('Energy Consumption', energyConsumption, 'kWh', 'bolt', '#FF9800')}
            {buildStatCard('Stored Energy', storedEnergy, 'kWh', 'battery-charging-full', '#03A9F4')}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  subtitle: {
    fontSize: wp(4),
    color: '#555555',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  content: {
    padding: wp(5),
    paddingBottom: hp(5),
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    marginBottom: hp(2),
    padding: wp(4),
    overflow: 'hidden', // Ajouté pour éviter le débordement
    alignSelf: 'center', // Centrer le conteneur
    width: wp(90), // Largeur fixe pour correspondre à CHART_WIDTH + padding
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  chart: {
    borderRadius: wp(3),
    alignSelf: 'center', // Centrer le graphique
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
    fontWeight: 'bold',
    marginTop: hp(0.5),
  },
});

export default GreenEnergyPage;