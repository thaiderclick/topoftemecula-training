import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface MapStop {
  businessId: string;
  status: "pending" | "done" | "skipped";
  name: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * In-app route map: numbered stop markers (green when done), the route drawn
 * through the remaining stops, and a follow-me live-location control. Falls
 * back to nothing if the Mapbox token is missing — the list view always works.
 */
export function RouteMap({ stops, selected, onSelect }: {
  stops: MapStop[];
  selected: string | null;
  onSelect: (businessId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-117.1484, 33.4936], // Old Town Temecula until stops load
      zoom: 11,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Markers + route line track the stops.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const located = stops.filter((s) => s.lat != null && s.lng != null);
      located.forEach((s) => {
        const i = stops.indexOf(s);
        const el = document.createElement("div");
        el.style.cssText =
          "width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
          "font:bold 12px sans-serif;color:white;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer;" +
          `background:${s.status === "done" ? "#059669" : s.status === "skipped" ? "#94a3b8" : s.businessId === selected ? "#b45309" : "#d97706"};`;
        el.textContent = s.status === "done" ? "✓" : String(i + 1);
        el.addEventListener("click", () => onSelectRef.current(s.businessId));
        const marker = new mapboxgl.Marker({ element: el }).setLngLat([s.lng!, s.lat!]).addTo(map);
        markersRef.current.push(marker);
      });

      // Route line through the pending stops, in order.
      const path = stops
        .filter((s) => s.status === "pending" && s.lat != null && s.lng != null)
        .map((s) => [s.lng!, s.lat!] as [number, number]);
      const data: GeoJSON.Feature = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: path.length >= 2 ? path : [] },
      };
      const src = map.getSource("route-line") as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(data);
      } else {
        map.addSource("route-line", { type: "geojson", data });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-line",
          paint: { "line-color": "#d97706", "line-width": 3, "line-dasharray": [2, 1.5], "line-opacity": 0.7 },
        });
      }

      if (located.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        located.forEach((s) => bounds.extend([s.lng!, s.lat!]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 400 });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stops.map((s) => [s.businessId, s.status, s.lat, s.lng])), selected]);

  if (!TOKEN) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Map unavailable — VITE_MAPBOX_TOKEN is not configured. The list view has everything.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-[360px] rounded-xl overflow-hidden border border-border" />;
}
