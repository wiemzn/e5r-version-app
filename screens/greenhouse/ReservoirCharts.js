import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import GoogleSheetsService from '../../googlesheetservice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CHART_WIDTH = wp(72);

const SENSORS = [
  {
    id: 'ph',
    name: 'pH Readings',
    unit: '',
    color: '#2E7D32',
    icon: 'science',
    gradientColors: ['#E8F5E9', '#C8E6C9'],
  },
  {
    id: 'ec',
    name: 'EC Readings',
    unit: 'mS/cm',
    color: '#1976D2',
    icon: 'bolt',
    gradientColors: ['#E3F2FD', '#BBDEFB'],
  },
  {
    id: 'water_level',
    name: 'Water Level',
    unit: '%',
    color: '#7B1FA2',
    icon: 'opacity',
    gradientColors: ['#F3E5F5', '#E1BEE7'],
  },
];

const ReservoirCharts = () => {
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
    setChartData(prev => ({ ...prev }));
  }, [selectedRange]);

  const formatData = (sensorId) => {
    if (!chartData) return { labels: [], datasets: [{ data: [] }] };
    const filteredData = GoogleSheetsService.filterDataByRange(chartData, selectedRange);
    const sensorData = filteredData?.[sensorId] || [];
    const labels = sensorData.map(p => p.originalTime);
    const dataPoints = sensorData.map(p => parseFloat(p.y) || 0);
    return {
      labels,
      datasets: [{
        data: dataPoints,
        color: (opacity = 1) =>
          `${SENSORS.find(s => s.id === sensorId).color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        strokeWidth: 2,
      }],
    };
  };

  const renderChart = (sensor) => {
    const data = formatData(sensor.id);
    const currentValue = chartData?.[sensor.id]?.[chartData[sensor.id].length - 1]?.y?.toString() || 'N/A';

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
            {currentValue} <Text style={styles.unit}>{sensor.unit}</Text>
          </Text>
        </View>

        {data.datasets[0].data.length > 0 ? (
          <>
            <View style={[styles.chartBackground, { backgroundColor: sensor.gradientColors[0] }]}>
              <LineChart
                data={data}
                width={CHART_WIDTH}
                height={hp(30)}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: sensor.gradientColors[0],
                  backgroundGradientTo: sensor.gradientColors[1],
                  decimalPlaces: sensor.id === 'water_level' ? 0 : 1,
                  color: (opacity = 1) =>
                    `${sensor.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
                  style: { borderRadius: wp(3) },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: sensor.color,
                  },
                  propsForLabels: {
                    fontSize: wp(2.5),
                  },
                }}
                bezier
                style={styles.chart}
                withVerticalLabels
                withHorizontalLabels
                fromZero={sensor.id === 'water_level'}
                yAxisLabel=""
                yAxisSuffix={sensor.unit}
              />
            </View>
            <Text style={styles.chartLabel}>
              {selectedRange === 'day' ? 'Time (HH:MM)' : 'Date (DD/MM)'}
            </Text>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No {sensor.name.toLowerCase()} available</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reservoir Charts</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadChartData}>
            <Icon name="refresh" size={wp(6)} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        <View style={styles.periodSelector}>
          {['day', 'week'].map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedRange === period && styles.periodButtonActive]}
              onPress={() => setSelectedRange(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedRange === period && styles.periodButtonTextActive
              ]}>
                {period === 'day' ? 'Today' : 'Week'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      ) : (
        SENSORS.map(sensor => renderChart(sensor))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' }, // Changed to transparent
  contentContainer: { padding: wp(4), paddingBottom: hp(4), backgroundColor: 'transparent' }, // Changed to transparent
  header: { marginBottom: hp(3) },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(7),
    fontWeight: '600',
    color: '#000',
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
    marginBottom: hp(3),
    alignItems: 'center',
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
    width: '100%',
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
    color: '#000',
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  chart: {
    borderRadius: wp(3),
  },
  chartLabel: {
    textAlign: 'center',
    color: '#666',
    fontSize: wp(3),
    marginTop: hp(1),
  },
  noDataContainer: {
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: wp(4),
    color: '#666',
    fontStyle: 'italic',
  },
  loader: {
    height: hp(30),
    justifyContent: 'center',
  },
});

export default ReservoirCharts;