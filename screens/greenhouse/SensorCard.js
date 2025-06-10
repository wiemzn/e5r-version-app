import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SensorCard = ({
  sensorName = 'Unknown',
  value = 'N/A',
  unit = '',
}) => {
  const getIcon = (name) => {
    const sensor = name?.toLowerCase?.(); // Safe check
    switch (sensor) {
      case 'humidity':
        return 'water-drop';
      case 'temperature':
        return 'thermostat';
      case 'ph':
        return 'analytics';
      case 'water_level':
        return 'water';
      default:
        return 'sensors';
    }
  };

  return (
    <LinearGradient
      colors={['#4CAF50', '#2E7D32']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name={getIcon(sensorName)} size={wp(6)} color="#FFFFFF" />
          <Text style={styles.name}>{sensorName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.value}>
            {value} {unit}
          </Text>
        </View>
      </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: wp(3),
  },
  value: {
    fontSize: wp(4.5),
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: wp(2),
  },
});

export default SensorCard;
