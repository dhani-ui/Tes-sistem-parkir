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
  durationMinutes: number;
  startTime: number;
}

// ==========================================
// 2. DATA AWAL
// ==========================================
const initialSpots: ParkingSpot[] = [
  { id: 'A1', x: 20, y: 20, width: 80, height: 120, isOccupied: false, size: 'Kecil', location: 'Lantai 1' },
  { id: 'A2', x: 120, y: 20, width: 80, height: 120, isOccupied: false, size: 'Besar', location: 'Lantai 1' },
  { id: 'A3', x: 220, y: 20, width: 80, height: 120, isOccupied: false, size: 'Kecil', location: 'Lantai 1' },
  { id: 'B1', x: 20, y: 160, width: 80, height: 120, isOccupied: false, size: 'Besar', location: 'Lantai 2' },
  { id: 'B2', x: 120, y: 160, width: 80, height: 120, isOccupied: false, size: 'Kecil', location: 'Lantai 2' },
];

// ==========================================
// 3. KOMPONEN UTAMA
// ==========================================
export default function App() {
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [duration, setDuration] = useState(60);
  
  const [isReady, setIsReady] = useState(false);
  
  // STATE NOTIFIKASI & MODAL KONFIRMASI
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  // LOGIKA PENYIMPANAN DATA
  useEffect(() => {
    try {
      const savedSpots = localStorage.getItem('sistem_parkir_spots');
      const savedBookings = localStorage.getItem('sistem_parkir_bookings');
      
      if (savedSpots) {
        const parsedSpots = JSON.parse(savedSpots);
        if (parsedSpots.length > 0 && parsedSpots[0].width === 0) {
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
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); 
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    const newBooking: Booking = {
      id: Date.now().toString(),
      spotId: selectedSpot.id,
      name,
      vehicleNumber: vehicle,
      durationMinutes: duration,
      startTime: Date.now(),
    };

    setBookings([...bookings, newBooking]);
    setSpots(spots.map(s => s.id === selectedSpot.id ? { ...s, isOccupied: true } : s));
    setSelectedSpot(null);
    setName(''); setVehicle(''); setDuration(60);
    showToast(`Pemesanan spot ${selectedSpot.id} berhasil! ✅`);
  };

  const handleEndParking = (bookingId: string, spotId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin mengakhiri sesi parkir untuk kendaraan di spot ${spotId}?`,
      onConfirm: () => {
        setBookings(bookings.filter(b => b.id !== bookingId));
        setSpots(spots.map(s => s.id === spotId ? { ...s, isOccupied: false } : s));
        showToast(`Sesi parkir ${spotId} telah diakhiri.`);
      }
    });
  };

  const handleHardReset = () => {
    setConfirmDialog({
      isOpen: true,
      message: "Peringatan Darurat: Tindakan ini akan menghapus seluruh data pemesanan yang sedang berjalan. Lanjutkan?",
      onConfirm: () => {
        localStorage.removeItem('sistem_parkir_spots');
        localStorage.removeItem('sistem_parkir_bookings');
        setSpots(initialSpots);
        setBookings([]);
        setSelectedSpot(null);
        showToast("Seluruh data berhasil direset!");
      }
    });
  };

  const totalKapasitas = spots.length;
  const spotTerisi = spots.filter(s => s.isOccupied).length;
  const spotTersedia = totalKapasitas - spotTerisi;

  const filteredSpots = spots.filter(spot => 
    spot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans relative">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-900">Sistem Parkir Modern</h1>

      {/* DASHBOARD RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Kapasitas</p>
            <p className="text-3xl font-black text-gray-800">{totalKapasitas}</p>
          </div>
          <div className="text-4xl bg-blue-50 p-3 rounded-full">🅿️</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Tersedia</p>
            <p className="text-3xl font-black text-gray-800">{spotTersedia}</p>
          </div>
          <div className="text-4xl bg-green-50 p-3 rounded-full">✅</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Terisi</p>
            <p className="text-3xl font-black text-gray-800">{spotTerisi}</p>
          </div>
          <div className="text-4xl bg-red-50 p-3 rounded-full">🚗</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DENAH PARKIR (KONVA) */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <input 
            type="text" 
            placeholder="Cari lokasi (Lantai 1) atau ukuran..." 
            className="w-full p-2 border rounded mb-6 focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="overflow-x-auto border rounded-lg bg-gray-50 flex justify-center p-4 shadow-inner">
            <Stage width={320} height={300}>
              <Layer>
                {filteredSpots.map((spot) => (
                  <React.Fragment key={spot.id}>
                    <Rect
                      x={spot.x}
                      y={spot.y}
                      width={spot.width}
                      height={spot.height}
                      fill={spot.isOccupied ? '#ef4444' : '#22c55e'}
                      stroke={selectedSpot?.id === spot.id ? '#2563eb' : '#374151'}
                      strokeWidth={selectedSpot?.id === spot.id ? 4 : 1}
                      cornerRadius={8}
                      onClick={() => !spot.isOccupied && setSelectedSpot(spot)}
                      onTap={() => !spot.isOccupied && setSelectedSpot(spot)}
                    />
                    <Text
                      x={spot.x + 22}
                      y={spot.y + 45}
                      text={spot.id}
                      fontSize={24}
                      fill="white"
                      fontStyle="bold"
                      listening={false} 
                    />
                  </React.Fragment>
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* FORMULIR & RINCIAN */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Form Pemesanan</h2>
            {selectedSpot ? (
              <form onSubmit={handleBooking} className="flex flex-col gap-3">
                <div className="bg-blue-50 p-2 text-blue-800 text-sm rounded border border-blue-200">
                  Spot terpilih: <strong className="text-lg">{selectedSpot.id}</strong>
                </div>
                <input required type="text" placeholder="Nama Lengkap" className="p-2 border rounded" value={name} onChange={e => setName(e.target.value)} />
                <input required type="text" placeholder="Plat Nomor (B 1234 CD)" className="p-2 border rounded" value={vehicle} onChange={e => setVehicle(e.target.value)} />
                <div className="flex items-center gap-2">
                  <input required type="number" min="1" className="p-2 border rounded w-full" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                  <span className="text-gray-600 text-sm font-medium">Menit</span>
                </div>
                <button type="submit" className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 transition-colors">
                  Pesan Tempat
                </button>
              </form>
            ) : (
              <div className="text-gray-500 text-sm text-center bg-gray-50 p-4 rounded border border-dashed">
                Pilih area hijau pada denah terlebih dahulu.
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-xl font-semibold">Parkir Aktif</h2>
              <button onClick={handleHardReset} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-medium">
                Reset Data
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {bookings.length === 0 && <p className="text-sm text-gray-500 text-center">Belum ada pemesanan.</p>}
              {bookings.map(booking => (
                <BookingTimerCard key={booking.id} booking={booking} onEndParking={handleEndParking} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 5. KOMPONEN TOAST NOTIFICATION */}
      {/* ========================================== */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-40 transition-all duration-300">
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. MODAL KONFIRMASI CUSTOM */}
      {/* ========================================== */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Tindakan</h3>
            <p className="text-gray-600 mb-6 text-sm">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-semibold shadow-md transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 4. KOMPONEN TIMER (DENGAN DETIK)
// ==========================================
function BookingTimerCard({ booking, onEndParking }: { booking: Booking, onEndParking: (b: string, s: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const targetTime = booking.startTime + (booking.durationMinutes * 60 * 1000);
      setTimeLeft(targetTime - Date.now());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update setiap 1 detik
    return () => clearInterval(interval);
  }, [booking]);

  const isOvertime = timeLeft < 0;
  const absTime = Math.abs(timeLeft);

  // Perhitungan Jam, Menit, dan Detik
  const s = Math.floor((absTime / 1000) % 60).toString().padStart(2, '0');
  const m = Math.floor((absTime / 60000) % 60).toString().padStart(2, '0');
  const h = Math.floor((absTime / 3600000) % 24).toString().padStart(2, '0');

  return (
    <div className={`p-4 border rounded-lg shadow-sm transition-colors ${isOvertime ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-black text-xl text-gray-800">{booking.spotId}</span>
          <p className="text-sm font-bold text-gray-700 mt-1">{booking.vehicleNumber}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{booking.name}</p>
        </div>
        <div className={`text-right font-mono font-bold ${isOvertime ? 'text-red-600' : 'text-blue-600'}`}>
          <div className="text-[10px] uppercase font-sans font-bold tracking-wider mb-1">
            {isOvertime ? 'Overtime' : 'Sisa Waktu'}
          </div>
          <div className="text-lg bg-gray-100 px-2 py-1 rounded shadow-inner">
            {h}:{m}:{s}
          </div>
        </div>
      </div>
      <button 
        onClick={() => onEndParking(booking.id, booking.spotId)} 
        className="w-full bg-gray-800 text-white text-xs font-bold tracking-wider py-2.5 rounded-md hover:bg-black transition-colors"
      >
        AKHIRI SESI PARKIR
      </button>
    </div>
  );
}
