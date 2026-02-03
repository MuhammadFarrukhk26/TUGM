const GOOGLE_API_KEY = 'AIzaSyCl0rDFY5DeIhBtPkqwrZOh1_izpzA3mls';

export const geocodeAddress = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        return {
            latitude: location.lat,
            longitude: location.lng,
            components: data.results[0].address_components,
        };
    }
    return null;
};

export const reverseGeocode = async (lat, lng) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK') {
        return data.results[0];
    }
    return null;
};
