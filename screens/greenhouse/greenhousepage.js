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

const GreenhousePage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [uid, setUid] = useState(null);

  const database = getDatabase(app);

  // 🔐 Récupérer l'UID de l'utilisateur connecté
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

  // 🔁 Écouter les données une fois l’UID disponible
  useEffect(() => {
    if (!uid) return;
    const databaseRef = ref(database, `users/${uid}/greenhouse`);

    const unsubscribe = onValue(
      databaseRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        console.log('Firebase data:', data); // Debug log to verify data structure
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

  // Ensure safe access to sensor data with fallback values
  const pH = typeof sensorData.ph === 'number' ? sensorData.ph : 7.0;
  const temperature = typeof sensorData.temperature === 'number' ? sensorData.temperature : 0;
  const humidity = typeof sensorData.humidity === 'number' ? sensorData.humidity : 0;

  const isSystemSafe = pH >= 6.5 && pH <= 7.5;
  const isTempCritical = temperature < 15 || temperature > 30;
  const isHumidityCritical = humidity < 40 || humidity > 80;

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
              color="#FF5252"
              style={styles.warningIcon}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderNavigationBox = ({ title, icon, onPress, color, description }) => (
    <TouchableOpacity
      onPress={() => {
        console.log(`Navigating to ${title}`); // Log pour déboguer les clics
        try {
          onPress();
        } catch (error) {
          console.error(`Navigation error to ${title}:`, error); // Capture des erreurs de navigation
        }
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color, `${color}DD`]}
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
    <LinearGradient colors={['#f5f7fa', '#e4f5e8']} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.appBar}
        >
          <View style={styles.appBarGradient}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <View style={styles.iconBackground}>
                <Icon name="arrow-back" size={wp(6)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Icon
                name="local-florist"
                size={wp(6)}
                color="#FFFFFF"
                style={styles.titleIcon}
              />
              <Text style={styles.appBarTitle}>Greenhouse</Text>
            </View>
           
          </View>
        </LinearGradient>
        <ScrollView style={styles.content}>
          <LinearGradient
            colors={isSystemSafe ? ['#4CAF50', '#2E7D32'] : ['#FF5252', '#B71C1C']}
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
                  <Text style={styles.statusMessage}>
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
                    isTempCritical
                  )}
                </View>
                <View style={styles.sensorColumn}>
                  {renderSensorRow(
                    'water-drop',
                    'Humidity',
                    humidity,
                    '%',
                    isHumidityCritical
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
          {renderNavigationBox({
            title: 'Environment',
            icon: 'thermostat',
            onPress: () => navigation.navigate('EnvironmentPage'), // Corrigé
            color: '#4CAF50',
            description: 'Monitor temperature and humidity',
          })}
          {renderNavigationBox({
            title: 'Reservoir',
            icon: 'water-drop',
            onPress: () => navigation.navigate('ReservoirPage'), // Corrigé
            color: '#2196F3',
            description: 'Check water level and pH',
          })}
          {renderNavigationBox({
            title: 'Controls',
            icon: 'tune',
            onPress: () => navigation.navigate('Controls'),
            color: '#FF9800',
            description: 'Manage system actuators',
          })}
          <Text style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  appBar: {
    overflow: 'hidden',
    borderBottomLeftRadius: wp(5),
    borderBottomRightRadius: wp(5),
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  appBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  iconBackground: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: wp(5),
    padding: wp(2),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    marginRight: wp(2),
  },
  menuButton: {
    marginLeft: wp(2),
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    marginRight: wp(2),
  },
  appBarTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: wp(4),
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
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: wp(4),
    fontWeight: '500',
  },
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
  },
  sensorColumn: {
    width: '48%',
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: wp(10),
    padding: wp(2),
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
    backgroundColor: '#FF5252',
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
    color: '#FFEB3B',
    fontWeight: '800',
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