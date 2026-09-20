export type MapPoint = { latitude: number; longitude: number };

export function distanceMeters(a: MapPoint, b: MapPoint) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = radians(b.latitude - a.latitude);
  const deltaLongitude = radians(b.longitude - a.longitude);
  const latitudeA = radians(a.latitude);
  const latitudeB = radians(b.latitude);
  const arc = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}
