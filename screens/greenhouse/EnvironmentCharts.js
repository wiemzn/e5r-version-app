import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import GoogleSheetsService from '../../googlesheetservice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const CHART_WIDTH = wp(90);

const SENSORS = [
  { 
    id: 'temperature', 
    name: 'Temperature', 
    unit: '°C', 
    color: '#E53935',
    icon: 'thermostat',
    gradientColors: ['#FFEBEE', '#FFCDD2'],
  },
  { 
    id: 'humidity', 
    name: 'Humidity', 
    unit: '%', 
    color: '#1E88E5',
    icon: 'water-drop',
    gradientColors: ['#E3F2FD', '#BBDEFB'],
  },
  { 
    id: 'light', 
    name: 'Light Intensity', 
    unit: 'lux', 
    color: '#FFA000',
    icon: 'wb-sunny',
    gradientColors: ['#FFF8E1', '#FFE082'],
  },
];

const EnvironmentCharts = () => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('day');

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const data = await GoogleSheetsService.fetchChartData();
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, []);

  useEffect(() => {
    console.log('Range changed to:', selectedRange);
    setChartData(prevData => ({...prevData}));
  }, [selectedRange]);

  const formatData = (sensorId) => {
    if (!chartData) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }

    const filteredData = GoogleSheetsService.filterDataByRange(chartData, selectedRange);
    const sensorData = filteredData?.[sensorId] || [];

    if (sensorData.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }

    const labels = sensorData.map(point => point.originalTime);
    const dataPoints = sensorData.map(point => point.y);

    return {
      labels,
      datasets: [{
        data: dataPoints,
        color: (opacity = 1) => `${SENSORS.find(s => s.id === sensorId).color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        strokeWidth: 2
      }]
    };
  };

  const renderChart = (sensor) => {
    const data = formatData(sensor.id);
    
    return (
      <View key={sensor.id} style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: sensor.gradientColors[1] }]}>
              <Icon name={sensor.icon} size={wp(6)} color={sensor.color} />
            </View>
            <Text style={styles.chartTitle}>{sensor.name}</Text>
          </View>
          <Text style={[styles.currentValue, { color: sensor.color }]}>
            {sensorData?.[sensor.id]?.toString() || 'N/A'}{' '}
            <Text style={styles.unit}>{sensor.unit}</Text>
          </Text>
        </View>
        {data.datasets[0].data.length > 0 ? (
          <>
            <View style={[styles.chartBackground, { backgroundColor: sensor.gradientColors[0] }]}>
              <LineChart
                data={data}
                width={CHART_WIDTH}
                height={hp(25)}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: sensor.id === 'light' ? 0 : 1,
                  color: (opacity = 1) => `${sensor.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
                  style: {
                    borderRadius: wp(3),
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: sensor.color,
                  },
                  propsForLabels: {
                    fontSize: wp(2.5),
                    fontWeight: '500',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: `${sensor.color}20`,
                  }
                }}
                bezier
                style={styles.chart}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withInnerLines={true}
                withOuterLines={false}
                fromZero={false}
                yAxisLabel=""
                yAxisSuffix={sensor.unit}
              />
            </View>
            <Text style={styles.chartLabel}>
              {selectedRange === 'day' ? 'Time (HH:MM)' : 'Date (DD/MM)'}
            </Text>
          </>
        ) : (
          <View style={[styles.noDataContainer, { backgroundColor: sensor.gradientColors[0] }]}>
            <Icon name="error-outline" size={wp(12)} color={`${sensor.color}80`} />
            <Text style={[styles.noDataText, { color: sensor.color }]}>
              No {sensor.name.toLowerCase()} data available
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Environment Charts</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadChartData}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={wp(6)} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedRange === 'day' && styles.periodButtonActive]}
            onPress={() => setSelectedRange('day')}
            activeOpacity={0.7}
          >
            <Icon 
              name="today" 
              size={wp(5)} 
              color={selectedRange === 'day' ? '#FFFFFF' : '#2E7D32'} 
              style={styles.periodIcon}
            />
            <Text style={[styles.periodButtonText, selectedRange === 'day' && styles.periodButtonTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedRange === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedRange('week')}
            activeOpacity={0.7}
          >
            <Icon 
              name="date-range" 
              size={wp(5)} 
              color={selectedRange === 'week' ? '#FFFFFF' : '#2E7D32'} 
              style={styles.periodIcon}
            />
            <Text style={[styles.periodButtonText, selectedRange === 'week' && styles.periodButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
          <Text style={styles.loaderText}>Loading chart data...</Text>
        </View>
      ) : (
        SENSORS.map(sensor => renderChart(sensor))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: wp(4),
  },
  header: {
    marginBottom: hp(3),
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  refreshButton: {
    padding: wp(2),
    backgroundColor: '#E8F5E9',
    borderRadius: wp(6),
    width: wp(12),
    height: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: wp(3),
    padding: wp(1),
  },
  periodButton: {
    flex: 1,
    paddingVertical: hp(1.2),
    alignItems: 'center',
    borderRadius: wp(2),
  },
  periodButtonActive: {
    backgroundColor: '#2E7D32',
  },
  periodButtonText: {
    fontSize: wp(4),
    color: '#2E7D32',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: wp(2),
    borderRadius: wp(3),
    marginRight: wp(2),
  },
  chartTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#000000',
  },
  currentValue: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  unit: {
    fontSize: wp(3.5),
    fontWeight: 'normal',
  },
  chartBackground: {
    borderRadius: wp(3),
    padding: wp(3),
    marginBottom: hp(1),
  },
  periodIcon: {
    marginRight: wp(2),
  },
  loaderContainer: {
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    height: hp(30),
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: hp(2),
    color: '#666666',
    fontSize: wp(4),
  },
  noDataContainer: {
    height: hp(25),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  noDataText: {
    fontSize: wp(4),
    marginTop: hp(1),
    fontStyle: 'italic',
  },
  chartLabel: {
    textAlign: 'center',
    color: '#666666',
    fontSize: wp(3),
    marginTop: hp(1),
  },
});

export default EnvironmentCharts; 