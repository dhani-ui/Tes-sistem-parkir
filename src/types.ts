export interface ParkingSpot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  size: 'Kecil' | 'Besar';
  location: string;
}

export interface Booking {
  id: string;
  spotId: string;
  name: string;
  vehicleNumber: string;
  durationMinutes: number;
  startTime: number;
}
