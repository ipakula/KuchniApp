import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { extractExpiryDate } from '../../api/ai.api';
import { Colors } from '../../constants/colors';

interface ExpiryScannerProps {
  onDateFound: (date: Date) => void;
}

export function ExpiryScannerButton({ onDateFound }: ExpiryScannerProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleOpen = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Brak dostępu', 'Aplikacja potrzebuje dostępu do kamery.');
        return;
      }
    }
    setCameraReady(false);
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || analyzing || !cameraReady) return;
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: true,
        skipMetadata: true,
      });

      if (!photo) {
        Alert.alert('Błąd', 'Nie udało się zrobić zdjęcia. Upewnij się że kamera jest gotowa.');
        return;
      }

      if (!photo.base64) {
        Alert.alert('Błąd', 'Aparat nie zwrócił danych obrazu. Spróbuj ponownie.');
        return;
      }

      const result = await extractExpiryDate(photo.base64);

      if (!result.date) {
        Alert.alert(
          'Nie znaleziono daty',
          `Nie udało się odczytać daty ważności.\n\n${result.raw ? `Tekst na zdjęciu: "${result.raw}"` : 'Upewnij się że data jest wyraźnie widoczna i spróbuj ponownie.'}`,
          [{ text: 'OK' }]
        );
        return;
      }

      const date = new Date(result.date);
      if (isNaN(date.getTime())) {
        Alert.alert('Błąd', `Nie udało się przetworzyć daty: "${result.raw}"`);
        return;
      }

      setShowCamera(false);
      onDateFound(date);
    } catch (err: any) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || err?.message
        || 'Nieznany błąd';
      Alert.alert('Błąd skanowania', `Nie udało się przetworzyć zdjęcia.\n\nSzczegóły: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Pressable style={styles.scanBtn} onPress={handleOpen}>
        <Text style={styles.scanBtnIcon}>📷</Text>
        <Text style={styles.scanBtnText}>Skanuj datę</Text>
      </Pressable>

      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          >
            {/* Viewfinder overlay */}
            <View style={styles.overlay}>
              <View style={styles.topDim} />
              <View style={styles.middleRow}>
                <View style={styles.sideDim} />
                <View style={styles.frame}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <View style={styles.sideDim} />
              </View>
              <View style={styles.bottomDim}>
                <Text style={styles.hint}>
                  {cameraReady
                    ? 'Skieruj kamerę na datę ważności'
                    : 'Inicjowanie kamery...'}
                </Text>
              </View>
            </View>
          </CameraView>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </Pressable>

            <Pressable
              style={[
                styles.captureBtn,
                (analyzing || !cameraReady) && styles.captureBtnDisabled,
              ]}
              onPress={handleCapture}
              disabled={analyzing || !cameraReady}
            >
              {analyzing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Pressable>

            <View style={{ width: 80 }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const CORNER = 20;
const BORDER = 3;

const styles = StyleSheet.create({
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  scanBtnIcon: { fontSize: 16 },
  scanBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  overlay: { flex: 1 },
  topDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: 120 },
  sideDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  bottomDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 16,
  },
  hint: { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'center' },

  frame: { width: 260, height: 120, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: '#000',
  },
  cancelBtn: { width: 80, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 16 },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
