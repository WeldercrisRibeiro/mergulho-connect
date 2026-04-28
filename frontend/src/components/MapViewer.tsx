import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { ExternalLink, MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix para marcador padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewerProps {
  lat?: number;
  lng?: number;
  title?: string;
  address?: string;
  height?: string;
  zoom?: number;
  showControls?: boolean;
  className?: string;
  showOpenInMapsButton?: boolean;
}

export const MapViewer = ({
  lat = -3.723844,
  lng = -38.584113,
  title = 'Igreja Cristã Aba Pai',
  address = 'Rua Rio Paraguai, 534 - Fortaleza, CE',
  height = 'h-[350px]',
  zoom = 16,
  showControls = true,
  className = '',
  showOpenInMapsButton = true,
}: MapViewerProps) => {
  const LeafletMapContainer = MapContainer as any;
  const LeafletTileLayer = TileLayer as any;
  const coordinates: LatLngExpression = [lat, lng];

  const handleOpenInGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  const handleOpenInWaze = () => {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
  };

  return (
    <div className={cn('relative rounded-3xl overflow-hidden bg-muted/50 border-2 border-white/20 shadow-xl', height, className)}>
      {/* Mapa */}
      <LeafletMapContainer
        center={coordinates}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <LeafletTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <Marker position={coordinates}>
          <Popup>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground">{address}</p>
            </div>
          </Popup>
        </Marker>
      </LeafletMapContainer>

      {/* Overlay com controles */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/50">
            <div className="flex flex-col">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-none hover:bg-primary/10 border-b border-white/20"
                onClick={() => {
                  // O zoom nativo do Leaflet já está ativo via ZoomControl
                }}
                title="Ampliar"
              >
                <ZoomIn className="h-4 w-4 text-primary" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-none hover:bg-primary/10"
                onClick={() => {
                  // Usar zoom out do Leaflet
                }}
                title="Reduzir"
              >
                <ZoomOut className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botões de ação no canto inferior */}
      {showOpenInMapsButton && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2 flex-col sm:flex-row">
          <Button
            size="sm"
            className="rounded-full bg-white/90 text-primary hover:bg-white shadow-lg border border-white/50 gap-2"
            onClick={handleOpenInGoogleMaps}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Google Maps</span>
            <span className="sm:hidden">Abrir</span>
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-white/90 text-primary hover:bg-white shadow-lg border border-white/50 gap-2"
            onClick={handleOpenInWaze}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Waze</span>
            <span className="sm:hidden">Waze</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MapViewer;
