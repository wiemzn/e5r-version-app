import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CircularProgress from 'react-native-circular-progress-indicator';
import { ScrollView } from 'react-native';

const GreenhousePage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const database = getDatabase(app);
  const databaseRef = ref(database, 'users/11992784/greenhouse');

  // Animation for critical values
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(databaseRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);
      // Fade animation when data updates
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, (error) => {
      console.error('Firebase error:', error);
    });
    return () => unsubscribe();
  }, []);

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
      <Animated.View style={[
        styles.sensorRow,
        { opacity: fadeAnim },
        isCritical && { transform: [{ scale: pulseAnim }] }
      ]}>
        <View style={[
          styles.sensorIconContainer,
          isCritical && styles.criticalIconContainer
        ]}>
          <Icon name={icon} size={wp(6)} color={isCritical ? '#FFFFFF' : '#E0E0E0'} />
        </View>
        <Text style={styles.sensorLabel}>{label}</Text>
        <View style={styles.sensorValueContainer}>
          <Text style={[
            styles.sensorValue,
            isCritical && styles.criticalValue
          ]}>
            {safeValue}{unit}
          </Text>
          {isCritical && (
            <Icon name="warning" size={wp(4)} color="#FF5252" style={styles.warningIcon} />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderNavigationBox = ({ title, icon, onPress, color, description }) => (
    <TouchableOpacity 
      onPress={onPress}
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
        <Icon name="chevron-right" size={wp(6)} color="#FFFFFF" style={styles.chevronIcon} />
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
    <LinearGradient
      colors={['#f5f7fa', '#e4f5e8']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.appBar}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appBarGradient}
          >
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <View style={styles.iconBackground}>
                <Icon name="arrow-back" size={wp(5.5)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Icon name="eco" size={wp(5)} color="#FFFFFF" style={styles.titleIcon} />
              <Text style={styles.appBarTitle}>Greenhouse Monitor</Text>
            </View>

            <TouchableOpacity style={styles.menuButton}>
              <View style={styles.iconBackground}>
                <Icon name="more-vert" size={wp(5.5)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>
  
        <ScrollView style={styles.content}>
          {/* Status Card */}
          <Animated.View style={[styles.statusCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={isSystemSafe ? ['#4CAF50', '#2E7D32'] : ['#FF5252', '#D32F2F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusGradient}
            >
              <View style={styles.statusHeader}>
                <View style={styles.statusIconContainer}>
                  <Icon
                    name={isSystemSafe ? 'check-circle' : 'error'}
                    size={wp(10)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>System Status</Text>
                  <Text style={styles.statusMessage}>{getSystemStatusMessage()}</Text>
                </View>
              </View>
  
              <View style={styles.sensorGrid}>
                <View style={styles.sensorColumn}>
                  <View style={styles.gaugeContainer}>
                    <CircularProgress
                      value={humidity}
                      radius={wp(12)}
                      duration={1000}
                      progressValueColor="#FFFFFF"
                      activeStrokeColor="#FFFFFF"
                      inActiveStrokeColor="rgba(255,255,255,0.3)"
                      inActiveStrokeOpacity={0.3}
                      maxValue={100}
                      title="Humidity"
                      titleColor="#FFFFFF"
                      titleStyle={{ fontWeight: 'bold' }}
                      valueFormatter={(value) => `${value}%`}
                    />
                  </View>
                  {renderSensorRow('thermostat', 'Temperature', temperature, '°C', isTempCritical)}
                </View>
                <View style={styles.sensorColumn}>
                  <View style={styles.gaugeContainer}>
                    <CircularProgress
                      value={pH}
                      radius={wp(12)}
                      duration={1000}
                      progressValueColor="#FFFFFF"
                      activeStrokeColor="#FFFFFF"
                      inActiveStrokeColor="rgba(255,255,255,0.3)"
                      maxValue={140}
                      valueSuffix=" pH"
                      title="pH Level"
                      titleColor="#FFFFFF"
                      titleStyle={{ fontWeight: 'bold' }}
                      activeStrokeWidth={8}
                    />
                  </View>
                  {renderSensorRow('lightbulb', 'LED Status', sensorData.led)}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
  
          {/* Last Updated */}
          <Text style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
  
          {/* Navigation Boxes */}
          {renderNavigationBox({
            title: 'Environment Controls',
            icon: 'device-thermostat',
            onPress: () => navigation.navigate('EnvironmentPage'),
            color: '#2196F3',
            description: 'Adjust temperature, humidity, and lighting'
          })}
  
          {renderNavigationBox({
            title: 'Reservoir Management',
            icon: 'water',
            onPress: () => navigation.navigate('ReservoirPage'),
            color: '#00ACC1',
            description: 'Monitor and adjust nutrient levels'
          })}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );};

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