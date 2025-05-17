import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ImageBackground,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  const city = 'Tunis';
  const API_KEY = '70c06b50d6eef7fa3273eb08098902b7';

  // Weather condition icons mapping
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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        setWeather(response.data);
        
        // Start animations when data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
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

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Fetching weather data...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="weather-cloudy-alert" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>Unable to load weather data</Text>
        <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
      </View>
    );
  }

  const weatherIcon = weatherIcons[weather.weather[0].icon] || 'weather-cloudy';
  const currentTemp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#4A90E2', '#6BB9F0']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.location}>{weather.name}, {weather.sys.country}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          style={styles.weatherIconContainer}
        >
          <MaterialCommunityIcons 
            name={weatherIcon} 
            size={100} 
            color="white" 
          />
          <Text style={styles.condition}>{weather.weather[0].description}</Text>
        </Animatable.View>

        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>{currentTemp}°</Text>
          <Text style={styles.feelsLike}>Feels like {feelsLike}°</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="water-percent" size={24} color="white" />
              <Text style={styles.detailText}>{weather.main.humidity}%</Text>
              <Text style={styles.detailLabel}>Humidity</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="weather-windy" size={24} color="white" />
              <Text style={styles.detailText}>{weather.wind.speed} m/s</Text>
              <Text style={styles.detailLabel}>Wind</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="gauge" size={24} color="white" />
              <Text style={styles.detailText}>{weather.main.pressure} hPa</Text>
              <Text style={styles.detailLabel}>Pressure</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="weather-sunset-up" size={24} color="white" />
              <Text style={styles.detailText}>{sunrise}</Text>
              <Text style={styles.detailLabel}>Sunrise</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="weather-sunset-down" size={24} color="white" />
              <Text style={styles.detailText}>{sunset}</Text>
              <Text style={styles.detailLabel}>Sunset</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="eye-outline" size={24} color="white" />
              <Text style={styles.detailText}>{weather.visibility / 1000} km</Text>
              <Text style={styles.detailLabel}>Visibility</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    padding: 25,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4A90E2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    color: '#FF6B6B',
    marginTop: 20,
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  location: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  condition: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
    textTransform: 'capitalize',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  temperature: {
    fontSize: 72,
    fontWeight: '200',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  feelsLike: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
    width: (width - 100) / 3,
  },
  detailText: {
    fontSize: 18,
    color: 'white',
    marginTop: 5,
    fontWeight: 'bold',
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textTransform: 'uppercase',
  },
});

export default Weather;