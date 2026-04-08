import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useBarcode } from '../../../src/hooks/useBarcode';
import { ProductConfirmSheet } from '../../../src/components/scanner/ProductConfirmSheet';
import { usePantry } from '../../../src/hooks/usePantry';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { scannedProduct, isScanning, loading, handleScan, resetScan } = useBarcode();
  const { locations, addItem } = usePantry();

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Potrzebujemy dostępu do kamery</Text>
        <Text style={styles.permSubtitle}>Kamera służy do skanowania kodów kreskowych produktów</Text>
        <Button title="Zezwól na kamerę" onPress={requestPermission} style={styles.permBtn} />
        <Button title="Wróć" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kamera */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={({ data }) => handleScan(data)}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.topBar}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Skanuj kod kreskowy</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.hint}>Skieruj kamerę na kod kreskowy</Text>
        )}
      </View>

      {/* Bottom sheet po skanowaniu */}
      {scannedProduct && (
        <ProductConfirmSheet
          product={scannedProduct}
          onClose={resetScan}
          onAdd={addItem}
          locations={locations}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  screenTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  frame: {
    width: 260,
    height: 160,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: Colors.background },
  permIcon: { fontSize: 64 },
  permTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: Colors.textPrimary },
  permSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: { width: '100%' },
});
