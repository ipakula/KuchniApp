import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface DatePickerModalProps {
  visible: boolean;
  value: Date | null;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const ITEM_H = 44;

function Column({
  items,
  selectedIndex,
  onSelect,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const ref = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
  }, []);

  return (
    <View style={col.wrap}>
      {/* highlight bar */}
      <View pointerEvents="none" style={col.highlight} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(Math.max(0, Math.min(idx, items.length - 1)));
        }}
      >
        {items.map((label, i) => (
          <Pressable key={i} style={col.item} onPress={() => {
            ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
            onSelect(i);
          }}>
            <Text style={[col.itemText, i === selectedIndex && col.itemTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const col = StyleSheet.create({
  wrap: { flex: 1, height: ITEM_H * 5, overflow: 'hidden' },
  highlight: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    zIndex: 0,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, color: Colors.textSecondary },
  itemTextActive: { fontSize: 17, fontWeight: '700', color: Colors.primary },
});

export function DatePickerModal({ visible, value, minimumDate, onConfirm, onCancel }: DatePickerModalProps) {
  const now = new Date();
  const initial = value || minimumDate || now;

  const [day, setDay] = useState(initial.getDate() - 1);
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear] = useState(initial.getFullYear() - now.getFullYear());

  const minYear = minimumDate ? minimumDate.getFullYear() : now.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(minYear + i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const handleConfirm = () => {
    const selectedYear = minYear + year;
    const selectedMonth = month;
    const selectedDay = Math.min(day + 1, new Date(selectedYear, selectedMonth + 1, 0).getDate());
    onConfirm(new Date(selectedYear, selectedMonth, selectedDay));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={onCancel}>
            <Text style={styles.cancelBtn}>Anuluj</Text>
          </Pressable>
          <Text style={styles.title}>Data ważności</Text>
          <Pressable onPress={handleConfirm}>
            <Text style={styles.confirmBtn}>Gotowe</Text>
          </Pressable>
        </View>

        <View style={styles.columns}>
          <Column items={days} selectedIndex={day} onSelect={setDay} />
          <Column items={MONTHS} selectedIndex={month} onSelect={setMonth} />
          <Column items={years} selectedIndex={year} onSelect={setYear} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cancelBtn: { fontSize: 15, color: Colors.textSecondary },
  confirmBtn: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  columns: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
