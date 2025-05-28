import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CircularProgress from 'react-native-circular-progress-indicator';
import AppBackground from '../AppBackground';

const GreenhousePage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [uid, setUid] = useState(null);

  const database = getDatabase(app);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        console.warn('Utilisateur non connecté.');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const databaseRef = ref(database, `users/${uid}/greenhouse`);

    const unsubscribe = onValue(
      databaseRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        console.log('Firebase data:', data);
        setSensorData(data);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      },
      (error) => {
        console.error('Firebase error:', error);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const pH = typeof sensorData.ph === 'number' ? sensorData.ph : 7.0;
  const temperature = typeof sensorData.temperature === 'number' ? sensorData.temperature : 0;
  const humidity = typeof sensorData.humidity === 'number' ? sensorData.humidity : 0;

  const isSystemSafe = pH >= 6.5 && pH <= 7.5 && temperature >= 15 && temperature <= 30 && humidity >= 40 && humidity <= 80;

  const renderSensorRow = (icon, label, value, unit = '', criticalCondition = false) => {
    const safeValue = value != null && typeof value !== 'object' ? value.toString() : '--';
    const isCritical = criticalCondition;

    return (
      <Animated.View
        style={[
          styles.sensorRow,
          { opacity: fadeAnim },
          isCritical && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View
          style={[
            styles.sensorIconContainer,
            isCritical && styles.criticalIconContainer,
          ]}
        >
          <Icon name={icon} size={wp(6)} color={isCritical ? '#FFFFFF' : '#E0E0E0'} />
        </View>
        <Text style={styles.sensorLabel}>{label}</Text>
        <View style={styles.sensorValueContainer}>
          <Text
            style={[styles.sensorValue, isCritical && styles.criticalValue]}
          >
            {safeValue}
            {unit}
          </Text>
          {isCritical && (
            <Icon
              name="warning"
              size={wp(4)}
              color="#FFCA28"
              style={styles.warningIcon}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderNavigationBox = ({ title, icon, onPress, colors, description }) => (
    <TouchableOpacity
      onPress={() => {
        console.log(`Navigating to ${title}`);
        try {
          onPress();
        } catch (error) {
          console.error(`Navigation error to ${title}:`, error);
        }
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navigationBox}
      >
        <View style={styles.navIconContainer}>
          <Icon name={icon} size={wp(8)} color="#FFFFFF" />
        </View>
        <View style={styles.navTextContainer}>
          <Text style={styles.navigationText}>{title}</Text>
          <Text style={styles.navigationDescription}>{description}</Text>
        </View>
        <Icon
          name="chevron-right"
          size={wp(6)}
          color="#FFFFFF"
          style={styles.chevronIcon}
        />
      </LinearGradient>
    </TouchableOpacity>
  );

  const getSystemStatusMessage = () => {
    if (pH < 6.5) return 'pH too low! Add nutrients';
    if (pH > 7.5) return 'pH too high! Add pH down';
    if (temperature < 15) return 'Temperature too low!';
    if (temperature > 30) return 'Temperature too high!';
    if (humidity < 40) return 'Humidity too low!';
    if (humidity > 80) return 'Humidity too high!';
    return 'All systems optimal';
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={wp(6)} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Greenhouse</Text>
          <LinearGradient
            colors={isSystemSafe ? ['#A5D6A7', '#66BB6A'] : ['#EF9A9A', '#F44336']}
            style={styles.statusCard}
          >
            <View style={styles.statusGradient}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIconContainer}>
                  <Icon
                    name={isSystemSafe ? 'check-circle' : 'warning'}
                    size={wp(8)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>System Status</Text>
                  <Text style={[styles.statusMessage, !isSystemSafe && styles.warningMessage]}>
                    {getSystemStatusMessage()}
                  </Text>
                </View>
              </View>
              <View style={styles.sensorGrid}>
                <View style={styles.sensorColumn}>
                  {renderSensorRow(
                    'analytics',
                    'pH',
                    pH,
                    '',
                    pH < 6.5 || pH > 7.5
                  )}
                  {renderSensorRow(
                    'thermostat',
                    'Temperature',
                    temperature,
                    '°C',
                    temperature < 15 || temperature > 30
                  )}
                </View>
                <View style={styles.sensorColumn}>
                  {renderSensorRow(
                    'water-drop',
                    'Humidity',
                    humidity,
                    '%',
                    humidity < 40 || humidity > 80
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
          {renderNavigationBox({
            title: 'Environment',
            icon: 'thermostat',
            onPress: () => navigation.navigate('EnvironmentPage'),
            colors: ['#A5D6A7', '#66BB6A'],
            description: 'Monitor temperature and humidity',
          })}
          {renderNavigationBox({
            title: 'Reservoir',
            icon: 'water-drop',
            onPress: () => navigation.navigate('ReservoirPage'),
            colors: ['#81D4FA', '#42A5F5'],
            description: 'Check water level, pH and EC',
          })}
          {renderNavigationBox({
            title: 'Controls',
            icon: 'tune',
            onPress: () => navigation.navigate('Controls'),
            colors: ['#FFE082', '#FFB300'],
            description: 'Manage system actuators',
          })}
          <Text style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </ScrollView>
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
    paddingBottom: hp(5),
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
  statusCard: {
    width: '100%',
    marginBottom: hp(2),
    borderRadius: wp(4),
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  statusGradient: {
    padding: wp(5),
    borderRadius: wp(4),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  statusIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    marginLeft: wp(4),
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: wp(5.5),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  statusMessage: {
    color: '#FFFFFF',
    fontSize: wp(4),
    fontWeight: '500',
  },
  warningMessage: {
    color: '#FFCA28',
  },
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
  },
  sensorColumn: {
    width: '48%',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: wp(3),
    marginBottom: hp(1),
  },
  sensorIconContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalIconContainer: {
    backgroundColor: '#F44336',
  },
  sensorLabel: {
    color: '#FFFFFF',
    fontSize: wp(4),
    fontWeight: '500',
    marginLeft: wp(3),
    flex: 1,
  },
  sensorValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorValue: {
    color: '#FFFFFF',
    fontSize: wp(4.2),
    fontWeight: 'bold',
    minWidth: wp(10),
    textAlign: 'right',
  },
  criticalValue: {
    color: '#FFCA28',
  },
  warningIcon: {
    marginLeft: wp(1),
  },
  navigationBox: {
    width: '100%',
    padding: wp(4),
    borderRadius: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      web: {
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  navIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  navTextContainer: {
    flex: 1,
  },
  navigationText: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: '600',
  },
  navigationDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: wp(3.5),
    marginTop: hp(0.5),
  },
  chevronIcon: {
    opacity: 0.8,
  },
  lastUpdated: {
    color: '#757575',
    fontSize: wp(3.5),
    textAlign: 'center',
    marginBottom: hp(2),
    fontStyle: 'italic',
  },
});

export default GreenhousePage;