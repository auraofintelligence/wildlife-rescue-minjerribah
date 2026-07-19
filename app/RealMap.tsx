"use client";

import { layers, namedFlavor } from "@protomaps/basemaps";
import {
  Eye,
  EyeOff,
  Layers3,
  LocateFixed,
  Navigation,
  PawPrint,
  Route,
  Tags,
} from "lucide-react";
import maplibregl, {
  type GeoJSONSource,
  type LngLatLike,
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useState } from "react";
import type { CaseRecord, Position } from "./page";

const ISLAND_BOUNDS: [[number, number], [number, number]] = [
  [153.35, -27.78],
  [153.57, -27.3],
];

const INITIAL_CENTRE: [number, number] = [153.47, -27.46];
const INITIAL_ZOOM = 10.55;

const QUEENSLAND_IMAGERY =
  "https://spatial-img.information.qld.gov.au/arcgis/rest/services/Basemaps/LatestStateProgram_AllUsers/ImageServer/tile/{z}/{y}/{x}";

function createMapStyle(): StyleSpecification {
  const flavour = {
    ...namedFlavor("light"),
    background: "#c8e0e2",
    earth: "#f0ecdf",
    water: "#9acdd1",
    beach: "#eee3c4",
    sand: "#e8ddbd",
    park_a: "#d7e5d4",
    park_b: "#b8d3b6",
    wood_a: "#cfdfcc",
    wood_b: "#a8c9a7",
    scrub_a: "#d9e1cc",
    scrub_b: "#b7cba9",
    buildings: "#d6cfc2",
    minor_a: "#f7f4ed",
    minor_b: "#ffffff",
    major: "#fffdf7",
    highway: "#fffaf0",
    roads_label_minor: "#677872",
    roads_label_minor_halo: "#fffdf7",
    roads_label_major: "#435c55",
    roads_label_major_halo: "#fffdf7",
    ocean_label: "#477e83",
    subplace_label: "#47635c",
    subplace_label_halo: "#f4f1e8",
    city_label: "#264b42",
    city_label_halo: "#f4f1e8",
  };

  const fieldLayers = layers("protomaps", flavour, { lang: "en" });
  const [backgroundLayer, ...detailLayers] = fieldLayers;

  return {
    version: 8,
    glyphs: `${window.location.origin}/maps/fonts/{fontstack}/{range}.pbf`,
    sprite: `${window.location.origin}/maps/sprites/light`,
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${window.location.origin}/maps/minjerribah.pmtiles`,
        attribution:
          '<a href="https://github.com/protomaps/basemaps">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
      "qld-imagery": {
        type: "raster",
        tiles: [QUEENSLAND_IMAGERY],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 20,
        attribution:
          "Imagery © State of Queensland; © Planet Labs Netherlands B.V., Planet and Geoplex",
      },
    },
    layers: [
      backgroundLayer,
      {
        id: "qld-aerial",
        type: "raster",
        source: "qld-imagery",
        layout: { visibility: "visible" },
        paint: {
          "raster-fade-duration": 240,
          "raster-saturation": -0.08,
          "raster-contrast": 0.06,
        },
      },
      ...detailLayers,
    ],
  };
}

function applyMapLayers(
  map: MapLibreMap,
  showRoads: boolean,
  showLabels: boolean,
  aerialReady: boolean,
) {
  map.setLayoutProperty(
    "qld-aerial",
    "visibility",
    aerialReady ? "visible" : "none",
  );

  map.getStyle().layers.forEach((layer) => {
    if (!("source" in layer) || layer.source !== "protomaps") return;

    const isRoad = layer.id.startsWith("roads_");
    const isLabel = layer.type === "symbol";
    const visibility =
      (isRoad && !showRoads) ||
      (isLabel && !showLabels) ||
      (aerialReady && !isRoad && !isLabel)
        ? "none"
        : "visible";

    map.setLayoutProperty(layer.id, "visibility", visibility);
  });
}

function accuracyArea(position: Position) {
  const points: number[][] = [];
  const earthRadius = 6_378_137;
  const latitudeRadians = (position.latitude * Math.PI) / 180;

  for (let index = 0; index <= 64; index += 1) {
    const angle = (index / 64) * Math.PI * 2;
    const east = Math.cos(angle) * position.accuracy;
    const north = Math.sin(angle) * position.accuracy;
    const longitude =
      position.longitude +
      (east / (earthRadius * Math.cos(latitudeRadians))) * (180 / Math.PI);
    const latitude =
      position.latitude + (north / earthRadius) * (180 / Math.PI);
    points.push([longitude, latitude]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [points],
    },
  };
}

function isOnMinjerribah(latitude: number, longitude: number) {
  return (
    longitude >= ISLAND_BOUNDS[0][0] &&
    longitude <= ISLAND_BOUNDS[1][0] &&
    latitude >= ISLAND_BOUNDS[0][1] &&
    latitude <= ISLAND_BOUNDS[1][1]
  );
}

export function RealMap({
  livePosition,
  locationEnabled,
  locationMessage,
  onToggleLocation,
  cases,
}: {
  livePosition: Position | null;
  locationEnabled: boolean;
  locationMessage: string;
  onToggleLocation: () => void;
  cases: CaseRecord[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const protocolRef = useRef<Protocol | null>(null);
  const liveMarkerRef = useRef<Marker | null>(null);
  const caseMarkersRef = useRef<Marker[]>([]);
  const centredOnReporterRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [aerialReady, setAerialReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showCases, setShowCases] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const protocol = new Protocol();
    protocolRef.current = protocol;
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(),
      center: INITIAL_CENTRE,
      zoom: INITIAL_ZOOM,
      maxBounds: ISLAND_BOUNDS,
      minZoom: INITIAL_ZOOM,
      maxZoom: 16,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    map.on("load", () => {
      map.addSource("reporter-accuracy", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addLayer({
        id: "reporter-accuracy-fill",
        type: "fill",
        source: "reporter-accuracy",
        paint: {
          "fill-color": "#236ee8",
          "fill-opacity": 0.13,
        },
      });
      map.addLayer({
        id: "reporter-accuracy-line",
        type: "line",
        source: "reporter-accuracy",
        paint: {
          "line-color": "#236ee8",
          "line-opacity": 0.42,
          "line-width": 1.5,
        },
      });
      setAerialReady(true);
      setMapReady(true);
    });

    map.on("sourcedata", (event) => {
      if (
        event.sourceId === "qld-imagery" &&
        (event.isSourceLoaded || event.sourceDataType === "content")
      ) {
        setAerialReady(true);
        setMapError("");
      }
    });

    map.on("error", (event) => {
      if (
        "sourceId" in event &&
        event.sourceId === "qld-imagery"
      ) {
        setMapError(
          "Aerial imagery is unavailable. The backup field map is now showing.",
        );
        setAerialReady(false);
      }
    });

    mapRef.current = map;

    return () => {
      caseMarkersRef.current.forEach((marker) => marker.remove());
      caseMarkersRef.current = [];
      liveMarkerRef.current?.remove();
      liveMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      maplibregl.removeProtocol("pmtiles");
      protocolRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (aerialReady) setMapError("");
    applyMapLayers(map, showRoads, showLabels, aerialReady);
  }, [aerialReady, mapReady, showLabels, showRoads]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    caseMarkersRef.current.forEach((marker) => marker.remove());
    caseMarkersRef.current = [];

    cases
      .filter(
        (record) =>
          record.latitude !== undefined &&
          record.longitude !== undefined &&
          isOnMinjerribah(record.latitude, record.longitude),
      )
      .forEach((record) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = `real-case-marker urgency-${record.urgency}`;
        element.setAttribute(
          "aria-label",
          `${record.animal}: ${record.situation}`,
        );
        element.title = `${record.animal} · ${record.situation}`;
        element.hidden = !showCases;
        const icon = document.createElement("span");
        icon.textContent = record.icon;
        element.appendChild(icon);

        const marker = new maplibregl.Marker({
          element,
          anchor: "bottom",
        })
          .setLngLat([record.longitude!, record.latitude!])
          .addTo(map);
        caseMarkersRef.current.push(marker);
      });
  }, [cases, mapReady, showCases]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const accuracySource = map.getSource(
      "reporter-accuracy",
    ) as GeoJSONSource | undefined;

    if (
      !locationEnabled ||
      !livePosition ||
      !isOnMinjerribah(livePosition.latitude, livePosition.longitude)
    ) {
      liveMarkerRef.current?.remove();
      liveMarkerRef.current = null;
      centredOnReporterRef.current = false;
      accuracySource?.setData({
        type: "FeatureCollection",
        features: [],
      });
      return;
    }

    const lngLat: LngLatLike = [
      livePosition.longitude,
      livePosition.latitude,
    ];

    if (!liveMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "real-location-marker";
      element.setAttribute("aria-label", "Your current location");
      element.innerHTML =
        '<span class="real-location-pulse"></span><span class="real-location-dot">➤</span>';
      liveMarkerRef.current = new maplibregl.Marker({
        element,
        anchor: "center",
      })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      liveMarkerRef.current.setLngLat(lngLat);
    }

    accuracySource?.setData({
      type: "FeatureCollection",
      features: [accuracyArea(livePosition)],
    });

    if (!centredOnReporterRef.current) {
      map.easeTo({
        center: lngLat,
        zoom: Math.max(map.getZoom(), 14),
        duration: 900,
      });
      centredOnReporterRef.current = true;
    }
  }, [livePosition, locationEnabled, mapReady]);

  const outsideIsland =
    locationEnabled &&
    livePosition !== null &&
    !isOnMinjerribah(livePosition.latitude, livePosition.longitude);

  return (
    <section className="map-card" aria-label="Minjerribah wildlife map">
      <div className="real-map-wrap">
        <div ref={containerRef} className="real-map" />

        <button
          type="button"
          className={`map-layers-button ${layersOpen ? "active" : ""}`}
          onClick={() => setLayersOpen((open) => !open)}
          aria-expanded={layersOpen}
          aria-controls="map-layer-menu"
          title="Map layers"
        >
          <Layers3 size={17} />
          <span>Layers</span>
        </button>

        {layersOpen && (
          <div className="map-layer-menu" id="map-layer-menu">
            <span>Show on map</span>
            <button
              type="button"
              onClick={() => setShowRoads((shown) => !shown)}
              aria-pressed={showRoads}
            >
              <Route size={17} />
              Roads
              {showRoads ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setShowLabels((shown) => !shown)}
              aria-pressed={showLabels}
            >
              <Tags size={17} />
              Labels
              {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setShowCases((shown) => !shown)}
              aria-pressed={showCases}
            >
              <PawPrint size={17} />
              Cases
              {showCases ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <small>Aerial imagery needs internet</small>
          </div>
        )}

        <button
          type="button"
          className={`location-toggle ${locationEnabled ? "is-on" : ""}`}
          onClick={onToggleLocation}
          aria-pressed={locationEnabled}
          title={locationEnabled ? "Hide my location" : "Show my location"}
        >
          {locationEnabled && !livePosition ? (
            <span className="locating-spinner" aria-hidden="true" />
          ) : (
            <LocateFixed size={17} />
          )}
          <span>
            {locationEnabled
              ? livePosition
                ? "GPS on"
                : "Finding GPS"
              : "My GPS"}
          </span>
          <i aria-hidden="true" />
        </button>

        {(outsideIsland || locationMessage) && (
          <div className="map-toast">
            {outsideIsland
              ? "Your GPS is outside the Minjerribah map."
              : locationMessage}
          </div>
        )}
        {mapError && (
          <div className="map-error">
            <Navigation size={16} />
            {mapError}
          </div>
        )}
      </div>

      <div className="map-caption">
        <div>
          <span className="eyebrow">
            Queensland aerial imagery
          </span>
          <strong>
            {cases.length
              ? `${cases.length} saved on this phone`
              : "Minjerribah · North Stradbroke Island"}
          </strong>
        </div>
        <div className="map-legend">
          <span>
            <i className="legend-dot red" /> urgent
          </span>
          <span>
            <i className="legend-dot amber" /> watch
          </span>
        </div>
      </div>
    </section>
  );
}
