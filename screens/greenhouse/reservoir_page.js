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
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Ajout de l'importation
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LineChart } from 'react-native-chart-kit';
import SensorCard from './SensorCard';
import GoogleSheetsService from '../../googlesheetservice';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width * 0.85;

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

  // Récupérer l'UID de l'utilisateur connecté
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
        console.log('ReservoirPage Firebase data:', data); // Debug
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
      default:
        return '';
    }
  };

  const data = Object.entries(sensorData)
    .filter(([key]) => ['ph', 'water_level'].includes(key))
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
              <ActivityIndicator size="small" color="#388E3C" style={styles.chartLoader} />
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
                    height={250}
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#E1F5FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
  chartLoader: {
    marginVertical: hp(2),
  },
  chartContainer: {
    marginTop: hp(2),
  },
  chartWrapper: {
    marginTop: hp(1),
  },
  chart: {
    marginVertical: 8,
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
    backgroundColor: '#388E3C',
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