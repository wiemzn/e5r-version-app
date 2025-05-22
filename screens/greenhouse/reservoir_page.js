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
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width * 0.85; // 85% of screen width

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
    <Animatable.View animation="fadeInUp" duration={800}>
      <LinearGradient
        colors={switchValue ? ['#43A047', '#2E7D32'] : ['#FFFFFF', '#F5F7FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.actuatorCard, switchValue && styles.actuatorCardActive]}
      >
        <View style={styles.actuatorHeader}>
          <View style={[styles.iconContainer, switchValue && styles.iconContainerActive]}>
            <Icon 
              name={getIcon(actuatorName)} 
              size={wp(6)} 
              color={switchValue ? '#FFFFFF' : '#388E3C'} 
            />
          </View>
          <Text style={[styles.actuatorTitle, switchValue && styles.actuatorTitleActive]}>
            {actuatorName.replace('_', ' ')}
          </Text>
        </View>
        <View style={styles.actuatorContent}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, switchValue && styles.statusLabelActive]}>Status</Text>
            <Text style={[styles.actuatorStatus, switchValue && styles.actuatorStatusActive]}>
              {switchValue ? 'ON' : 'OFF'} {unit}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, switchValue && styles.toggleButtonActive]}
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
    </Animatable.View>
  );
};

const ReservoirPage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [actuatorStates, setActuatorStates] = useState({
    water_pump: false,
    ventilation: false,
    led: false,
  });
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const [rawChartData, setRawChartData] = useState({}); // Store unfiltered data
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('day'); // Changed to match GoogleSheetsService
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/11992784/greenhouse');

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
        setRawChartData(data || {});
        // Apply initial filter
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

  const toggleActuator = async (actuatorName, value) => {
    try {
      await set(ref(database, `users/11992784/greenhouse/${actuatorName}`), value ? 'ON' : 'OFF');
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

    const chartPoints = chartData[item.sensorName]?.length > 0 
      ? chartData[item.sensorName] 
      : [];

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
                    height={250}
                    yAxisInterval={1}
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
                    style={[styles.chart, { paddingRight: 0 }]}
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
          <Icon name="water-drop" size={wp(6)} color="#FFFFFF" style={styles.titleIcon} />
          <Text style={styles.appBarTitle}>Reservoir</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      {Object.keys(sensorData).length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#388E3C" />
          <Text style={styles.loaderText}>Loading reservoir data...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.sensorName}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: hp(2),
    color: '#388E3C',
    fontSize: wp(4),
    fontWeight: '500',
  },
  actuatorCard: {
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
  actuatorCardActive: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actuatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  iconContainer: {
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
    padding: wp(3),
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actuatorTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#1B5E20',
  },
  actuatorTitleActive: {
    color: '#FFFFFF',
  },
  actuatorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: wp(3.5),
    color: '#757575',
    marginBottom: hp(0.5),
  },
  statusLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  actuatorStatus: {
    fontSize: wp(4),
    color: '#424242',
    fontWeight: '500',
  },
  actuatorStatusActive: {
    color: '#FFFFFF',
  },
  toggleButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(3),
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  toggleButtonText: {
    color: '#424242',
    fontSize: wp(3.8),
    fontWeight: '600',
  },
  chartContainer: {
    marginVertical: hp(2),
    maxHeight: 350, // Adjusted for filter buttons (50px) + chart (250px) + margins
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
});

export default ReservoirPage;