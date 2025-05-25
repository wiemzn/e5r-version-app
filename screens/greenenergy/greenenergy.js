import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

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
        console.warn('Utilisateur non connecté.');
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
        console.log('Firebase energyData:', data);
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
    <View style={[styles.card, { backgroundColor: `${color}22` }]}>
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
      <Text style={styles.chartTitle}>Production du jour</Text>
      <LineChart
        data={{
          labels: ['00:00', '06:00', '12:00', '18:00', '23:59'],
          datasets: [{ data: [0, 5, 15, 10, 8] }],
        }}
        width={wp(90)}
        height={hp(25)}
        chartConfig={{
          backgroundGradientFrom: '#f5f5f5',
          backgroundGradientTo: '#f5f5f5',
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
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonCircle}>
          <Icon name="arrow-back" size={wp(6)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.appBarCenter}>
          <Icon name="bolt" size={wp(5)} color="#FFFFFF" style={{ marginRight: wp(1) }} />
          <Text style={styles.appBarTitle}>Greenenergy</Text>
        </View>
        <View style={{ width: wp(6) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {buildEnergyProductionChart()}
        <View style={styles.statsContainer}>
          {buildStatCard('Production du jour', dailyProduction, 'kWh', 'eco', '#4CAF50')} {/* Vert */}
          {buildStatCard('Énergie utilisée', energyConsumption, 'kWh', 'bolt', '#FF9800')} {/* Orange */}
          {buildStatCard('Énergie stockée', storedEnergy, 'kWh', 'battery-charging-full', '#03A9F4')} {/* Bleu */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#388E3C',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
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
  appBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButtonCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: wp(10),
    padding: wp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: wp(4),
    paddingBottom: hp(5),
  },
  chartCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp(3),
    marginBottom: hp(2),
    padding: wp(4),
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
  },
  chart: {
    borderRadius: wp(4),
  },
  statsContainer: {
    flexDirection: 'column',
    gap: hp(1.5),
  },
  card: {
    flexDirection: 'row',
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
    fontSize: wp(3.5),
    color: '#555555',
  },
  cardValue: {
    fontSize: wp(5),
    fontWeight: 'bold',
    marginTop: hp(0.5),
  },
});

export default GreenEnergyPage;
