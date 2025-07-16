import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, Button, FlatList, Alert, View, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect } from 'expo-router';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
// import storage from '@react-native-firebase/storage';

export default function ExploreScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [review, setReview] = useState('');
  const [pois, setPois] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  // const currentUser = auth().currentUser;
  const currentUser = { uid: 'test_user' }; // Mock user for now

  const loadPois = async () => {
    // if (!currentUser) return;
    // try {
    //   const snapshot = await firestore()
    //     .collection('users')
    //     .doc(currentUser.uid)
    //     .collection('pois')
    //     .orderBy('createdAt', 'desc')
    //     .get();
    //   const loadedPois = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setPois(loadedPois);
    // } catch (error) {
    //   console.error('Error loading POIs from Firestore:', error);
    //   Alert.alert('Error', 'No se pudieron cargar los puntos de interés.');
    // }
  };

  useEffect(() => {
    // if (currentUser) {
    //   loadPois();
    // }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      // if (currentUser) {
      //   loadPois();
      // }
    }, [currentUser])
  );

  const uploadMedia = async (uri, type) => {
    // const filename = uri.substring(uri.lastIndexOf('/') + 1);
    // const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    // const storageRef = storage().ref(`${type}s/${currentUser.uid}/${filename}`);
    // const task = storageRef.putFile(uploadUri);

    // try {
    //   await task;
    //   const url = await storageRef.getDownloadURL();
    //   Alert.alert('Éxito', `${type === 'image' ? 'Foto' : 'Video'} subido correctamente.`);
    //   return url;
    // } catch (e) {
    //   console.error(`Error al subir ${type}:`, e);
    //   Alert.alert('Error', `No se pudo subir el ${type}.`);
    //   return null;
    // }
    return 'mock_url';
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null); // Asegurarse de que solo uno esté seleccionado
    }
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null); // Asegurarse de que solo uno esté seleccionado
    }
  };

  const handleAddPoi = async () => {
    // if (!currentUser) {
    //   Alert.alert('Error', 'Debes iniciar sesión para añadir puntos de interés.');
    //   return;
    // }
    if (title.trim() === '' || description.trim() === '') {
      Alert.alert('Error', 'Por favor, rellena el título y la descripción.');
      return;
    }

    let imageUrl = null;
    let videoUrl = null;

    if (selectedImage) {
      imageUrl = await uploadMedia(selectedImage, 'image');
      if (!imageUrl) return; // Si falla la subida, no añadir el POI
    }
    if (selectedVideo) {
      videoUrl = await uploadMedia(selectedVideo, 'video');
      if (!videoUrl) return; // Si falla la subida, no añadir el POI
    }

    // try {
    //   const newPoi = {
    //     title,
    //     description,
    //     review,
    //     photos: imageUrl ? [imageUrl] : [],
    //     videos: videoUrl ? [videoUrl] : [],
    //     createdAt: firestore.FieldValue.serverTimestamp(),
    //   };
    //   await firestore()
    //     .collection('users')
    //     .doc(currentUser.uid)
    //     .collection('pois')
    //     .add(newPoi);

    //   Alert.alert('Éxito', 'Punto de interés añadido.');
    //   setTitle('');
    //   setDescription('');
    //   setReview('');
    //   setSelectedImage(null);
    //   setSelectedVideo(null);
    //   loadPois(); // Recargar la lista de POIs
    // } catch (error) {
    //   console.error('Error adding POI to Firestore:', error);
    //   Alert.alert('Error', 'No se pudo añadir el punto de interés.');
    // }
    Alert.alert('Éxito', 'Punto de interés añadido (mock).');
    setTitle('');
    setDescription('');
    setReview('');
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mis Puntos de Interés</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Título del punto de interés"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Escribe tu reseña aquí..."
        value={review}
        onChangeText={setReview}
        multiline
      />

      <View style={styles.buttonRow}>
        <Button title="Seleccionar Foto" onPress={pickImage} />
        <Button title="Seleccionar Video" onPress={pickVideo} />
      </View>
      {selectedImage && <Image source={{ uri: selectedImage }} style={styles.mediaPreview} />}
      {selectedVideo && <ThemedText>Video seleccionado: {selectedVideo.substring(selectedVideo.lastIndexOf('/') + 1)}</ThemedText>}

      <Button title="Añadir Punto de Interés" onPress={handleAddPoi} />

      <ThemedText type="subtitle" style={styles.listTitle}>Puntos Guardados:</ThemedText>
      <FlatList
        data={pois}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.poiItem}>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText>{item.description}</ThemedText>
            {item.review ? <ThemedText>Reseña: {item.review}</ThemedText> : null}
            {item.photos && item.photos.length > 0 && (
              <Image source={{ uri: item.photos[0] }} style={styles.poiMedia} />
            )}
            {item.videos && item.videos.length > 0 && (
              <ThemedText>Video: {item.videos[0].substring(item.videos[0].lastIndexOf('/') + 1)}</ThemedText>
            )}
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  listTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  poiItem: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginVertical: 10,
  },
  poiMedia: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    marginTop: 10,
    borderRadius: 5,
  },
});