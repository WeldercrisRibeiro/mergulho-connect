import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { ExternalLink, MapPin, ZoomIn, ZoomOut, Star, Navigation, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix para marcador padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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

      {/* Cartão de Informações Estilo Google Maps */}
      <div className="absolute top-4 left-4 z-[1000] w-[280px] sm:w-[320px] bg-white rounded-lg shadow-2xl overflow-hidden pointer-events-auto border border-black/5 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h3>
              <p className="text-xs text-gray-500 leading-normal">{address}</p>
            </div>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Navigation className="h-5 w-5 fill-current" />
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-orange-500">5,0</span>
            <div className="flex text-orange-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <span className="text-blue-600 hover:underline cursor-pointer">(8)</span>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
            <button 
              onClick={handleOpenInGoogleMaps}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-2 bg-blue-600 rounded-full text-white shadow-md group-hover:bg-blue-700 transition-colors">
                <Navigation className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-blue-600">Rotas</span>
            </button>
            <button 
              onClick={() => window.open('https://ccmergulho.vercel.app', '_blank')}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-2 border border-gray-200 rounded-full text-blue-600 group-hover:bg-gray-50 transition-colors">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-blue-600">Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Zoom Customizados */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
          <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
            <button
              className="p-2 hover:bg-gray-50 text-gray-600 transition-colors border-b border-gray-100"
              onClick={() => {
                // Zoom handled by Leaflet ZoomControl or hidden
              }}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
              onClick={() => {
                // Zoom handled by Leaflet ZoomControl or hidden
              }}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
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
