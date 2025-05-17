import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LineChart } from 'react-native-chart-kit';
import SensorCard from './SensorCard';
import GoogleSheetsService from '../../googlesheetservice';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width * 2;

const ActuatorCard = ({ actuatorName, value, unit, switchValue, onSwitchChanged }) => {
  const getIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'water_pump':
        return 'water';
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

const ReservoirPage = () => {
  const [sensorData, setSensorData] = useState({});
  const [actuatorStates, setActuatorStates] = useState({
    water_pump: false,
    ventilation: false,
    led: false,
  });
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Daily');
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/idriss/greenhouse');

  useEffect(() => {
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);
      setActuatorStates({
        water_pump: data['water_pump'] === 'ON',
        ventilation: data['ventilation'] === 'ON',
        led: data['led'] === 'ON',
      });
    }, (error) => {
      console.error('Firebase error:', error);
    });

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

  const toggleActuator = async (actuatorName, value) => {
    try {
      await set(ref(database, `users/idriss/greenhouse/${actuatorName}`), value ? 'ON' : 'OFF');
      setActuatorStates((prev) => ({
        ...prev,
        [actuatorName]: value,
      }));
    } catch (e) {
      console.error(`Error toggling ${actuatorName}:`, e);
    }
  };

  const getUnit = (sensorName) => {
    switch (sensorName?.toLowerCase()) {
      case 'water_pump':
      case 'ventilation':
      case 'led':
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
    .filter(([key]) => ['water_pump', 'ph', 'water_level'].includes(key))
    .map(([key, value]) => ({
      sensorName: key,
      value: value?.toString() || 'N/A',
      unit: getUnit(key),
      isActuator: ['water_pump'].includes(key),
    }));

  const renderItem = ({ item }) => {
    if (item.isActuator) {
      return (
        <ActuatorCard
          actuatorName={item.sensorName}
          value={item.value}
          unit={item.unit}
          switchValue={actuatorStates[item.sensorName]}
          onSwitchChanged={(value) => toggleActuator(item.sensorName, value)}
        />
      );
    }

    const chartPoints = chartData[item.sensorName]?.[selectedFilter.toLowerCase()]?.length > 0 
      ? chartData[item.sensorName][selectedFilter.toLowerCase()] 
      : [];
    const chartLabels = chartPoints.map(point => point.x.toFixed(1));
    const chartValues = chartPoints.map(point => point.y);

    return (
      <SensorCard
        sensorName={item.sensorName}
        value={item.value}
        unit={item.unit}
        isExpanded={expandedSensor === item.sensorName}
        onToggle={() =>
          setExpandedSensor(
            expandedSensor === item.sensorName ? null : item.sensorName
          )
        }
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
                      selectedFilter === 'Daily' && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter('Daily')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === 'Daily' &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      Daily
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === 'Weekly' && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter('Weekly')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === 'Weekly' &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      Weekly
                    </Text>
                  </TouchableOpacity>
                </View>
    
                {/* 💡 Transformation ici */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.scrollViewContent}
                >
                  <LineChart
                    data={{
                      labels: chartPoints.map((p) => {
                        const date = new Date(p.x);
                        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                      }),
                      datasets: [
                        {
                          data: chartPoints.map((p) => p.y),
                        },
                      ],
                    }}
                    width={CHART_WIDTH}
                    height={250}
                    chartConfig={{
                      backgroundGradientFrom: '#FFFFFF',
                      backgroundGradientTo: '#FFFFFF',
                      decimalPlaces: 2,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        `rgba(0, 0, 0, ${opacity})`,
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
                    fromZero={true}
                  />
                </ScrollView>
    
                <Text style={styles.scrollHint}>
                  ← Scroll to view more data →
                </Text>
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
  chartContainer: {
    marginVertical: hp(2),
    maxHeight: 330, // Adjusted for filter buttons (50px) + chart (250px) + scroll hint + margins
  },
  scrollViewContent: {
    paddingRight: wp(10),
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
  scrollHint: {
    textAlign: 'center',
    color: '#757575',
    fontSize: wp(3.5),
    marginTop: hp(1),
    fontStyle: 'italic',
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
});

export default ReservoirPage;