import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const MockView = React.forwardRef((props, ref) => {
    return (
        <View ref={ref} {...props}>
            {props.children}
        </View>
    );
});

MockView.displayName = 'MockMapView';

export const MapView = MockView;
export const Marker = MockView;
export const MapMarker = MockView;
export const Overlay = MockView;
export const MapOverlay = MockView;
export const Polygon = () => null;
export const MapPolygon = () => null;
export const Polyline = () => null;
export const MapPolyline = () => null;
export const Circle = () => null;
export const MapCircle = () => null;
export const Heatmap = () => null;
export const MapHeatmap = () => null;
export const Callout = MockView;
export const MapCallout = MockView;
export const CalloutSubview = MockView;
export const MapCalloutSubview = MockView;
export const UrlTile = () => null;
export const MapUrlTile = () => null;
export const WMSTile = () => null;
export const MapWMSTile = () => null;
export const LocalTile = () => null;
export const MapLocalTile = () => null;
export const Geojson = () => null;

export class AnimatedRegion {
    constructor(init) {
        Object.assign(this, init);
    }
    setValue(init) {
        Object.assign(this, init);
    }
    setOffset() {}
    flattenOffset() {}
    extractOffset() {}
    addListener() { return ''; }
    removeListener() {}
    spring() { return { start: (cb) => cb && cb() }; }
    timing() { return { start: (cb) => cb && cb() }; }
}

export const MarkerAnimated = MockView;
export const OverlayAnimated = MockView;
export const Animated = MockView;

export const MAP_TYPES = {
    STANDARD: 'standard',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain',
    NONE: 'none',
    MUTEDSTANDARD: 'mutedStandard',
};

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

export default MockView;
