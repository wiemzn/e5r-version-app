import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const DayForecast = ({ date, icon, temp_max, temp_min, description, onPress, data }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={styles.dayForecastContainer}
    activeOpacity={0.7}
  >
    <Animatable.View animation="fadeIn">
      <BlurView intensity={20} style={styles.dayForecastBlur}>
        <Text style={styles.dayText}>{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <MaterialCommunityIcons name={icon} size={30} color="white" />
        <Text style={styles.tempText}>{Math.round(temp_max)}°</Text>
        <Text style={styles.tempMinText}>{Math.round(temp_min)}°</Text>
        <Text style={styles.descriptionText}>{description}</Text>
      </BlurView>
    </Animatable.View>
  </TouchableOpacity>
);

const ForecastDetailModal = ({ isVisible, onClose, forecast }) => {
  if (!forecast) return null;

  const date = new Date(forecast.date);
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <BlurView intensity={50} style={styles.modalBlur}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons 
                  name={forecast.icon} 
                  size={80} 
                  color="white" 
                />
                <Text style={styles.modalDescription}>{forecast.description}</Text>
              </View>

              <View style={styles.modalDetailsGrid}>
                <View style={styles.modalDetailItem}>
                  <MaterialCommunityIcons name="thermometer" size={24} color="white" />
                  <Text style={styles.modalDetailLabel}>Max Temp</Text>
                  <Text style={styles.modalDetailValue}>{Math.round(forecast.temp_max)}°C</Text>
                </View>

                <View style={styles.modalDetailItem}>
                  <MaterialCommunityIcons name="thermometer-low" size={24} color="white" />
                  <Text style={styles.modalDetailLabel}>Min Temp</Text>
                  <Text style={styles.modalDetailValue}>{Math.round(forecast.temp_min)}°C</Text>
                </View>

                <View style={styles.modalDetailItem}>
                  <MaterialCommunityIcons name="water-percent" size={24} color="white" />
                  <Text style={styles.modalDetailLabel}>Humidity</Text>
                  <Text style={styles.modalDetailValue}>{forecast.humidity}%</Text>
                </View>

                <View style={styles.modalDetailItem}>
                  <MaterialCommunityIcons name="weather-windy" size={24} color="white" />
                  <Text style={styles.modalDetailLabel}>Wind Speed</Text>
                  <Text style={styles.modalDetailValue}>{forecast.wind_speed} m/s</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const city = 'Tunis';
  const API_KEY = '70c06b50d6eef7fa3273eb08098902b7';

  // Weather condition icons mapping with larger icons
  const weatherIcons = {
    '01d': 'weather-sunny',
    '01n': 'weather-night',
    '02d': 'weather-partly-cloudy',
    '02n': 'weather-night-partly-cloudy',
    '03d': 'weather-cloudy',
    '03n': 'weather-cloudy',
    '04d': 'weather-cloudy',
    '04n': 'weather-cloudy',
    '09d': 'weather-pouring',
    '09n': 'weather-pouring',
    '10d': 'weather-rainy',
    '10n': 'weather-rainy',
    '11d': 'weather-lightning',
    '11n': 'weather-lightning',
    '13d': 'weather-snowy',
    '13n': 'weather-snowy',
    '50d': 'weather-fog',
    '50n': 'weather-fog',
  };

  // Background gradients based on time of day
  const getBackgroundGradient = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) { // Morning
      return ['#87CEEB', '#4A90E2'];
    } else if (hour >= 12 && hour < 17) { // Afternoon
      return ['#4A90E2', '#1E90FF'];
    } else if (hour >= 17 && hour < 20) { // Evening
      return ['#FF7F50', '#4A90E2'];
    } else { // Night
      return ['#191970', '#000080'];
    }
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Fetch current weather
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        setWeather(weatherResponse.data);

        // Fetch 7-day forecast using coordinates from current weather
        const { lat, lon } = weatherResponse.data.coord;
        const forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        // Process forecast data to get daily forecasts
        const dailyForecasts = {};
        forecastResponse.data.list.forEach(item => {
          const date = new Date(item.dt * 1000).toLocaleDateString();
          if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
              date: item.dt * 1000,
              temp_max: item.main.temp_max,
              temp_min: item.main.temp_min,
              icon: item.weather[0].icon,
              description: item.weather[0].description,
              humidity: item.main.humidity,
              wind_speed: item.wind.speed,
              pressure: item.main.pressure
            };
          } else {
            dailyForecasts[date].temp_max = Math.max(dailyForecasts[date].temp_max, item.main.temp_max);
            dailyForecasts[date].temp_min = Math.min(dailyForecasts[date].temp_min, item.main.temp_min);
          }
        });
        
        setForecast(Object.entries(dailyForecasts).slice(0, 7));
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          })
        ]).start();
        
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={getBackgroundGradient()} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.loadingText}>
            Fetching weather data...
          </Animatable.Text>
        </LinearGradient>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.errorGradient}>
          <Animatable.View animation="bounce" iterationCount={1}>
            <MaterialCommunityIcons name="weather-cloudy-alert" size={80} color="#FFF" />
          </Animatable.View>
          <Text style={styles.errorText}>Unable to load weather data</Text>
          <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
        </LinearGradient>
      </View>
    );
  }

  const weatherIcon = weatherIcons[weather.weather[0].icon] || 'weather-cloudy';
  const currentTemp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView style={styles.scrollContainer}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={getBackgroundGradient()} style={styles.gradient}>
          <Animatable.View animation="fadeIn" duration={1500} style={styles.header}>
            <Text style={styles.location}>{weather.name}, {weather.sys.country}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={500} duration={1500} style={styles.mainContent}>
            <Animatable.View animation="pulse" iterationCount="infinite" duration={3000} style={styles.weatherIconContainer}>
              <MaterialCommunityIcons name={weatherIcon} size={150} color="white" style={styles.weatherIcon} />
              <Text style={styles.condition}>{weather.weather[0].description}</Text>
            </Animatable.View>

            <View style={styles.temperatureContainer}>
              <Text style={styles.temperature}>{currentTemp}°</Text>
              <Text style={styles.feelsLike}>Feels like {feelsLike}°</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={1000} duration={1500} style={styles.detailsContainer}>
            <BlurView intensity={30} style={styles.blurContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="water-percent" size={28} color="white" />
                  <Text style={styles.detailText}>{weather.main.humidity}%</Text>
                  <Text style={styles.detailLabel}>Humidity</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="weather-windy" size={28} color="white" />
                  <Text style={styles.detailText}>{weather.wind.speed} m/s</Text>
                  <Text style={styles.detailLabel}>Wind</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="gauge" size={28} color="white" />
                  <Text style={styles.detailText}>{weather.main.pressure}</Text>
                  <Text style={styles.detailLabel}>Pressure</Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, styles.lastRow]}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="weather-sunset-up" size={28} color="white" />
                  <Text style={styles.detailText}>{sunrise}</Text>
                  <Text style={styles.detailLabel}>Sunrise</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="weather-sunset-down" size={28} color="white" />
                  <Text style={styles.detailText}>{sunset}</Text>
                  <Text style={styles.detailLabel}>Sunset</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="eye-outline" size={28} color="white" />
                  <Text style={styles.detailText}>{weather.visibility / 1000}</Text>
                  <Text style={styles.detailLabel}>Visibility</Text>
                </View>
              </View>
            </BlurView>
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={1500} duration={1500} style={styles.forecastContainer}>
            <Text style={styles.forecastTitle}>7-Day Forecast</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastScroll}
            >
              {forecast?.map(([date, data]) => (
                <DayForecast
                  key={date}
                  date={data.date}
                  icon={weatherIcons[data.icon]}
                  temp_max={data.temp_max}
                  temp_min={data.temp_min}
                  description={data.description}
                  onPress={() => {
                    setSelectedForecast({
                      ...data,
                      icon: weatherIcons[data.icon]
                    });
                    setIsModalVisible(true);
                  }}
                  data={data}
                />
              ))}
            </ScrollView>
          </Animatable.View>
        </LinearGradient>
      </Animated.View>

      <ForecastDetailModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        forecast={selectedForecast}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 25,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 20,
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  location: {
    fontSize: 34,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  date: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '500',
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIcon: {
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  condition: {
    fontSize: 24,
    color: 'white',
    marginTop: 15,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  temperatureContainer: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 96,
    fontWeight: '200',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  feelsLike: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 'auto',
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  detailItem: {
    alignItems: 'center',
    width: (width - 100) / 3,
  },
  detailText: {
    fontSize: 20,
    color: 'white',
    marginTop: 8,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  forecastContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  forecastTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
  },
  forecastScroll: {
    paddingHorizontal: 10,
  },
  dayForecastContainer: {
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    width: 100,
  },
  dayForecastBlur: {
    padding: 15,
    alignItems: 'center',
    height: 160,
  },
  dayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tempText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  tempMinText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  descriptionText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalBlur: {
    padding: 20,
    backgroundColor: 'rgba(50,50,50,0.8)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDescription: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    textTransform: 'capitalize',
  },
  modalDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalDetailItem: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalDetailLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  modalDetailValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default Weather;