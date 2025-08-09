export const searchableFields = ['message']

export const filterableFields = ['category', 'subCategory']


export const calculateDistance = (
    userCoords: [number, number], // [lon, lat]
    businessCoords: [number, number], // [lon, lat]
    unit: 'km' | 'mi' = 'km'
  ): number => {
    const toRad = (degrees: number) => degrees * (Math.PI / 180);
    const R = unit === 'mi' ? 3958.8 : 6371; // Earth radius in miles or km
  
    const lat1 = toRad(userCoords[1]); // user latitude
    const lat2 = toRad(businessCoords[1]); // business latitude
    const deltaLat = toRad(businessCoords[1] - userCoords[1]);
    const deltaLon = toRad(businessCoords[0] - userCoords[0]);
  
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return Number(distance.toFixed(2)); // e.g., 5.23 km
  };