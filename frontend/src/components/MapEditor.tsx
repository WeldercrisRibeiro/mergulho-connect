import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix para marcador padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapEditorProps {
  lat: number;
  lng: number;
  onLatChange: (lat: number) => void;
  onLngChange: (lng: number) => void;
  title?: string;
  height?: string;
  zoom?: number;
  className?: string;
}

export const MapEditor = ({
  lat,
  lng,
  onLatChange,
  onLngChange,
  title = 'Localização',
  height = 'h-[350px]',
  zoom = 16,
  className = '',
}: MapEditorProps) => {
  const coordinates: LatLngExpression = [lat, lng];

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        onLatChange(position.coords.latitude);
        onLngChange(position.coords.longitude);
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {title}
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Latitude</label>
          <Input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => onLatChange(parseFloat(e.target.value) || 0)}
            className="rounded-lg h-9 text-sm"
            placeholder="-3.723844"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Longitude</label>
          <Input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => onLngChange(parseFloat(e.target.value) || 0)}
            className="rounded-lg h-9 text-sm"
            placeholder="-38.584113"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseCurrentLocation}
        className="w-full rounded-lg"
      >
        <MapPin className="h-4 w-4 mr-2" />
        Usar Localização Atual
      </Button>

      <div className={cn('relative rounded-2xl overflow-hidden bg-muted/50 border-2 border-white/20 shadow-lg', height)}>
        <MapContainer
          center={coordinates}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <Marker position={coordinates}>
            <Popup>
              <div className="space-y-1">
                <p className="text-xs font-semibold">Latitude: {lat.toFixed(6)}</p>
                <p className="text-xs font-semibold">Longitude: {lng.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Clique no mapa para mover o marcador ou ajuste os valores de latitude e longitude manualmente.
      </p>
    </div>
  );
};

export default MapEditor;
