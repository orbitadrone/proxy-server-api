import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Button, Alert, Text, ActivityIndicator, Modal, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker, Geojson } from 'react-native-maps';
import { point, booleanPointInPolygon } from '@turf/turf';
import WeatherDisplay from '../../components/WeatherDisplay';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { db, storage } from '../../src/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- IMPORTAR LOS FICHEROS GEOJSON DE ENAIRE ---
// Los ficheros se cargarán de forma asíncrona cuando se necesiten.
// ------------------------------------------------

const SELECTED_PLACE_STORAGE_KEY = 'selected_place';

// Función para asignar colores a las zonas de ENAIRE según su tipo
const getZoneStyle = (zone) => {
  const type = zone?.properties?.TIPO;
  switch (type) {
    case 'ZRV': // Vuelo Recreativo
      return { fillColor: 'rgba(0, 255, 0, 0.3)', strokeColor: 'green' };
    case 'ZEC': // Zona Especial Conservación
    case 'ZEPA': // Zona Especial Protección Aves
      return { fillColor: 'rgba(255, 165, 0, 0.4)', strokeColor: 'orange' };
    case 'P': // Prohibida
    case 'R': // Restringida
      return { fillColor: 'rgba(255, 0, 0, 0.4)', strokeColor: 'red' };
    case 'D': // Peligrosa
      return { fillColor: 'rgba(255, 255, 0, 0.4)', strokeColor: 'yellow' };
    default:
      return { fillColor: 'rgba(128, 128, 128, 0.4)', strokeColor: 'gray' };
  }
};


export default function MapScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [region, setRegion] = useState({
    latitude: 41.3851,
    longitude: 2.1734,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [airspaceZones, setAirspaceZones] = useState(null); // Para guardar las zonas de ENAIRE
  const [isLoading, setIsLoading] = useState(false); // Para el indicador de carga
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null); // Para la información de la zona seleccionada
  const currentUser = { uid: 'test_user' };

  // New states for weather modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(null);
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(null);
  const [searchPois, setSearchPois] = useState([]); // New state for search results
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false); // New state for search modal
  const [searchText, setSearchText] = useState(''); // New state for search text
  const [isWebViewModalVisible, setIsWebViewModalVisible] = useState(false); // New state for WebView modal
  const [webViewUrl, setWebViewUrl] = useState(''); // New state for WebView URL
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false); // New state for review modal
  const [reviewText, setReviewText] = useState(''); // New state for review text
  const [youtubeLinkInput, setYoutubeLinkInput] = useState(''); // New state for YouTube link
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // New state for selected images
  const [placeReviews, setPlaceReviews] = useState<any[]>([]); // New state for reviews of the selected place
  const [isReviewsModalVisible, setIsReviewsModalVisible] = useState(false); // New state for reviews display modal

  const fetchPlaceReviews = async () => {
    if (!selectedCoordinate) {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa para ver las reseñas.");
      return;
    }

    setIsLoading(true);
    try {
      const placeId = `${selectedCoordinate.latitude}_${selectedCoordinate.longitude}`.replace(/\./g, '_');
      const reviewsCollectionRef = collection(db, "places", placeId, "reviews");
      const q = query(reviewsCollectionRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const reviews: any[] = [];
      querySnapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      setPlaceReviews(reviews);
      setIsReviewsModalVisible(true);
    } catch (error) {
      console.error("Error al obtener las reseñas:", error);
      Alert.alert("Error", "Hubo un problema al cargar las reseñas.");
    } finally {
      setIsLoading(false);
    }
  };

  const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

  const handleSearchInArea = () => {
    console.log("handleSearchInArea called");
    if (!selectedCoordinate) {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero.");
      return;
    }
    setIsSearchModalVisible(true); // Open the custom search modal
  };

  const performSearch = async () => {
    if (!searchText) {
      return;
    }

    setIsSearchModalVisible(false); // Close the modal

    console.log("Region actual:", region);
    console.log("Coordenada seleccionada:", selectedCoordinate);

    const nominatimUrl = `${NOMINATIM_API_URL}?q=${searchText}&format=json&limit=10&bounded=1&viewbox=${region.longitude - region.longitudeDelta / 2},${region.latitude - region.latitudeDelta / 2},${region.longitude + region.longitudeDelta / 2},${region.latitude + region.latitudeDelta / 2}`;
    console.log("Nominatim URL:", nominatimUrl);

    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'OrbitadroneApp/1.0 (ton69@example.com)' // Reemplaza con tu nombre de app y email
        }
      });
      console.log("Nominatim Response Status:", response.status);
      console.log("Nominatim Response Headers:", response.headers);
      const data = await response.json();
      console.log("Respuesta de Nominatim:", data);

      if (data && data.length > 0) {
        const newPois = data.map(item => ({
          coordinate: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) },
          title: item.display_name,
          description: item.type,
        }));
        setSearchPois(newPois);
      } else {
        setSearchPois([]);
      }
    } catch (error) {
      console.error("Error al buscar en Nominatim:", error);
    }
  };
  const loadSelectedPlace = async () => {
      try {
          const storedPlace = await AsyncStorage.getItem(SELECTED_PLACE_STORAGE_KEY);
          if (storedPlace !== null) {
              const place = JSON.parse(storedPlace);
              setSelectedPlace(place);
              setRegion({
                  ...region,
                  latitude: place.coordinate.latitude,
                  longitude: place.coordinate.longitude,
              });
              await AsyncStorage.removeItem(SELECTED_PLACE_STORAGE_KEY);
          }
      } catch (error) {
          console.error('Error loading selected place:', error);
      }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado', 'Necesitamos tu permiso para acceder a la ubicación.');
        return;
      }
      setLocationPermission(true);

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSelectedPlace();
    }, [currentUser])
  );

  // --- LÓGICA DEL MAPA INTERACTIVO ---

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedCoordinate(coordinate);
    setSelectedZoneInfo(null); // Ocultar el modal de detalles al pulsar el mapa
  };

  const handleVuelaSeguro = async () => {
    setIsLoading(true);
    console.log("Iniciando handleVuelaSeguro...");

    if (!selectedCoordinate) {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Intentando cargar ficheros GeoJSON...");
      // Cargar los ficheros GeoJSON de forma asíncrona
      const [aeroZonesModule] = await Promise.all([
        import('../../assets/enaire_zones/ZGUAS_Aero.json'),
      ]);

      // Acceder a las features de los módulos importados
      const enaireAeroZones = aeroZonesModule.default;
      console.log("enaireAeroZones.features:", enaireAeroZones.features ? enaireAeroZones.features.length : "undefined/null");

      // Combinar todas las features de los diferentes GeoJSON
      let allFeatures = [
        ...(enaireAeroZones.features || []),
      ];

      // Filtrar las zonas para excluir las TMA
      const filteredFeatures = allFeatures.filter(zone => {
        const zoneName = zone.properties.UASZone?.name || '';
        return !zoneName.toUpperCase().includes('TMA');
      });

      console.log("Total de features combinadas (sin TMA):", filteredFeatures.length);
      console.log("All Features (first 2, sin TMA):", filteredFeatures.slice(0, 2).map(f => f.properties.UASZone.message));

      // Detectar zonas superpuestas en la coordenada seleccionada
      const clickedPoint = point([selectedCoordinate.longitude, selectedCoordinate.latitude]);
      const overlappingZones = filteredFeatures.filter(zone => {
        try {
          return booleanPointInPolygon(clickedPoint, zone);
        } catch (e) {
          console.error("Error checking point in polygon:", e);
          return false;
        }
      });

      if (overlappingZones.length > 0) {
        const messages = overlappingZones.map(zone => zone.properties.UASZone?.message || "No hay información de alerta disponible para esta zona.");
        setSelectedZoneInfo(messages);
      } else {
        setSelectedZoneInfo(["No se encontraron zonas de ENAIRE en este punto."]);
      }

      // Establecer las zonas filtradas en el mapa
      setAirspaceZones({
        type: 'FeatureCollection',
        features: filteredFeatures,
      });
      console.log("Zonas de ENAIRE (sin TMA) cargadas y establecidas.");
      
    } catch (error) {
      console.error("Error cargando zonas de ENAIRE desde ficheros:", error);
      Alert.alert("Error", "No se pudieron cargar las zonas de ENAIRE desde los ficheros locales.");
    } finally {
      setIsLoading(false);
      console.log("handleVuelaSeguro finalizado.");
    }
  };

  

  const handleMeteorologia = () => {
    if (selectedCoordinate) {
      setSelectedLatitude(selectedCoordinate.latitude);
      setSelectedLongitude(selectedCoordinate.longitude);
      setIsModalVisible(true);
    } else {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero para ver la meteorología.");
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedLatitude(null);
    setSelectedLongitude(null);
  };

  const handleCancel = () => {
      setSelectedCoordinate(null);
      setAirspaceZones(null);
      setIsSearchModalVisible(false); // Close search modal
      setIsReviewModalVisible(false); // Close review modal
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages(result.assets.map(asset => asset.uri));
    }
  };

  const submitReview = async () => {
    if (!selectedCoordinate) {
      Alert.alert("Error", "No hay un punto seleccionado para añadir la reseña.");
      return;
    }

    if (!reviewText && !youtubeLinkInput && selectedImages.length === 0) {
      Alert.alert("Error", "Por favor, introduce una reseña, un enlace de YouTube o selecciona al menos una imagen.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Subir imágenes a Firebase Storage
      const photoUrls: string[] = [];
      for (const imageUri of selectedImages) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `review_photos/${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        photoUrls.push(downloadURL);
      }

      // 2. Guardar la reseña en Firestore
      const placeId = `${selectedCoordinate.latitude}_${selectedCoordinate.longitude}`.replace(/\./g, '_'); // Crear un ID único para el lugar
      const placeRef = doc(db, "places", placeId);

      // Asegurarse de que el documento del lugar existe (o crearlo si no)
      await setDoc(placeRef, {
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        // Puedes añadir un nombre de lugar aquí si lo obtienes de Nominatim o el usuario lo introduce
      }, { merge: true }); // merge: true para no sobrescribir si ya existe

      await addDoc(collection(placeRef, "reviews"), {
        userId: "anonymous", // Puedes implementar autenticación de usuario más tarde
        userName: "Piloto Anónimo", // Puedes obtener el nombre del usuario autenticado
        text: reviewText,
        youtubeLink: youtubeLinkInput,
        photoUrls: photoUrls,
        timestamp: serverTimestamp(),
      });

      Alert.alert("Éxito", "Reseña subida correctamente.");
      // Limpiar el formulario
      setReviewText('');
      setYoutubeLinkInput('');
      setSelectedImages([]);
      setIsReviewModalVisible(false);
    } catch (error) {
      console.error("Error al subir la reseña:", error);
      Alert.alert("Error", "Hubo un problema al subir la reseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider="google"
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
        onPress={handleMapPress}
      >
        {/* Zonas de ENAIRE */}
        {airspaceZones && airspaceZones.features.map((zone, index) => (
            <Geojson
                key={index}
                geojson={{ type: 'FeatureCollection', features: [zone] }}
                strokeColor={getZoneStyle(zone).strokeColor}
                fillColor={getZoneStyle(zone).fillColor}
                strokeWidth={2}
            />
        ))}

        {/* Marcadores */}
        {selectedPlace && <Marker coordinate={selectedPlace.coordinate} title={selectedPlace.title} description={selectedPlace.description} pinColor="blue" />}
        {selectedCoordinate && <Marker coordinate={selectedCoordinate} pinColor="green" />}
        {searchPois.map((poi, index) => (
          <Marker
            key={`search-poi-${index}`}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            pinColor="purple" // Puedes elegir un color diferente para estos marcadores
            onPress={() => {
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.title)},${poi.coordinate.latitude},${poi.coordinate.longitude}`;
              setWebViewUrl(googleMapsUrl);
              setIsWebViewModalVisible(true);
            }}
          />
        ))}
      </MapView>

      {/* Panel de Carga */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Consultando ENAIRE...</Text>
        </View>
      )}

      {/* Panel de Opciones */}
      {selectedCoordinate && (
        <View style={styles.optionsPanel}>
          <Text style={styles.panelTitle}>Opciones del Punto</Text>
          <View style={styles.buttonRow}>
            <Button title="Vuela Seguro" onPress={handleVuelaSeguro} />
            <Button title="Meteorología" onPress={handleMeteorologia} />
            <Button title="Buscar en esta zona" onPress={handleSearchInArea} />
            <Button title="Añadir Reseña" onPress={() => {
              if (!selectedCoordinate) {
                Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero para añadir una reseña.");
                return;
              }
              setIsReviewModalVisible(true);
            }} />
            <Button title="Ver Reseñas" onPress={fetchPlaceReviews} />
          </View>
          <View style={styles.cancelButton}>
            <Button title="Cancelar" onPress={handleCancel} color="#ff5c5c" />
          </View>
        </View>
      )}

      {/* Botón para limpiar zonas */}
      {airspaceZones && !isLoading && (
        <View style={styles.clearButton}>
            <Button title="Limpiar Zonas" onPress={() => setAirspaceZones(null)} color="orange" />
        </View>
      )}

      {/* Modal para mostrar información de la zona */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedZoneInfo !== null}
        onRequestClose={() => setSelectedZoneInfo(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalles de la Zona</Text>
            <ScrollView style={styles.modalScrollView}>
              {selectedZoneInfo && selectedZoneInfo.map((message, index) => (
                <Text key={index} style={styles.zoneMessage}>{message.replace(/<[^>]+>/g, '')}</Text>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedZoneInfo(null)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Modal for WeatherDisplay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLatitude !== null && selectedLongitude !== null ? (
              <WeatherDisplay
                latitude={selectedLatitude}
                longitude={selectedLongitude}
                onClose={handleCloseModal}
              />
            ) : (
              <Text>Selecciona una ubicación para ver el clima.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Search Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSearchModalVisible}
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buscar en esta zona</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Introduce tu búsqueda (ej. restaurantes)"
              value={searchText}
              onChangeText={setSearchText}
            />
            <View style={styles.buttonRow}>
              <Button title="Buscar" onPress={performSearch} />
              <Button title="Cancelar" onPress={() => setIsSearchModalVisible(false)} color="#ff5c5c" />
            </View>

            <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity style={styles.suggestionButton} onPress={() => { setSearchText('Restaurantes'); performSearch(); }}>
                <Text style={styles.suggestionButtonText}>Restaurantes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton} onPress={() => { setSearchText('Gasolineras'); performSearch(); }}>
                <Text style={styles.suggestionButtonText}>Gasolineras</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton} onPress={() => { setSearchText('Hoteles'); performSearch(); }}>
                <Text style={styles.suggestionButtonText}>Hoteles</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton} onPress={() => { setSearchText('Camping'); performSearch(); }}>
                <Text style={styles.suggestionButtonText}>Camping</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton} onPress={() => { setSearchText('Farmacias'); performSearch(); }}>
                <Text style={styles.suggestionButtonText}>Farmacias</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WebView Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isWebViewModalVisible}
        onRequestClose={() => setIsWebViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsWebViewModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
            {webViewUrl ? (
              <WebView
                source={{ uri: webViewUrl }}
                style={{ flex: 1, width: '100%' }}
              />
            ) : (
              <Text>No URL to display.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReviewModalVisible}
        onRequestRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir Reseña</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Escribe tu reseña aquí..."
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />
            <TextInput
              style={styles.reviewInput}
              placeholder="Enlace de YouTube (opcional)"
              value={youtubeLinkInput}
              onChangeText={setYoutubeLinkInput}
            />
            <Button title="Seleccionar Fotos" onPress={pickImage} />
            <View style={styles.selectedImagesContainer}>
              {selectedImages.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.selectedImage} />
              ))}
            </View>
            <View style={styles.buttonRow}>
              <Button title="Subir Reseña" onPress={submitReview} />
              <Button title="Cancelar" onPress={() => setIsReviewModalVisible(false)} color="#ff5c5c" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Display Reviews Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReviewsModalVisible}
        onRequestClose={() => setIsReviewsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reseñas del Lugar</Text>
            <ScrollView style={styles.modalScrollView}>
              {placeReviews.length > 0 ? (
                placeReviews.map((review, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <Text style={styles.reviewUser}>{review.userName || 'Anónimo'}</Text>
                    <Text style={styles.reviewText}>{review.text}</Text>
                    {review.youtubeLink && (
                      <TouchableOpacity onPress={() => Linking.openURL(review.youtubeLink)}>
                        <Text style={styles.youtubeLink}>Ver en YouTube</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.reviewImagesContainer}>
                      {review.photoUrls && review.photoUrls.map((url, imgIndex) => (
                        <Image key={imgIndex} source={{ uri: url }} style={styles.reviewImage} />
                      ))}
                    </View>
                    <Text style={styles.reviewTimestamp}>
                      {review.timestamp ? new Date(review.timestamp.toDate()).toLocaleString() : 'Fecha desconocida'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text>No hay reseñas para este lugar todavía.</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsReviewsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  optionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  cancelButton: {
    marginTop: 10,
  },
  clearButton: {
      position: 'absolute',
      top: 60,
      right: 10,
      backgroundColor: 'white',
      borderRadius: 5,
      padding: 5,
      elevation: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalScrollView: {
    flex: 1,
  },
  zoneMessage: {
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 'auto',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  // New styles for weather modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
    margin: 5,
  },
  suggestionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  reviewInput: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    margin: 5,
    borderRadius: 5,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewUser: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewText: {
    marginBottom: 5,
  },
  youtubeLink: {
    color: 'blue',
    textDecorationLine: 'underline',
    marginBottom: 5,
  },
  reviewImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  reviewImage: {
    width: 60,
    height: 60,
    marginRight: 5,
    borderRadius: 3,
  },
  reviewTimestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
});