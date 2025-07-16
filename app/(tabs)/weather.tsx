
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso de ubicación denegado', 'Necesitamos tu permiso para acceder a la ubicación para mostrar el clima.');
          setError('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWeatherData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando datos del clima...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Clima Actual</ThemedText>
      {weatherData && weatherData.current_weather ? (
        <View>
          <ThemedText style={styles.text}>Temperatura: {weatherData.current_weather.temperature}°C</ThemedText>
          <ThemedText style={styles.text}>Velocidad del viento: {weatherData.current_weather.windspeed} km/h</ThemedText>
          <ThemedText style={styles.text}>Dirección del viento: {weatherData.current_weather.winddirection}°</ThemedText>
          {weatherData.hourly && weatherData.hourly.time && weatherData.hourly.time.length > 0 && (
            <View>
              <ThemedText type="subtitle" style={styles.subtitle}>Pronóstico por hora:</ThemedText>
              <FlatList
                data={weatherData.hourly.time.slice(0, 5)} // Mostrar las próximas 5 horas
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <ThemedText style={styles.text}>
                    {new Date(item).toLocaleTimeString()}: {weatherData.hourly.temperature_2m[index]}°C
                  </ThemedText>
                )}
              />
            </View>
          )}
        </View>
      ) : (
        <ThemedText>No hay datos del clima disponibles.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 15,
    marginBottom: 5,
  },
});
