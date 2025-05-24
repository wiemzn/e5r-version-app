import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const ActuatorCard = ({ actuatorName, value, unit, switchValue, onSwitchChanged, isLocked }) => {
  const getIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'water_pump':
        return 'water-pump';
      case 'ventilation':
        return 'air';
      case 'led':
        return 'lightbulb';
      default:
        return 'tune';
    }
  };

  return (
    <Animatable.View animation="fadeInUp" duration={800}>
      <LinearGradient
        colors={isLocked ? ['#E0E0E0', '#BDBDBD'] : (switchValue ? ['#43A047', '#2E7D32'] : ['#FFFFFF', '#F5F7FA'])}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.actuatorCard, 
          switchValue && styles.actuatorCardActive,
          isLocked && styles.actuatorCardLocked
        ]}
      >
        <View style={styles.actuatorHeader}>
          <View style={[
            styles.iconContainer, 
            switchValue && styles.iconContainerActive,
            isLocked && styles.iconContainerLocked
          ]}>
            <Icon 
              name={getIcon(actuatorName)} 
              size={wp(6)} 
              color={isLocked ? '#9E9E9E' : (switchValue ? '#FFFFFF' : '#388E3C')} 
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.actuatorTitle, 
              switchValue && styles.actuatorTitleActive,
              isLocked && styles.actuatorTitleLocked
            ]}>
              {actuatorName.replace('_', ' ')}
            </Text>
            {isLocked && (
              <View style={styles.lockedBadge}>
                <Icon name="lock" size={wp(4)} color="#757575" />
                <Text style={styles.lockedText}>Auto</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.actuatorContent}>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusLabel, 
              switchValue && styles.statusLabelActive,
              isLocked && styles.statusLabelLocked
            ]}>Status</Text>
            <Text style={[
              styles.actuatorStatus, 
              switchValue && styles.actuatorStatusActive,
              isLocked && styles.actuatorStatusLocked
            ]}>
              {switchValue ? 'ON' : 'OFF'} {unit}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton, 
              switchValue && styles.toggleButtonActive,
              isLocked && styles.toggleButtonLocked
            ]}
            onPress={() => !isLocked && onSwitchChanged(!switchValue)}
            disabled={isLocked}
            accessible={true}
            accessibilityLabel={`Toggle ${actuatorName} ${switchValue ? 'off' : 'on'}`}
          >
            <Text style={[
              styles.toggleButtonText,
              isLocked && styles.toggleButtonTextLocked
            ]}>
              {switchValue ? 'Turn OFF' : 'Turn ON'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

const ControlModeSwitch = ({ isAutomatic, onToggle }) => {
  return (
    <TouchableOpacity
      style={styles.controlModeContainer}
      onPress={onToggle}
    >
      <LinearGradient
        colors={isAutomatic ? ['#43A047', '#2E7D32'] : ['#FFFFFF', '#F5F7FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.controlModeCard}
      >
        <View style={styles.controlModeContent}>
          <Icon 
            name={isAutomatic ? "autorenew" : "pan-tool"} 
            size={wp(6)} 
            color={isAutomatic ? '#FFFFFF' : '#388E3C'} 
          />
          <Text style={[
            styles.controlModeText,
            isAutomatic && styles.controlModeTextActive
          ]}>
            {isAutomatic ? 'Automatic Control' : 'Manual Control'}
          </Text>
        </View>
        <View style={[
          styles.controlModeIndicator,
          isAutomatic && styles.controlModeIndicatorActive
        ]}>
          <Text style={[
            styles.controlModeStatus,
            isAutomatic && styles.controlModeStatusActive
          ]}>
            {isAutomatic ? 'ON' : 'OFF'}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const ControlsScreen = () => {
  const navigation = useNavigation();
  const [actuatorStates, setActuatorStates] = useState({
    water_pump: false,
    ventilation: false,
    led: false
  });
  const [isAutomatic, setIsAutomatic] = useState(false);
  
  const database = getDatabase(app);
  const controlsRef = ref(database, 'users/11992784/greenhouse');

  useEffect(() => {
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setActuatorStates({
        water_pump: data.water_pump === 'ON',
        ventilation: data.ventilation === 'ON',
        led: data.led === 'ON'
      });
      setIsAutomatic(data.control_mode === 'AUTO');
    }, (error) => {
      console.error('Firebase error:', error);
    });

    return () => unsubscribe();
  }, []);

  const toggleActuator = async (actuatorName, value) => {
    if (isAutomatic) return; // Don't allow changes in automatic mode
    try {
      await set(ref(database, `users/11992784/greenhouse/${actuatorName}`), value ? 'ON' : 'OFF');
      setActuatorStates(prev => ({
        ...prev,
        [actuatorName]: value
      }));
    } catch (error) {
      console.error(`Error toggling ${actuatorName}:`, error);
    }
  };

  const toggleControlMode = async () => {
    try {
      const newMode = !isAutomatic;
      await set(ref(database, 'users/11992784/greenhouse/control_mode'), newMode ? 'AUTO' : 'MANUAL');
      setIsAutomatic(newMode);
    } catch (error) {
      console.error('Error toggling control mode:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4f5e8']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={wp(6)} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.title}>Control Panel</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Control Mode</Text>
          <ControlModeSwitch 
            isAutomatic={isAutomatic}
            onToggle={toggleControlMode}
          />

          <Text style={[styles.sectionTitle, styles.actuatorsSectionTitle]}>System Controls</Text>
          
          {/* Water Pump Control */}
          <ActuatorCard
            actuatorName="Water Pump"
            value={actuatorStates.water_pump ? "ON" : "OFF"}
            unit=""
            switchValue={actuatorStates.water_pump}
            onSwitchChanged={(value) => toggleActuator('water_pump', value)}
            isLocked={isAutomatic}
          />

          {/* Ventilation Control */}
          <ActuatorCard
            actuatorName="Ventilation"
            value={actuatorStates.ventilation ? "ON" : "OFF"}
            unit=""
            switchValue={actuatorStates.ventilation}
            onSwitchChanged={(value) => toggleActuator('ventilation', value)}
            isLocked={isAutomatic}
          />

          {/* LED Control */}
          <ActuatorCard
            actuatorName="LED"
            value={actuatorStates.led ? "ON" : "OFF"}
            unit=""
            switchValue={actuatorStates.led}
            onSwitchChanged={(value) => toggleActuator('led', value)}
            isLocked={isAutomatic}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: wp(2),
  },
  title: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: wp(4),
  },
  content: {
    flex: 1,
    padding: wp(4),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: hp(2),
  },
  actuatorsSectionTitle: {
    marginTop: hp(3),
  },
  actuatorCard: {
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actuatorCardActive: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actuatorCardLocked: {
    opacity: 0.8,
  },
  actuatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
    padding: wp(3),
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconContainerLocked: {
    backgroundColor: 'rgba(189, 189, 189, 0.2)',
  },
  actuatorTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#1B5E20',
  },
  actuatorTitleActive: {
    color: '#FFFFFF',
  },
  actuatorTitleLocked: {
    color: '#757575',
  },
  actuatorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: wp(3.5),
    color: '#757575',
    marginBottom: hp(0.5),
  },
  statusLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusLabelLocked: {
    color: '#9E9E9E',
  },
  actuatorStatus: {
    fontSize: wp(4),
    color: '#424242',
    fontWeight: '500',
  },
  actuatorStatusActive: {
    color: '#FFFFFF',
  },
  actuatorStatusLocked: {
    color: '#757575',
  },
  toggleButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(3),
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  toggleButtonLocked: {
    backgroundColor: '#BDBDBD',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  toggleButtonText: {
    color: '#424242',
    fontSize: wp(3.8),
    fontWeight: '600',
  },
  toggleButtonTextLocked: {
    color: '#757575',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(189, 189, 189, 0.2)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
    marginLeft: wp(2),
  },
  lockedText: {
    color: '#757575',
    fontSize: wp(3),
    marginLeft: wp(1),
    fontWeight: '500',
  },
  controlModeContainer: {
    marginBottom: hp(2),
  },
  controlModeCard: {
    borderRadius: wp(4),
    padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlModeText: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#1B5E20',
    marginLeft: wp(3),
  },
  controlModeTextActive: {
    color: '#FFFFFF',
  },
  controlModeIndicator: {
    backgroundColor: 'rgba(224, 224, 224, 0.5)',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
  },
  controlModeIndicatorActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlModeStatus: {
    fontSize: wp(3.5),
    fontWeight: '600',
    color: '#424242',
  },
  controlModeStatusActive: {
    color: '#FFFFFF',
  },
});

export default ControlsScreen;
