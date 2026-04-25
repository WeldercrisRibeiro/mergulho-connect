# 🗺️ Integração de Mapas - Guia de Uso

## Visão Geral

Substituímos o Google Maps iframe embed por uma solução com **Leaflet + OpenStreetMap**, que oferece:

✅ **Gratuito** - sem necessidade de API key  
✅ **Responsivo** - funciona perfeitamente em mobile  
✅ **Interativo** - zoom, pan, marcadores  
✅ **Customizável** - fácil de adaptar ao design  
✅ **Rápido** - carregamento otimizado  

---

## Componentes Disponíveis

### 1. **MapViewer** - Visualização de Mapa

Exibe um mapa com marcador, ideal para páginas públicas como Landing, eventos, etc.

#### Uso Básico

```tsx
import MapViewer from "@/components/MapViewer";

<MapViewer
  lat={-3.723844}
  lng={-38.584113}
  title="Igreja Cristã Aba Pai"
  address="Rua Rio Paraguai, 534 - Fortaleza, CE"
  height="h-[350px]"
  zoom={16}
  showControls={true}
  showOpenInMapsButton={true}
/>
```

#### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `lat` | number | -3.723844 | Latitude |
| `lng` | number | -38.584113 | Longitude |
| `title` | string | "Igreja Cristã Aba Pai" | Título do marcador |
| `address` | string | "..." | Endereço exibido no popup |
| `height` | string | "h-[350px]" | Altura (Tailwind class) |
| `zoom` | number | 16 | Nível de zoom inicial |
| `showControls` | boolean | true | Exibir botões de zoom |
| `showOpenInMapsButton` | boolean | true | Exibir botões Google Maps/Waze |
| `className` | string | "" | Classes Tailwind adicionais |

#### Exemplo - Landing Page

```tsx
<MapViewer
  lat={-3.723844}
  lng={-38.584113}
  title="Igreja Cristã Aba Pai"
  address="Rua Rio Paraguai, 534 - Jardim Iracema, Fortaleza - CE, 60341-270"
  height="h-[250px] md:h-[350px]"
  className="mb-8"
/>
```

---

### 2. **MapEditor** - Editor de Coordenadas

Componente para editar coordenadas com visualização ao vivo, ideal para painel administrativo.

#### Uso Básico

```tsx
import MapEditor from "@/components/MapEditor";
import { useState } from "react";

export default function SettingsMap() {
  const [lat, setLat] = useState(-3.723844);
  const [lng, setLng] = useState(-38.584113);

  return (
    <MapEditor
      lat={lat}
      lng={lng}
      onLatChange={setLat}
      onLngChange={setLng}
      title="Localização da Igreja"
      height="h-[400px]"
      zoom={16}
    />
  );
}
```

#### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `lat` | number | Latitude atual |
| `lng` | number | Longitude atual |
| `onLatChange` | (lat: number) => void | Callback quando latitude muda |
| `onLngChange` | (lng: number) => void | Callback quando longitude muda |
| `title` | string | Título do label |
| `height` | string | Altura do mapa (Tailwind) |
| `zoom` | number | Nível de zoom |
| `className` | string | Classes adicionais |

#### Recursos

- 🎯 Editar coordenadas manualmente (inputs numéricos)
- 📍 Botão "Usar Localização Atual" (geolocation)
- 🗺️ Visualização ao vivo do mapa
- 🔍 Zoom intuitivo

---

## Como Implementar nos Eventos (Agenda)

Se você quer exibir um mapa para eventos:

```tsx
import MapViewer from "@/components/MapViewer";
import { parseEventCoordinates } from "@/lib/mapUtils";

// No componente de detalhe do evento
const [mapData] = useState(() => {
  if (!event.mapUrl) return null;
  return parseEventCoordinates(event.mapUrl);
});

{mapData && (
  <MapViewer
    lat={mapData.lat}
    lng={mapData.lng}
    title={event.title}
    address={event.location}
    height="h-[300px]"
    zoom={15}
  />
)}
```

---

## Como Configurar em Settings

Para adicionar edição de coordenadas na página Settings:

```tsx
import MapEditor from "@/components/MapEditor";
import { useState } from "react";

export function SettingsSection() {
  const [lat, setLat] = useState(siteSettings?.lat || -3.723844);
  const [lng, setLng] = useState(siteSettings?.lng || -38.584113);

  const handleSave = async () => {
    await api.patch("/settings", { lat, lng });
  };

  return (
    <div className="space-y-4">
      <MapEditor
        lat={lat}
        lng={lng}
        onLatChange={setLat}
        onLngChange={setLng}
        height="h-[400px]"
      />
      <Button onClick={handleSave}>Salvar Localização</Button>
    </div>
  );
}
```

---

## Melhorias Comparadas ao Google Maps Embed

| Feature | Google Maps Embed | MapViewer (Leaflet) |
|---------|------------------|-------------------|
| API Key Necessária | ✅ Sim | ❌ Não |
| Custo | 💰 Pago (após limite) | 🆓 Gratuito |
| Mobile Responsivo | ⚠️ Limitado | ✅ Excelente |
| Zoom/Pan | ✅ Sim | ✅ Sim |
| Botões Customizados | ❌ Não | ✅ Sim |
| Integração com Waze | ❌ Não | ✅ Sim |
| Perfomance | ⚠️ Moderada | ✅ Rápida |
| Customização CSS | ❌ Limitada | ✅ Completa |

---

## Solução de Problemas

### ❌ Marcador não aparece

Verifique se Leaflet.css foi importado em `main.tsx`:

```tsx
import "./styles/leaflet-custom.css";
```

### ❌ Mapa não funciona offline

Leaflet + OpenStreetMap precisa de internet. Para funcionar offline, será necessário usar tiles locais.

### ❌ Zoom muito lento em mobile

Reduzir o nível de `zoom` inicial ajuda. Considere usar `zoom={14}` em vez de `zoom={16}`.

### ❌ Estilo de tema não aplica

Certifique-se de que o arquivo `leaflet-custom.css` está sendo importado e que as variáveis CSS de tema estão disponíveis (`:root { --background, --primary, etc... }`).

---

## URLs Úteis para Testes

### Gerar Coordenadas
- Google Maps: https://maps.google.com
- OpenStreetMap: https://www.openstreetmap.org

### Formato de Coordenadas
- **Latitude**: -3.723844 (Sul é negativo)
- **Longitude**: -38.584113 (Oeste é negativo)

### Exemplo de URL do Google Maps para extrair coordenadas
```
https://www.google.com/maps/place/Igreja+Crist%C3%A3+Aba+Pai
Coordenadas: -3.723844, -38.584113
```

---

## Arquivos de Referência

- Componente MapViewer: `frontend/src/components/MapViewer.tsx`
- Componente MapEditor: `frontend/src/components/MapEditor.tsx`
- CSS Customizado: `frontend/src/styles/leaflet-custom.css`
- Uso na Landing: `frontend/src/pages/Landing.tsx` (linha ~305)

---

## Próximas Melhorias (Roadmap)

- [ ] Suporte para múltiplos marcadores
- [ ] Desenhar rotas entre pontos
- [ ] Geocodificação reversa (endereço → coordenadas)
- [ ] Cache de tiles offline
- [ ] Integração com Leaflet-routing-machine
