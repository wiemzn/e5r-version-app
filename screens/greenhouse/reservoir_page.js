import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
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
import { LineChart } from 'react-native-chart-kit';
import SensorCard from './SensorCard';
import GoogleSheetsService from '../../googlesheetservice';
import { useNavigation } from '@react-navigation/native';
import AppBackground from '../AppBackground';

const { width } = Dimensions.get('window');
const CHART_WIDTH = wp(90);

const ReservoirPage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [expandedSensor, setExpandedSensor] = useState(null);
  const [chartData, setChartData] = useState({});
  const [rawChartData, setRawChartData] = useState({});
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('day');
  const [uid, setUid] = useState(null);

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
  }, [uid]);

  useEffect(() => {
    if (Object.keys(rawChartData).length > 0) {
      const filteredData = GoogleSheetsService.filterDataByRange(rawChartData, selectedFilter);
      setChartData(filteredData || {});
    }
  }, [selectedFilter, rawChartData]);

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

  const renderItem = ({ item }) => {
    const chartPoints = chartData[item.sensorName]?.length > 0 ? chartData[item.sensorName] : [];

    return (
      <SensorCard
        sensorName={item.sensorName}
        value={item.value}
        unit={item.unit}
        isExpanded={expandedSensor === item.sensorName}
        onToggle={() =>
          setExpandedSensor(expandedSensor === item.sensorName ? null : item.sensorName)
        }
        chart={
          expandedSensor === item.sensorName ? (
            isChartLoading ? (
              <ActivityIndicator size="small" color="#2E7D32" style={styles.chartLoader} />
            ) : chartPoints.length > 0 ? (
              <View style={styles.chartContainer}>
                <View style={styles.filterButtons}>
                  {['day', 'week', 'month'].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterButton,
                        selectedFilter === filter && styles.filterButtonActive,
                      ]}
                      onPress={() => setSelectedFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          selectedFilter === filter && styles.filterButtonTextActive,
                        ]}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                      datasets: [{ data: chartPoints.map((p) => p.y) }],
                    }}
                    width={CHART_WIDTH}
                    height={hp(30)}
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundGradientFrom: '#FFFFFF',
                      backgroundGradientTo: '#FFFFFF',
                      decimalPlaces: 2,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: wp(3) },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#2E7D32',
                      },
                    }}
                    bezier
                    style={styles.chart}
                    fromZero
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
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.sensorName}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-back" size={wp(6)} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.title}>Reservoir</Text>
            </>
          }
          showsVerticalScrollIndicator={false}
        />
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
  backButton: {
    position: 'absolute',
    top: hp(2),
    left: wp(4),
    zIndex: 1,
  },
  title: {
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp(2),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  chartContainer: {
    marginTop: hp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(3),
    padding: wp(4),
  },
  chartWrapper: {
    marginTop: hp(1),
  },
  chart: {
    marginVertical: hp(1),
    borderRadius: wp(3),
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1),
  },
  filterButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: '#C8E6C9',
    borderRadius: wp(2),
  },
  filterButtonActive: {
    backgroundColor: '#1B5E20',
  },
  filterButtonText: {
    fontSize: wp(3.5),
    color: '#2E7D32',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  placeholderText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginTop: hp(1),
  },
});

export default ReservoirPage;