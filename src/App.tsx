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

  // LOGIKA PENYIMPANAN DATA
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
    setTimeout(() => setToastMessage(null), 3000); 
  };

  // HANDLER PEMESANAN DARI KOMPONEN FORMULIR
  const handleBookingSubmit = (bookingData: { spotId: string, name: string, vehicleNumber: string, durationMinutes: number }) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      spotId: bookingData.spotId,
      name: bookingData.name,
      vehicleNumber: bookingData.vehicleNumber,
      durationMinutes: bookingData.durationMinutes,
      startTime: Date.now(),
    };

    setBookings([...bookings, newBooking]);
    setSpots(spots.map(s => s.id === bookingData.spotId ? { ...s, isOccupied: true } : s));
    setSelectedSpot(null); // Tutup modal formulir
    showToast(`Pemesanan spot ${bookingData.spotId} berhasil! ✅`);
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
      message: "Peringatan Darurat: Ini akan menghapus total 250 spot dan seluruh pemesanan. Lanjutkan?",
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

  const currentFloorSpots = spots.filter(spot => 
    spot.location === activeFloor && 
    (spot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
     spot.size.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <div className="text-4xl bg-blue-50 p-3 rounded-full">🏢</div>
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
          <div className="flex gap-2 overflow-x-auto mb-4 pb-2 snap-x">
            {floorList.map(floor => (
              <button
                key={floor}
                onClick={() => { setActiveFloor(floor); setSelectedSpot(null); }}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shadow-sm snap-start ${
                  activeFloor === floor
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder={`Cari ukuran atau ID di ${activeFloor}...`} 
            className="w-full p-2 border rounded mb-6 focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="overflow-auto border rounded-lg bg-gray-50 flex justify-center p-2 shadow-inner max-h-[500px] relative">
            {currentFloorSpots.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                Pencarian tidak ditemukan di {activeFloor}
              </div>
            ) : (
              <Stage width={320} height={820}>
                <Layer>
                  {currentFloorSpots.map((spot) => (
                    <React.Fragment key={spot.id}>
                      <Rect
                        x={spot.x}
                        y={spot.y}
                        width={spot.width}
                        height={spot.height}
                        fill={spot.isOccupied ? '#ef4444' : '#22c55e'}
                        stroke={selectedSpot?.id === spot.id ? '#2563eb' : '#374151'}
                        strokeWidth={selectedSpot?.id === spot.id ? 4 : 1}
                        cornerRadius={6}
                        onClick={() => !spot.isOccupied && setSelectedSpot(spot)}
                        onTap={() => !spot.isOccupied && setSelectedSpot(spot)}
                      />
                      <Text
                        x={spot.x + (spot.id.length > 2 ? 6 : 10)} 
                        y={spot.y + 22}
                        text={spot.id}
                        fontSize={14}
                        fill="white"
                        fontStyle="bold"
                        listening={false} 
                      />
                    </React.Fragment>
                  ))}
                </Layer>
              </Stage>
            )}
          </div>
          <p className="text-xs text-center text-gray-500 mt-3">* Geser denah ke atas/bawah untuk melihat 50 spot.</p>
        </div>

        {/* RINCIAN PARKIR AKTIF (SEKARANG MENGISI PENUH KOLOM KANAN) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-xl font-semibold">Parkir Aktif</h2>
              <button onClick={handleHardReset} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-medium transition-colors">
                Reset Semua Data
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 max-h-[600px]">
              {bookings.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Belum ada pemesanan berjalan.</p>}
              {bookings.map(booking => (
                <BookingTimerCard key={booking.id} booking={booking} onEndParking={handleEndParking} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* PEMANGGILAN KOMPONEN FORMULIR TERSENDIRI */}
      {/* ========================================== */}
      {selectedSpot && (
        <BookingFormModal 
          spot={selectedSpot} 
          onClose={() => setSelectedSpot(null)} 
          onSubmit={handleBookingSubmit} 
        />
      )}

      {/* TOAST & MODAL KONFIRMASI */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-40 transition-all duration-300">
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition-colors">Batal</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-semibold shadow-md transition-colors">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. KOMPONEN FORMULIR TERSENDIRI (BARU)
// ==========================================
function BookingFormModal({ spot, onClose, onSubmit }: { spot: ParkingSpot, onClose: () => void, onSubmit: (data: any) => void }) {
  // State form sekarang berada di dalam komponen terpisah
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [duration, setDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ spotId: spot.id, name, vehicleNumber: vehicle, durationMinutes: duration });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">Form Pemesanan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            {/* Ikon Tutup Silang (X) */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-blue-50 p-3 text-blue-800 text-sm rounded-lg border border-blue-200 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">Spot Terpilih</p>
              <strong className="text-2xl">{spot.id}</strong>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 font-medium">📍 {spot.location}</p>
              <p className="text-xs text-blue-600 font-medium">Ukuran: {spot.size}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Nama Lengkap</label>
            <input required type="text" placeholder="Masukkan nama pengendara" className="p-2.5 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Plat Nomor</label>
            <input required type="text" placeholder="Contoh: B 1234 CD" className="p-2.5 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={vehicle} onChange={e => setVehicle(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Durasi (Menit)</label>
            <div className="flex items-center gap-2">
              <input required type="number" min="1" className="p-2.5 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition-colors">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">
              Konfirmasi Pesanan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ==========================================
// 5. KOMPONEN TIMER
// ==========================================
function BookingTimerCard({ booking, onEndParking }: { booking: Booking, onEndParking: (b: string, s: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const targetTime = booking.startTime + (booking.durationMinutes * 60 * 1000);
      setTimeLeft(targetTime - Date.now());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); 
    return () => clearInterval(interval);
  }, [booking]);

  const isOvertime = timeLeft < 0;
  const absTime = Math.abs(timeLeft);

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
