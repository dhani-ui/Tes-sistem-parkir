import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

// ==========================================
// 1. TIPE DATA
// ==========================================
interface ParkingSpot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  size: 'Kecil' | 'Besar';
  location: string;
}

interface Booking {
  id: string;
  spotId: string;
  name: string;
  vehicleNumber: string;
  phone?: string; 
  durationMinutes: number;
  startTime: number;
  hasReminderSent?: boolean; 
}

// ==========================================
// 2. FUNGSI GENERATOR GRID (50 Spot/Lantai)
// ==========================================
const generateSpots = (): ParkingSpot[] => {
  const floors = ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Lantai 5'];
  const prefixes = ['A', 'B', 'C', 'D', 'E'];
  const newSpots: ParkingSpot[] = [];
  const cols = 5; 
  const spotWidth = 45;
  const spotHeight = 60;
  const paddingX = 15;
  const paddingY = 20;
  const startX = 15;
  const startY = 15;

  floors.forEach((floor, fIndex) => {
    const prefix = prefixes[fIndex];
    for (let i = 0; i < 50; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      newSpots.push({
        id: `${prefix}${i + 1}`,
        x: startX + col * (spotWidth + paddingX),
        y: startY + row * (spotHeight + paddingY),
        width: spotWidth,
        height: spotHeight,
        isOccupied: false,
        size: (i % 2 === 0) ? 'Kecil' : 'Besar',
        location: floor
      });
    }
  });
  return newSpots;
};

const initialSpots = generateSpots();
const floorList = ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Lantai 5'];

// ==========================================
// 3. KOMPONEN UTAMA (App)
// ==========================================
export default function App() {
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFloor, setActiveFloor] = useState('Lantai 1');
  const [isReady, setIsReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    try {
      const savedSpots = localStorage.getItem('sistem_parkir_spots');
      const savedBookings = localStorage.getItem('sistem_parkir_bookings');
      
      if (savedSpots) {
        const parsedSpots = JSON.parse(savedSpots);
        if (parsedSpots.length < 250 || parsedSpots[0].width === 0) {
          setSpots(initialSpots);
        } else {
          setSpots(parsedSpots);
        }
      }
      if (savedBookings) setBookings(JSON.parse(savedBookings));
    } catch (error) {
      localStorage.removeItem('sistem_parkir_spots');
      localStorage.removeItem('sistem_parkir_bookings');
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      localStorage.setItem('sistem_parkir_spots', JSON.stringify(spots));
      localStorage.setItem('sistem_parkir_bookings', JSON.stringify(bookings));
    }
  }, [spots, bookings, isReady]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000); 
  };

  // HANDLER PEMESANAN MASUK
  const handleBookingSubmit = async (bookingData: { spotId: string, name: string, vehicleNumber: string, durationMinutes: number, phone: string }) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      spotId: bookingData.spotId,
      name: bookingData.name,
      vehicleNumber: bookingData.vehicleNumber,
      phone: bookingData.phone,
      durationMinutes: bookingData.durationMinutes,
      startTime: Date.now(),
      hasReminderSent: false, 
    };

    setBookings([...bookings, newBooking]);
    setSpots(spots.map(s => s.id === bookingData.spotId ? { ...s, isOccupied: true } : s));
    setSelectedSpot(null);
    showToast(`Pemesanan spot ${bookingData.spotId} berhasil! ✅`);

    if (bookingData.phone) {
      const waMessage = `*SISTEM PARKIR MODERN*\n\nHalo *${bookingData.name}*,\nTerima kasih telah menggunakan layanan kami. Rincian tiket masuk Anda:\n\n📍 Spot: *${bookingData.spotId}*\n🚗 Plat: *${bookingData.vehicleNumber}*\n⏱️ Estimasi Durasi: *${bookingData.durationMinutes} Menit*\n\n_Sistem
