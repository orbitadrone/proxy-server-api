import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const SELECTED_PLACE_STORAGE_KEY = 'selected_place';

export default function ServicesScreen() {
  const GOOGLE_PLACES_API_KEY = 'TU_CLAVE_API_DE_GOOGLE'; // ¡IMPORTANTE: Reemplaza con tu clave de API real!

  const handlePlaceSelect = async (data, details = null) => {
    if (details) {
      const selectedPlace = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        name: data.description,
      };
      try {
        await AsyncStorage.setItem(SELECTED_PLACE_STORAGE_KEY, JSON.stringify(selectedPlace));
        Alert.alert(
          'Lugar Seleccionado',
          `Has seleccionado: ${selectedPlace.name}. Se mostrará en el mapa.`,
          [
            { text: 'OK', onPress: () => router.navigate('/(tabs)/index') },
          ]
        );
      } catch (error) {
        console.error('Error saving selected place:', error);
        Alert.alert('Error', 'No se pudo guardar el lugar seleccionado.');
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Búsqueda de Servicios</ThemedText>

      {/* <GooglePlacesAutocomplete
        placeholder='Buscar lugares (restaurantes, hoteles, etc.)'
        onPress={handlePlaceSelect}
        query={{
          key: GOOGLE_PLACES_API_KEY,
          language: 'es',
        }}
        fetchDetails={true}
        styles={{
          container: {
            flex: 0,
            position: 'absolute',
            width: '100%',
            zIndex: 1,
            top: 0,
          },
          textInputContainer: {
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0)',
            borderTopWidth: 0,
            borderBottomWidth: 0,
          },
          textInput: {
            marginLeft: 0,
            marginRight: 0,
            height: 38,
            color: '#5d5d5d',
            fontSize: 16,
            backgroundColor: '#f0f0f0',
            borderRadius: 5,
            paddingLeft: 10,
          },
          predefinedPlacesDescription: {
            color: '#1faee9',
          },
        }}
        
        debounce={200}
      /> */}

      <View style={styles.contentBelowSearch}>
        <ThemedText>Los resultados de la búsqueda aparecerán aquí.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80, // Ajuste para dejar espacio al campo de búsqueda
  },
  contentBelowSearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});