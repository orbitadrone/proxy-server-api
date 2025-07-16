import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import '@react-native-firebase/analytics';

// Tu configuración de Firebase (la encuentras en la consola de Firebase)
// Nota: Con @react-native-firebase, la configuración se lee automáticamente
// de google-services.json (Android) y GoogleService-Info.plist (iOS).
// No necesitas definirla aquí explícitamente a menos que uses múltiples apps.

// Inicializa Firebase si no ha sido inicializado ya
if (!firebase.apps.length) {
  firebase.initializeApp();
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const analytics = firebase.analytics();

export default firebase;