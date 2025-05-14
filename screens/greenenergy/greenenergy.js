import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const GreenEnergyPage = () => {
  const [energyData, setEnergyData] = useState({});
  const database = getDatabase(app);
  const energyRef = ref(database, 'users/idriss/greenenergy');

  useEffect(() => {
    const unsubscribe = onValue(energyRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log('Firebase energyData:', data);
      setEnergyData(data);
    }, (error) => {
      console.error('Firebase error:', error);
    });
    return () => unsubscribe();
  }, []);

  const power = energyData.power != null ? Number(energyData.power) : 0.0;
  const voltage = energyData.voltage != null ? Number(energyData.voltage) : 0.0;
  const current = energyData.current != null ? Number(energyData.current) : 0.0;

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
      <Text style={styles.chartTitle}>Energy Production (Today)</Text>
      <LineChart
        data={{
          labels: ['00:00', '06:00', '12:00', '18:00', '23:59'],
          datasets: [{ data: [0, 5, 15, 10, 8] }],
        }}
        width={wp(90)}
        height={hp(25)}
        chartConfig={{
          backgroundGradientFrom: '#424242',
          backgroundGradientTo: '#424242',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: wp(3),
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2E7D32',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#212121', '#424242']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Green Energy Dashboard</Text>
        <TouchableOpacity onPress={() => { /* Manual refresh */ }}>
          <Icon name="refresh" size={wp(6)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {buildEnergyProductionChart()}
        <View style={styles.gaugeContainer}>
          {buildStatCard('Power', power, 'W', 'bolt', '#FFC107')}
          {buildStatCard('Voltage', voltage, 'V', 'electrical-services', '#2196F3')}
        </View>
        {buildStatCard('Current', current, 'A', 'flash-on', '#4CAF50')}
        {buildStatCard('Daily Production', 24.5, 'kWh', 'eco', '#8BC34A')}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => { /* Navigate or trigger view */ }}>
        <Icon name="insights" size={wp(7)} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
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
  appBarTitle: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  chartCard: {
    backgroundColor: '#424242',
    borderRadius: wp(3),
    marginBottom: hp(2),
    padding: wp(4),
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: hp(2),
  },
  chart: {
    borderRadius: wp(3),
  },
  gaugeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    borderRadius: wp(3),
    marginVertical: hp(1),
    padding: wp(4),
    width: wp(90),
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  iconContainer: {
    padding: wp(3),
    borderRadius: wp(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: wp(4),
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: wp(4),
    color: '#B0BEC5',
  },
  cardValue: {
    fontSize: wp(6),
    fontWeight: 'bold',
    marginTop: hp(0.5),
  },
  fab: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(4),
    backgroundColor: '#4CAF50',
    borderRadius: wp(50),
    padding: wp(4),
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
});

export default GreenEnergyPage;