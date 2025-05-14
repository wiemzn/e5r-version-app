import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const cubes = [
  { title: 'Greenhouse', icon: 'eco', color: '#4CAF50' },
  { title: 'GreenEnergy', icon: 'bolt', color: '#FF9800' },
  { title: 'Plant Disease', icon: 'health-and-safety', color: '#F44336' },
  { title: 'Blank 4', icon: 'widgets', color: '#2196F3' },
  { title: 'Blank 5', icon: 'widgets', color: '#9C27B0' },
  { title: 'Blank 6', icon: 'widgets', color: '#009688' },
];

const { width } = Dimensions.get('window');
const numColumns = 2;
const cubeSize = (width - wp(8)) / numColumns;

const HomePage = () => {
  const navigation = useNavigation();

  const handleCubePress = (title) => {
    if (title === 'Greenhouse') {
      navigation.navigate('GreenhousePage');
    } else if (title === 'GreenEnergy') {
      navigation.navigate('GreenEnergyPage');
    } 
    else if (title === 'Plant Disease') {
      navigation.navigate('PlantDiseasePage');
    }
    
    else {
      console.log(`Pressed: ${title}`);
    }
      
  };

  const renderCube = ({ item }) => (
    <TouchableOpacity onPress={() => handleCubePress(item.title)}>
      <LinearGradient
        colors={[`${item.color}CC`, `${item.color}99`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cube, { width: cubeSize, height: cubeSize }]}
      >
        <Icon name={item.icon} size={wp(12)} color="#FFFFFF" />
        <Text style={styles.cubeText}>{item.title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Smart Farm Dashboard</Text>
      </View>
      <FlatList
        data={cubes}
        renderItem={renderCube}
        keyExtractor={(item) => item.title}
        numColumns={numColumns}
        contentContainerStyle={styles.grid}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  grid: {
    padding: wp(4),
  },
  cube: {
    margin: wp(1.5),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(4),
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
  cubeText: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: hp(1),
    textAlign: 'center',
  },
});

export default HomePage;