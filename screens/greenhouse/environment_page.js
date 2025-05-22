import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LineChart } from 'react-native-chart-kit';
import SensorCard from './SensorCard';
import GoogleSheetsService from '../../googlesheetservice';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width * 0.85; // 85% of screen width

const ActuatorCard = ({ actuatorName, value, unit, switchValue, onSwitchChanged }) => {
  const getIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'ventilation':
        return 'air';
      case 'led':
        return 'lightbulb';
      default:
        return 'tune';
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F5F7FA']}
      style={styles.actuatorCard}
    >
      <View style={styles.actuatorHeader}>
        <Icon name={getIcon(actuatorName)} size={wp(8)} color="#388E3C" />
        <Text style={styles.actuatorTitle}>{actuatorName.replace('_', ' ')}</Text>
      </View>
      <View style={styles.actuatorContent}>
        <Text style={styles.actuatorStatus}>
          Status: {switchValue ? 'ON' : 'OFF'} {unit}
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: switchValue ? '#388E3C' : '#B0BEC5' },
          ]}
          onPress={() => onSwitchChanged(!switchValue)}
          accessible={true}
          accessibilityLabel={`Toggle ${actuatorName} ${switchValue ? 'off' : 'on'}`}
        >
          <Text style={styles.toggleButtonText}>
            {switchValue ? 'Turn OFF' : 'Turn ON'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const EnvironmentPage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [ventilationState, setVentilationState] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const [rawChartData, setRawChartData] = useState({});
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('day');
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/11992784/greenhouse');

  useEffect(() => {
    // Fetch Firebase data
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);
      setVentilationState(data.ventilation === 'ON');
      setLedState(data.led === 'ON');
    }, (error) => {
      console.error('Firebase error:', error);
    });

    // Fetch chart data
    const loadChartData = async () => {
      setIsChartLoading(true);
      try {
        const data = await GoogleSheetsService.fetchChartData();
        setRawChartData(data || {});
        const filteredData = GoogleSheetsService.filterDataByRange(data, selectedFilter);
        setChartData(filteredData || {});
      } catch (e) {
        console.error('Error loading chart data:', e);
      } finally {
        setIsChartLoading(false);
      }
    };
    loadChartData();

    return () => unsubscribe();
  }, []);

  // Re-filter chart data when selectedFilter changes
  useEffect(() => {
    if (Object.keys(rawChartData).length > 0) {
      const filteredData = GoogleSheetsService.filterDataByRange(rawChartData, selectedFilter);
      setChartData(filteredData || {});
    }
  }, [selectedFilter, rawChartData]);

  const toggleVentilation = async (value) => {
    try {
      await set(ref(database, 'users/11992784/greenhouse/ventilation'), value ? 'ON' : 'OFF');
      setVentilationState(value);
    } catch (e) {
      console.error('Error toggling ventilation:', e);
    }
  };

  const toggleLed = async (value) => {
    try {
      await set(ref(database, 'users/11992784/greenhouse/led'), value ? 'ON' : 'OFF');
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

    const chartPoints = chartData[item.sensorName]?.length > 0 
      ? chartData[item.sensorName] 
      : [];

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
              <ActivityIndicator
                size="small"
                color="#388E3C"
                style={styles.chartLoader}
              />
            ) : chartPoints.length > 0 ? (
              <View style={styles.chartContainer}>
                <View style={styles.filterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === 'day' && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter('day')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === 'day' && styles.filterButtonTextActive,
                      ]}
                    >
                      Daily
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === 'week' && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter('week')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === 'week' && styles.filterButtonTextActive,
                      ]}
                    >
                      Weekly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === 'month' && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter('month')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === 'month' && styles.filterButtonTextActive,
                      ]}
                    >
                      Monthly
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                      datasets: [
                        {
                          data: chartPoints.map((p) => p.y),
                        },
                      ],
                    }}
                    width={CHART_WIDTH}
                    height={220}
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
                      hidePointsAtIndex: chartPoints.map((_, index) => index),
                      xAxisLabel: () => '',
                      xLabelsOffset: -10,
                    }}
                    bezier
                    style={styles.chart}
                    fromZero={true}
                    withInnerLines={false}
                    withOuterLines={false}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                No chart data available for {item.sensorName}
              </Text>
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={wp(6)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Icon name="thermostat" size={wp(6)} color="#FFFFFF" style={styles.titleIcon} />
          <Text style={styles.appBarTitle}>Environment</Text>
        </View>
        <View style={styles.placeholder} />
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
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  backButton: {
    padding: wp(1),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    marginRight: wp(2),
  },
  appBarTitle: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: wp(8),
  },
  content: {
    padding: wp(4),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  chartContainer: {
    marginVertical: hp(2),
    maxHeight: 300,
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
    borderRadius: wp(3),
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  filterButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    backgroundColor: '#E0E0E0',
    marginHorizontal: wp(1),
  },
  filterButtonActive: {
    backgroundColor: '#388E3C',
  },
  filterButtonText: {
    fontSize: wp(3.5),
    color: '#000000',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  actuatorCard: {
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  actuatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  actuatorTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#1B5E20',
    marginLeft: wp(2),
  },
  actuatorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actuatorStatus: {
    fontSize: wp(4),
    color: '#616161',
  },
  toggleButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
  },
  toggleButtonText: {
    fontSize: wp(3.5),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default EnvironmentPage;