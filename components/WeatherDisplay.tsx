import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, FlatList } from 'react-native';
import { fetchWeatherForecast } from '../src/services/weatherService';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Mapeo de códigos de icono de OpenWeatherMap a MaterialCommunityIcons
const weatherIconMap: { [key: string]: string } = {
  '01d': 'weather-sunny',
  '01n': 'weather-night',
  '02d': 'weather-partly-cloudy',
  '02n': 'weather-night-partly-cloudy',
  '03d': 'weather-cloudy',
  '03n': 'weather-cloudy',
  '04d': 'weather-cloudy',
  '04n': 'weather-cloudy',
  '09d': 'weather-pouring',
  '09n': 'weather-pouring',
  '10d': 'weather-rainy',
  '10n': 'weather-rainy',
  '11d': 'weather-lightning-rainy',
  '11n': 'weather-lightning-rainy',
  '13d': 'weather-snowy',
  '13n': 'weather-snowy',
  '50d': 'weather-fog',
  '50n': 'weather-fog',
};

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  visibility: number;
  pop: number;
  sys: {
    pod: string;
  };
  dt_txt: string;
}

interface CityData {
  id: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

interface WeatherForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: CityData;
}

interface WeatherDisplayProps {
  latitude: number;
  longitude: number;
  onClose: () => void; // Para cerrar el modal/desplegable
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ latitude, longitude, onClose }) => {
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('WeatherDisplay useEffect running. Latitude:', latitude, 'Longitude:', longitude);
    const getForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherForecast(latitude, longitude);
        setWeatherForecast(data);
      } catch (err: any) {
        console.error('Error al obtener la predicción del clima:', err);
        setError(err.message || 'Error al cargar los datos de la predicción del clima.');
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      getForecast();
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando predicción del clima...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!weatherForecast || !weatherForecast.list) {
    console.log('WeatherDisplay: No hay datos de predicción o lista vacía.', weatherForecast);
    return (
      <View style={styles.container}>
        <Text>No hay datos de predicción del clima disponibles.</Text>
      </View>
    );
  }

  console.log('WeatherDisplay: Datos recibidos para renderizar:', weatherForecast);

  const renderForecastItem = ({ item }: { item: ForecastItem }) => (
    <View style={styles.forecastItem}>
      <Text style={styles.forecastDate}>{new Date(item.dt * 1000).toLocaleString()}</Text>
      {item.weather && item.weather.length > 0 && (
        <MaterialCommunityIcons
          name={weatherIconMap[item.weather[0].icon] || 'weather-cloudy'} // Fallback a un icono genérico
          size={50}
          color="black"
        />
      )}
      <Text style={styles.forecastTemp}>{item.main.temp}°C</Text>
      <Text style={styles.forecastDescription}>{item.weather[0].description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Predicción en {weatherForecast.city.name}</Text>
      {/* <FlatList
        data={weatherForecast.list}
        renderItem={renderForecastItem}
        keyExtractor={(item) => item.dt.toString()}
        style={styles.forecastList}
      /> */}
      <Text>Datos de la predicción cargados. (FlatList temporalmente deshabilitada)</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Eliminado para depuración
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  forecastList: {
    width: '100%',
    marginTop: 10,
    flexGrow: 0, // Asegura que no intente expandirse infinitamente
    height: 300, // Altura fija para depuración, ajusta según necesidad
  },
  forecastItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  forecastTemp: {
    fontSize: 20,
    color: '#333',
  },
  forecastDescription: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
});

export default WeatherDisplay;
