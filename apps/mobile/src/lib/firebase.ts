import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in firebase 10 but types are broken
import { getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC24VQGTadtzeIOzI4BqQd0PoJOGh6YZuw',
  authDomain: 'kuchniapp-8fda5.firebaseapp.com',
  projectId: 'kuchniapp-8fda5',
  storageBucket: 'kuchniapp-8fda5.firebasestorage.app',
  messagingSenderId: '776254313210',
  appId: '1:776254313210:web:a11f9fa5adb0de56e6af43',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;
