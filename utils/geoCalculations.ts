/**
 * Utility functions for Geodesic GPS calculations:
 * - Spherical excess polygon area (Acres & Hectares)
 * - Haversine distance & perimeter
 * - Centroid calculation
 */

export interface LatLng {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_METERS = 6378137; // WGS84 Major Axis Radius

/**
 * Calculates geodesic distance between two points in meters using Haversine formula
 */
export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
    const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    const lat1 = (p1.latitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates total perimeter of a polygon in meters
 */
export function calculatePerimeterMeters(points: LatLng[]): number {
    if (!points || points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
        const nextIdx = (i + 1) % points.length;
        // If not closed yet and at last point, don't wrap unless closed
        if (i === points.length - 1 && points.length < 3) break;
        perimeter += haversineDistanceMeters(points[i], points[nextIdx]);
    }
    return Math.round(perimeter);
}

/**
 * Calculates the geodesic area of a polygon on the WGS-84 sphere in square meters
 * using the spherical excess / Chamberlain-Duquette algorithm.
 */
export function calculatePolygonAreaSqMeters(points: LatLng[]): number {
    if (!points || points.length < 3) return 0;

    let total = 0;
    const len = points.length;

    for (let i = 0; i < len; i++) {
        const prev = points[(i + len - 1) % len];
        const next = points[(i + 1) % len];

        const latRad = (points[i].latitude * Math.PI) / 180;
        const lonDiffRad = ((next.longitude - prev.longitude) * Math.PI) / 180;

        total += lonDiffRad * Math.sin(latRad);
    }

    const area = (Math.abs(total) * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2;
    return area;
}

/**
 * Converts square meters to Acres (1 sq meter = 0.000247105381 acres)
 */
export function sqMetersToAcres(sqMeters: number): number {
    return sqMeters * 0.000247105381;
}

/**
 * Converts square meters to Hectares (1 ha = 10,000 sq meters)
 */
export function sqMetersToHectares(sqMeters: number): number {
    return sqMeters / 10000;
}

/**
 * Converts Hectares to Acres
 */
export function hectaresToAcres(ha: number): number {
    return ha * 2.47105381;
}

/**
 * Computes arithmetic centroid of points
 */
export function calculateCentroid(points: LatLng[]): LatLng {
    if (!points || points.length === 0) {
        return { latitude: 10.5105, longitude: 7.4165 };
    }
    const sum = points.reduce(
        (acc, p) => ({
            latitude: acc.latitude + p.latitude,
            longitude: acc.longitude + p.longitude,
        }),
        { latitude: 0, longitude: 0 }
    );
    return {
        latitude: sum.latitude / points.length,
        longitude: sum.longitude / points.length,
    };
}
