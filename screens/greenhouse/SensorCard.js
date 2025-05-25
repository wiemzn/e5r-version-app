import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SensorCard = ({
  sensorName = 'Unknown',
  value = 'N/A',
  unit = '',
  isExpanded = false,
  onToggle = () => {},
  chart = null
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
      {/* Touchable only on the header */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.header}>
          <Icon name={getIcon(sensorName)} size={wp(6)} color="#FFFFFF" />
          <Text style={styles.name}>{sensorName}</Text>
          <Text style={styles.value}>
            {value} {unit}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Chart or extra content should be freely touchable */}
      {isExpanded && chart && (
        <View style={styles.chartContainer}>
          {chart}
        </View>
      )}
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
    fontSize: wp(4.5),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  chartContainer: {
    marginTop: hp(2),
    alignItems: 'center',
  },
});

export default SensorCard;
