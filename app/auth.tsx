import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// import auth from '@react-native-firebase/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    // try {
    //   await auth().createUserWithEmailAndPassword(email, password);
    //   Alert.alert('Éxito', 'Usuario registrado correctamente!');
    // } catch (error) {
    //   Alert.alert('Error de registro', error.message);
    // }
    Alert.alert('Éxito', 'Usuario registrado correctamente (mock)!');
  };

  const handleSignIn = async () => {
    // try {
    //   await auth().signInWithEmailAndPassword(email, password);
    //   Alert.alert('Éxito', 'Sesión iniciada correctamente!');
    // } catch (error) {
    //   Alert.alert('Error de inicio de sesión', error.message);
    // }
    Alert.alert('Éxito', 'Sesión iniciada correctamente (mock)!');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Autenticación</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Registrarse" onPress={handleSignUp} />
      <View style={styles.spacer} />
      <Button title="Iniciar Sesión" onPress={handleSignIn} />
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
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  spacer: {
    height: 10,
  },
});