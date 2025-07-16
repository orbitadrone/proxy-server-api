import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  const initialRegion = {
    latitude: 41.3851, // Ejemplo: Latitud de Barcelona
    longitude: 2.1734, // Ejemplo: Longitud de Barcelona
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Muestra la ubicación actual del usuario
      >
        {/* Puedes añadir marcadores */}
        <Marker
          coordinate={{ latitude: 41.3851, longitude: 2.1734 }}
          title="Mi Ubicación"
          description="Aquí estoy!"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});