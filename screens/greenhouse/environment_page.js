import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from '@react-native-community/slider';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import SensorCard from './SensorCard';
import ActuatorCard from './ActuatorCard';
import GoogleSheetsService from '../../googlesheetservice';

const EnvironmentPage = () => {
  const [sensorData, setSensorData] = useState({});
  const [ventilationState, setVentilationState] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/idriss/greenhouse');

  useEffect(() => {
    // Fetch Firebase data
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);
      setVentilationState(data.ventilation === 'ON');
      setLedState(data.led === 'ON');
    });

    // Fetch chart data
    const loadChartData = async () => {
      const data = await GoogleSheetsService.fetchChartData();
      setChartData(data || {});
    };
    loadChartData();

    return () => unsubscribe();
  }, []);

  const toggleVentilation = async (value) => {
    try {
      await set(ref(database, 'users/idriss/greenhouse/ventilation'), value ? 'ON' : 'OFF');
      setVentilationState(value);
    } catch (e) {
      console.error('Error toggling ventilation:', e);
    }
  };

  const toggleLed = async (value) => {
    try {
      await set(ref(database, 'users/idriss/greenhouse/led'), value ? 'ON' : 'OFF');
      setLedState(value);
    } catch (e) {
      console.error('Error toggling LED:', e);
    }
  };

  const getUnit = (sensorName) => {
    switch (sensorName?.toLowerCase()) {
      case 'humidity':
        return '%';
      case 'temperature':
        return '°C';
      case 'ventilation':
      case 'led':
        return '';
      default:
        return '';
    }
  };

  const data = Object.entries(sensorData)
    .filter(([key]) => ['humidity', 'temperature', 'ventilation', 'led'].includes(key))
    .map(([key, value]) => ({
      sensorName: key,
      value: value?.toString() || 'N/A',
      unit: getUnit(key),
      isActuator: ['ventilation', 'led'].includes(key),
    }));

  const renderItem = ({ item }) => {
    if (item.isActuator) {
      return (
        <ActuatorCard
          actuatorName={item.sensorName}
          value={item.value}
          unit={item.unit}
          switchValue={item.sensorName === 'ventilation' ? ventilationState : ledState}
          onSwitchChanged={item.sensorName === 'ventilation' ? toggleVentilation : toggleLed}
        />
      );
    }
    return (
      <SensorCard
        sensorName={item.sensorName}
        value={item.value}
        unit={item.unit}
        isExpanded={expandedSensor === item.sensorName}
        onToggle={() => setExpandedSensor(expandedSensor === item.sensorName ? null : item.sensorName)}
        chart={
          item.sensorName === 'temperature' ? (
            <Text style={styles.placeholderText}>Temperature Gauge Placeholder (Implement with react-native-circular-progress)</Text>
          ) : expandedSensor === item.sensorName && chartData[item.sensorName]?.length > 0 ? (
            <Text style={styles.placeholderText}>Chart Placeholder for {item.sensorName} (Implement with react-native-chart-kit)</Text>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#E1F5FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Environment</Text>
      </View>
      {Object.keys(sensorData).length === 0 ? (
        <ActivityIndicator size="large" color="#388E3C" style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.sensorName}
          contentContainerStyle={styles.content}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    backgroundColor: '#388E3C',
    paddingVertical: hp(2),
    alignItems: 'center',
    elevation: 4,
  },
  appBarTitle: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: wp(4),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: wp(4),
    color: '#000000',
    textAlign: 'center',
    marginVertical: hp(2),
  },
});

export default EnvironmentPage;