import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from '@react-native-community/slider';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ActuatorCard = ({ actuatorName, value, unit, switchValue, onSwitchChanged }) => {
  const getIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'ventilation':
        return 'air';
      case 'led':
        return 'lightbulb';
      case 'water pump':
        return 'water';
      default:
        return 'tune';
    }
  };

  return (
    <LinearGradient
      colors={['#1976D2', '#0D47A1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Icon name={getIcon(actuatorName)} size={wp(6)} color="#FFFFFF" />
        <Text style={styles.name}>{actuatorName || 'Unknown'}</Text>
        <Switch
          value={switchValue}
          onValueChange={onSwitchChanged}
          trackColor={{ false: '#767577', true: '#81C784' }}
          thumbColor={switchValue ? '#FFFFFF' : '#F4F3F4'}
        />
      </View>
      <Text style={styles.value}>
        {value != null ? value : 'N/A'} {unit || ''}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: hp(1),
    borderRadius: wp(3),
    padding: wp(4),
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: wp(3),
  },
  value: {
    fontSize: wp(4),
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: hp(1),
  },
});

export default ActuatorCard;