import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from '@react-native-community/slider';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LineChart } from 'react-native-chart-kit';
import SensorCard from './SensorCard';
import ActuatorCard from './ActuatorCard';
import GoogleSheetsService from '../../googlesheetservice';
console.log('ActuatorCard import:', ActuatorCard);

const ReservoirPage = () => {
  const [sensorData, setSensorData] = useState({});
  const [pumpState, setPumpState] = useState(false);
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const [isChartLoading, setIsChartLoading] = useState(false);
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/idriss/greenhouse');

  useEffect(() => {
    // Fetch Firebase data
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);
      setPumpState(data['water pump'] === 'ON');
    }, (error) => {
      console.error('Firebase error:', error);
    });

    // Fetch chart data
    const loadChartData = async () => {
      setIsChartLoading(true);
      try {
        const data = await GoogleSheetsService.fetchChartData();
        setChartData(data || {});
      } catch (e) {
        console.error('Error loading chart data:', e);
      } finally {
        setIsChartLoading(false);
      }
    };
    loadChartData();

    return () => unsubscribe();
  }, []);

  const togglePump = async (value) => {
    try {
      await set(ref(database, 'users/idriss/greenhouse/water_pump'), value ? 'ON' : 'OFF');
      setPumpState(value);
    } catch (e) {
      console.error('Error toggling pump:', e);
    }
  };

  const getUnit = (sensorName) => {
    switch (sensorName?.toLowerCase()) {
      case 'water pump':
        return '';
      case 'ph':
        return 'pH';
      case 'water_level':
        return '%';
      default:
        return '';
    }
  };

  const data = Object.entries(sensorData)
    .filter(([key]) => ['water pump', 'ph', 'water_level'].includes(key))
    .map(([key, value]) => ({
      sensorName: key,
      value: value?.toString() || 'N/A',
      unit: getUnit(key),
      isActuator: key === 'water pump',
    }));

  const renderItem = ({ item }) => {
    if (item.isActuator) {
      return (
        <ActuatorCard
          actuatorName={item.sensorName}
          value={item.value}
          unit={item.unit}
          switchValue={pumpState}
          onSwitchChanged={togglePump}
        />
      );
    }

    const chartPoints = chartData[item.sensorName]?.length > 0 ? chartData[item.sensorName] : [];
    const chartLabels = chartPoints.map(point => point.x.toFixed(1));
    const chartValues = chartPoints.map(point => point.y);

    return (
      <SensorCard
        sensorName={item.sensorName}
        value={item.value}
        unit={item.unit}
        isExpanded={expandedSensor === item.sensorName}
        onToggle={() => setExpandedSensor(expandedSensor === item.sensorName ? null : item.sensorName)}
        chart={
          expandedSensor === item.sensorName ? (
            isChartLoading ? (
              <ActivityIndicator size="small" color="#388E3C" style={styles.chartLoader} />
            ) : chartPoints.length > 0 ? (
              <LineChart
                data={{
                  labels: chartLabels.slice(-10), // Show last 10 points for readability
                  datasets: [{ data: chartValues.slice(-10) }],
                }}
                width={wp(80)}
                height={hp(30)}
                chartConfig={{
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
            ) : (
              <Text style={styles.placeholderText}>No chart data available for {item.sensorName}</Text>
            )
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
        <Text style={styles.appBarTitle}>Reservoir</Text>
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
  chartLoader: {
    marginVertical: hp(2),
  },
  placeholderText: {
    fontSize: wp(4),
    color: '#000000',
    textAlign: 'center',
    marginVertical: hp(2),
  },
  chart: {
    marginVertical: hp(2),
    borderRadius: wp(3),
  },
});

export default ReservoirPage;