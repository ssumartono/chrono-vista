export type ManualLocation = {
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  precision: 'approximate' | 'city';
  visibility: 'Private';
};

export function parseManualLocation(input: { label: string; latitude: string; longitude: string }): { location: ManualLocation; error?: never } | { location?: never; error: string } {
  const label = input.label.trim().slice(0, 160);
  const latitudeText = input.latitude.trim();
  const longitudeText = input.longitude.trim();
  if (Boolean(latitudeText) !== Boolean(longitudeText)) return { error: 'Isi lintang dan bujur bersama-sama, atau kosongkan keduanya.' };
  if (!label && !latitudeText) return { error: 'Isi nama tempat atau koordinat.' };
  const latitude = latitudeText ? Number(latitudeText) : null;
  const longitude = longitudeText ? Number(longitudeText) : null;
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) return { error: 'Lintang harus antara -90 dan 90.' };
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) return { error: 'Bujur harus antara -180 dan 180.' };
  return { location: { label: label || null, latitude, longitude, precision: latitude === null ? 'city' : 'approximate', visibility: 'Private' } };
}
