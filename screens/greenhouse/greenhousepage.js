import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const GreenhousePage = () => {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const database = getDatabase(app);
  const databaseRef = ref(database, 'users/idriss/greenhouse');

  useEffect(() => {
    const unsubscribe = onValue(databaseRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log('Firebase sensorData:', data); // Debug log
      setSensorData(data);
    }, (error) => {
      console.error('Firebase error:', error);
    });
    return () => unsubscribe();
  }, []);

  const pH = typeof sensorData.ph === 'number' ? sensorData.ph : 7.0;
  const isSystemSafe = pH >= 6.5 && pH <= 7.5;

  const renderSensorRow = (icon, label, value) => {
    const safeValue = value != null && typeof value !== 'object' ? value.toString() : 'N/A';
    return (
      <View style={styles.sensorRow}>
        <Icon name={icon} size={wp(6)} color="#FFFFFF" />
        <Text style={styles.sensorLabel}>{label || 'Unknown'}</Text>
        <Text style={styles.sensorValue}>{safeValue}</Text>
      </View>
    );
  };

  const renderNavigationBox = ({ title, icon, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={['#1976D2', '#0D47A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navigationBox}
      >
        <Icon name={icon} size={wp(7)} color="#FFFFFF" />
        <Text style={styles.navigationText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#E1F5FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Greenhouse Monitoring</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.statusBox}>
          <LinearGradient
            colors={isSystemSafe ? ['#4CAF50', '#2E7D32'] : ['#F44336', '#C62828']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <Icon
              name={isSystemSafe ? 'check-circle' : 'error'}
              size={wp(10)}
              color="#FFFFFF"
            />
            <Text style={styles.statusTitle}>System Status</Text>
            {renderSensorRow('water-drop', 'Humidity', sensorData.humidity)}
            {renderSensorRow('analytics', 'pH Level', sensorData.ph)}
            {renderSensorRow('thermostat', 'Temperature', sensorData.temperature)}
            {renderSensorRow('lightbulb', 'LED Color', sensorData.led)}
          </LinearGradient>
        </View>
        {renderNavigationBox({
          title: 'Environment',
          icon: 'nature',
          onPress: () => navigation.navigate('EnvironmentPage'),
        })}
        <View style={styles.spacer} />
        {renderNavigationBox({
          title: 'Reservoir',
          icon: 'water',
          onPress: () => navigation.navigate('ReservoirPage'),
        })}
      </View>
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
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(27, 94, 32, 0.2)',
      },
    }),
  },
  appBarTitle: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: wp(4),
  },
  statusBox: {
    width: '100%',
    marginBottom: hp(2),
    borderRadius: wp(3),
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  statusGradient: {
    padding: wp(5),
    borderRadius: wp(3),
    alignItems: 'center',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: wp(6),
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginVertical: hp(2),
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    width: '100%',
    paddingHorizontal: wp(2),
  },
  sensorLabel: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: '500',
    marginLeft: wp(3),
    flex: 1,
  },
  sensorValue: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: 'bold',
    marginRight: wp(2),
  },
  navigationBox: {
    width: '100%',
    padding: wp(4),
    borderRadius: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(1),
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  navigationText: {
    color: '#FFFFFF',
    fontSize: wp(5),
    fontWeight: 'bold',
    marginLeft: wp(3),
  },
  spacer: {
    height: hp(1),
  },
});

export default GreenhousePage;