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

const CHART_WIDTH = wp(72); // Responsive width (72% of screen)
const CHART_HEIGHT = hp(30); // Responsive height

const METRICS = [
  { 
    id: 'daily_production', 
    name: 'Daily Production', 
    unit: 'kWh', 
    color: '#2E7D32',
    icon: 'wb-sunny',
    gradientColors: ['#E8F5E9', '#C8E6C9'],
  },
];

const GreenEnergyCharts = () => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('day');

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const data = await GoogleSheetsService.fetchChartData();
      console.log('Fetched chart data:', JSON.stringify(data));
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
    setChartData(prevData => ({ ...prevData }));
  }, [selectedRange]);

  const formatData = (metricId) => {
    if (!chartData) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    const filteredData = GoogleSheetsService.filterDataByRange(chartData, selectedRange);
    const metricData = filteredData?.[metricId] || [];

    const labels = metricData.map(point => point.originalTime);
    const dataPoints = metricData.map(point => parseFloat(point.y) || 0);

    return {
      labels,
      datasets: [{
        data: dataPoints,
        color: (opacity = 1) => `${METRICS.find(m => m.id === metricId).color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        strokeWidth: 2,
      }],
    };
  };

  const renderChart = (metric) => {
    const data = formatData(metric.id);

    return (
      <View key={metric.id} style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: metric.gradientColors[1] }]}>
              <Icon name={metric.icon} size={wp(6)} color={metric.color} />
            </View>
            <Text style={styles.chartTitle}>{metric.name}</Text>
          </View>
          <Text style={[styles.currentValue, { color: metric.color }]}>
            {chartData?.[metric.id]?.[chartData[metric.id].length - 1]?.y?.toString() || 'N/A'}{' '}
            <Text style={styles.unit}>{metric.unit}</Text>
          </Text>
        </View>
        {data.datasets[0].data.length > 0 ? (
          <>
            <View style={[styles.chartBackground, { backgroundColor: metric.gradientColors[0] }]}>
              <LineChart
                data={data}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: metric.gradientColors[0],
                  backgroundGradientTo: metric.gradientColors[1],
                  decimalPlaces: 1,
                  color: (opacity = 1) => `${metric.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
                  style: {
                    borderRadius: wp(3),
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: metric.color,
                  },
                  propsForLabels: {
                    fontSize: wp(2.5),
                    fontWeight: '500',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: [5, 5],
                    stroke: `${metric.color}20`,
                  },
                }}
                bezier
                style={styles.chart}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withInnerLines={true}
                withOuterLines={false}
                fromZero={false}
                yAxisLabel=""
                yAxisSuffix={metric.unit}
                formatXLabel={(value) => {
                  if (selectedRange === 'day') {
                    return value.slice(-5);
                  }
                  return value.slice(0, 5);
                }}
              />
            </View>
            <Text style={styles.chartLabel}>
              {selectedRange === 'day' ? 'Time (HH:MM)' : 'Date (DD/MM)'}
            </Text>
          </>
        ) : (
          <View style={[styles.noDataContainer, { backgroundColor: metric.gradientColors[0] }]}>
            <Icon name="error-outline" size={wp(12)} color={`${metric.color}80`} />
            <Text style={[styles.noDataText, { color: metric.color }]}>
              No {metric.name.toLowerCase()} data available
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
          <Text numberOfLines={1} style={styles.title}>Energy Production Chart</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadChartData}
            activeOpacity={0.7}
          >
            <Icon 
              name="refresh" 
              size={wp(5)} 
              color="#2E7D32" 
            />
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
              size={wp(4)} 
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
              size={wp(4)} 
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
        METRICS.map(metric => renderChart(metric))
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
    paddingBottom: hp(4),
  },
  header: {
    marginBottom: hp(3),
    zIndex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    flex: 1,
    marginRight: wp(2),
  },
  refreshButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: wp(5),
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: wp(3),
    padding: wp(1),
  },
  periodButton: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: wp(2),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2E7D32',
  },
  periodButtonText: {
    fontSize: wp(3.8),
    color: '#2E7D32',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  periodIcon: {
    marginRight: wp(1.5),
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
    alignItems: 'center',
  },
  chart: {
    borderRadius: wp(3),
  },
  loaderContainer: {
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: hp(2),
  },
  loaderText: {
    color: '#666666',
    fontSize: wp(4),
  },
  noDataContainer: {
    height: CHART_HEIGHT,
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

export default GreenEnergyCharts;