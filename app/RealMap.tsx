"use client";

import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocateFixed, Navigation } from "lucide-react";
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
  [153.34, -27.81],
  [153.58, -27.28],
];

const INITIAL_BOUNDS: [[number, number], [number, number]] = [
  [153.36, -27.76],
  [153.56, -27.31],
];

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
    },
    layers: layers("protomaps", flavour, { lang: "en" }),
  };
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
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const protocol = new Protocol();
    protocolRef.current = protocol;
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(),
      bounds: INITIAL_BOUNDS,
      fitBoundsOptions: { padding: 18 },
      maxBounds: ISLAND_BOUNDS,
      minZoom: 9,
      maxZoom: 16,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "bottom-right",
    );
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
      setMapReady(true);
    });

    map.on("error", (event) => {
      if (event.error) {
        setMapError("The field map could not finish loading");
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

    caseMarkersRef.current.forEach((marker) => marker.remove());
    caseMarkersRef.current = [];

    cases
      .filter(
        (record) =>
          record.latitude !== undefined && record.longitude !== undefined,
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
  }, [cases, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const accuracySource = map.getSource(
      "reporter-accuracy",
    ) as GeoJSONSource | undefined;

    if (!locationEnabled || !livePosition) {
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

  return (
    <section className="map-card" aria-label="Minjerribah wildlife map">
      <div className="real-map-wrap">
        <div ref={containerRef} className="real-map" />

        <button
          type="button"
          className={`location-toggle ${locationEnabled ? "is-on" : ""}`}
          onClick={onToggleLocation}
          aria-pressed={locationEnabled}
        >
          {locationEnabled && !livePosition ? (
            <span className="locating-spinner" aria-hidden="true" />
          ) : (
            <LocateFixed size={19} />
          )}
          <span>
            {locationEnabled
              ? livePosition
                ? "My location on"
                : "Finding my location"
              : "Show my location"}
          </span>
          <i aria-hidden="true" />
        </button>

        {locationMessage && <div className="map-toast">{locationMessage}</div>}
        {mapError && (
          <div className="map-error">
            <Navigation size={16} />
            {mapError}
          </div>
        )}
      </div>

      <div className="map-caption">
        <div>
          <span className="eyebrow">Accurate offline field map</span>
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
