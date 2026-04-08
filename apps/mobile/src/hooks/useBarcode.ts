import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { getProductByBarcode } from '../api/pantry.api';

interface ScannedProduct {
  id?: string;
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  image_url?: string;
}

export function useBarcode() {
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(async (barcode: string) => {
    if (!isScanning || loading) return;

    setIsScanning(false);
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const product = await getProductByBarcode(barcode);
      setScannedProduct(product ?? { barcode, name: '', brand: '', category: '' });
    } catch {
      // Produkt nie znaleziony — pozwól użytkownikowi wpisać ręcznie
      setScannedProduct({ barcode, name: '', brand: '', category: '' });
    } finally {
      setLoading(false);
    }
  }, [isScanning, loading]);

  const resetScan = useCallback(() => {
    setScannedProduct(null);
    setIsScanning(true);
  }, []);

  return { scannedProduct, isScanning, loading, handleScan, resetScan };
}
