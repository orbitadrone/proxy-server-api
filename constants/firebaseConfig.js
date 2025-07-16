
import { initializeApp } from 'firebase/app';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = Constants.expoConfig.extra.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };
