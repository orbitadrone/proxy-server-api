import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '01ebf6bdb6363d97f8654534b1eace41'
; // ¡Reemplaza con tu clave API real!
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'; // Cambiado a endpoint de predicción

const LAST_FETCH_TIMESTAMP_KEY = 'lastWeatherFetchTimestamp';
const WEATHER_DATA_KEY = 'weatherData';
const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000; // 12 horas en milisegundos

export const fetchWeatherForecast = async (latitude: number, longitude: number) => {
  try {
    // const lastFetchTimestamp = await AsyncStorage.getItem(LAST_FETCH_TIMESTAMP_KEY);
    // const storedWeatherData = await AsyncStorage.getItem(WEATHER_DATA_KEY);

    // if (lastFetchTimestamp && storedWeatherData) {
    //   const lastFetchTime = parseInt(lastFetchTimestamp, 10);
    //   const currentTime = Date.now();

    //   if (currentTime - lastFetchTime < TWELVE_HOURS_IN_MS) {
    //     console.log('Datos del clima recientes, usando datos almacenados.');
    //     return JSON.parse(storedWeatherData);
    //   }
    // }

    console.log('Obteniendo nuevos datos del clima de la API...');
    const response = await fetch(
      `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    console.log('Respuesta de la API del clima (response.ok):', response.ok);
    console.log('Datos de la API del clima:', data);

    if (response.ok) {
      // await AsyncStorage.setItem(WEATHER_DATA_KEY, JSON.stringify(data));
      // await AsyncStorage.setItem(LAST_FETCH_TIMESTAMP_KEY, Date.now().toString());
      return data;
    } else {
      console.error('Error al obtener datos del clima (API response):', data);
      throw new Error(data.message || 'Error al obtener datos del clima');
    }
  } catch (error) {
    console.error('Error en fetchWeatherForecast:', error);
    throw error;
  }
};