const GEOFENCE_RADIUS_METERS = 50;

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let message = 'GPS error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const isWithinGeofence = (userLat, userLng, siteLat, siteLng, radiusMeters = GEOFENCE_RADIUS_METERS) => {
  const distance = calculateDistance(userLat, userLng, siteLat, siteLng);
  return {
    withinBounds: distance <= radiusMeters,
    distance: Math.round(distance),
    maxDistance: radiusMeters
  };
};

export const validateSiteProximity = async (siteId) => {
  try {
    const position = await getCurrentPosition();
    
    const response = await fetch('/api/v1.00/gps-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        lat: position.lat,
        lng: position.lng
      })
    });
    
    const result = await response.json();
    
    return {
      valid: result.valid,
      distance: result.distance,
      maxDistance: result.maxDistance,
      position,
      siteName: result.siteName
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

export const autoSuggestSite = async (sites = []) => {
  try {
    const position = await getCurrentPosition();
    
    let nearestSite = null;
    let nearestDistance = Infinity;
    
    for (const site of sites) {
      if (site.lat && site.lng) {
        const distance = calculateDistance(
          position.lat, 
          position.lng, 
          parseFloat(site.lat), 
          parseFloat(site.lng)
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSite = site;
        }
      }
    }
    
    if (nearestSite && nearestDistance <= GEOFENCE_RADIUS_METERS) {
      return {
        suggested: true,
        site: nearestSite,
        distance: Math.round(nearestDistance),
        withinGeofence: true
      };
    } else if (nearestSite) {
      return {
        suggested: true,
        site: nearestSite,
        distance: Math.round(nearestDistance),
        withinGeofence: false
      };
    }
    
    return {
      suggested: false,
      site: null,
      position
    };
  } catch (error) {
    return {
      suggested: false,
      error: error.message
    };
  }
};

export const logLocationAnomaly = async (siteId, userId, overrideData) => {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'technician'
      },
      body: JSON.stringify({
        event_type: 'LOCATION_ANOMALY',
        site_id: siteId,
        actor_user_id: userId,
        payload_json: {
          override_reason: overrideData.reason,
          expected_site: overrideData.expectedSiteId,
          selected_site: siteId,
          distance_from_expected: overrideData.distance,
          user_location: overrideData.userPosition
        }
      })
    });
  } catch (error) {
    console.error('Failed to log location anomaly:', error);
  }
};

export default {
  getCurrentPosition,
  calculateDistance,
  isWithinGeofence,
  validateSiteProximity,
  autoSuggestSite,
  logLocationAnomaly,
  GEOFENCE_RADIUS_METERS
};
