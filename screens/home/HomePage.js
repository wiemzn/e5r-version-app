import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const cubes = [
  { title: 'Greenhouse', icon: 'eco', color: '#2E7D32' },
  { title: 'Green Energy', icon: 'bolt', color: '#FF8F00' },
  { title: 'Plant Health', icon: 'health-and-safety', color: '#C62828' },
  { title: 'Weather', icon: 'wb-sunny', color: '#0288D1' },
  { title: 'Irrigation', icon: 'opacity', color: '#6A1B9A' },
  { title: 'Analytics', icon: 'insights', color: '#00897B' },
];

const { width } = Dimensions.get('window');
const numColumns = 2;
const cubeSize = (width - wp(12)) / numColumns; // More padding for better spacing

const HomePage = () => {
  const navigation = useNavigation();

  const handleCubePress = (title) => {
    if (title === 'Greenhouse') {
      navigation.navigate('GreenhousePage');
    } else if (title === 'Green Energy') {
      navigation.navigate('GreenEnergyPage');
    } else if (title === 'Plant Health') {
      navigation.navigate('PlantDiseasePage');
      
    } else if (title === 'Weather') {
      navigation.navigate('Weather');
    }
    else {
      console.log(`Pressed: ${title}`);
    }
  };

  const renderCube = ({ item }) => (
    <TouchableOpacity 
      onPress={() => handleCubePress(item.title)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[item.color, `${item.color}DD`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cube, { width: cubeSize, height: cubeSize }]}
      >
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={wp(14)} color="#FFFFFF" />
        </View>
        <Text style={styles.cubeText}>{item.title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4f5e8']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Smart Farm Dashboard</Text>
          <View style={styles.appBarSubtitleContainer}>
            <Icon name="agriculture" size={wp(5)} color="#FFFFFF" />
            <Text style={styles.appBarSubtitle}>Connected</Text>
          </View>
        </View>
        
        <FlatList
          data={cubes}
          renderItem={renderCube}
          keyExtractor={(item) => item.title}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: {new Date().toLocaleTimeString()}</Text>
        </View>
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
    backgroundColor: '#1B5E20',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
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
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  appBarTitle: {
    fontSize: wp(6.5),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appBarSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  appBarSubtitle: {
    fontSize: wp(3.5),
    color: '#E8F5E9',
    marginLeft: wp(1),
  },
  grid: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  cube: {
    margin: wp(2),
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(4),
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
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  cubeText: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    padding: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  footerText: {
    fontSize: wp(3.2),
    color: '#616161',
  },
});

export default HomePage;