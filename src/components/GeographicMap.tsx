"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Organisation,
  Resource,
  DispatchBroadcast,
  JournalistProfile,
} from "@/types/newsroom";
import { Navigation, Radio, Camera, Users, Layers } from "lucide-react";
import type * as LeafletNS from "leaflet";

interface GeographicMapProps {
  organisations: Organisation[];
  resources: Resource[];
  broadcasts?: DispatchBroadcast[];
  experts: JournalistProfile[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onRequestResource?: (resource: Resource) => void;
  onSelectBroadcast?: (broadcast: DispatchBroadcast) => void;
  onInviteExpert?: (expert: JournalistProfile) => void;
}

type MapStyleId = "street" | "dark" | "satellite";

const MAP_TILE_STYLES: Record<
  MapStyleId,
  { label: string; url: string; attribution: string; subdomains?: string }
> = {
  street: {
    label: "Street",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    subdomains: "abcd",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
};

const CITY_VIEWPORTS: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  All: { center: [-19.05, 30.15], zoom: 6 },
  Bulawayo: { center: [-20.154, 28.586], zoom: 13 },
  Harare: { center: [-17.827, 31.038], zoom: 13 },
  Mutare: { center: [-18.9707, 32.6709], zoom: 12 },
};

export default function GeographicMap({
  organisations,
  resources,
  broadcasts = [],
  experts,
  selectedCity,
  onSelectCity,
  onRequestResource,
  onSelectBroadcast,
  onInviteExpert,
}: GeographicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletNS.Map | null>(null);
  const tileLayerRef = useRef<LeafletNS.TileLayer | null>(null);
  const layerGroupRef = useRef<LeafletNS.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleId>("street");

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      const initialView =
        CITY_VIEWPORTS[selectedCity] || CITY_VIEWPORTS.All;

      const map = L.map(mapContainerRef.current, {
        center: initialView.center,
        zoom: initialView.zoom,
        zoomControl: true,
      });

      const styleCfg = MAP_TILE_STYLES[mapStyle];
      const tileLayer = L.tileLayer(styleCfg.url, {
        attribution: styleCfg.attribution,
        ...(styleCfg.subdomains ? { subdomains: styleCfg.subdomains } : {}),
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;
      layerGroupRef.current = layerGroup;

      renderMapMarkers(L);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function updateBasemap() {
      const map = mapInstanceRef.current;
      if (!map) return;
      const L = await import("leaflet");
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      const styleCfg = MAP_TILE_STYLES[mapStyle];
      tileLayerRef.current = L.tileLayer(styleCfg.url, {
        attribution: styleCfg.attribution,
        ...(styleCfg.subdomains ? { subdomains: styleCfg.subdomains } : {}),
        maxZoom: 19,
      }).addTo(map);
    }
    updateBasemap();
  }, [mapStyle]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const target = CITY_VIEWPORTS[selectedCity] || CITY_VIEWPORTS.All;
    map.flyTo(target.center, target.zoom, { duration: 0.9 });
  }, [selectedCity]);

  useEffect(() => {
    async function updateLayers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = await import("leaflet");
      renderMapMarkers(L);
    }
    updateLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisations, resources, broadcasts, experts, selectedCity]);

  function renderMapMarkers(L: typeof LeafletNS) {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    const spreadScale = selectedCity === "All" ? 0.22 : 0.0055;

    // 1. Dispatch Broadcast Radius Rings & Markers
    broadcasts.forEach((b, idx) => {
      if (selectedCity !== "All" && b.city !== selectedCity) return;

      L.circle([b.coordinates.lat, b.coordinates.lng], {
        radius: selectedCity === "All" ? b.radiusKm * 900 : b.radiusKm * 220,
        color: b.status === "Matched & Dispatched" ? "#10b981" : "#f59e0b",
        fillColor: b.status === "Matched & Dispatched" ? "#10b981" : "#f59e0b",
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: "5, 5",
      }).addTo(group);

      const broadcastIcon = L.divIcon({
        className: "custom-dispatch-icon",
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:#0f1113;color:#fde68a;font-weight:600;font-size:11px;padding:3px 8px;border-radius:6px;border:1.5px solid #f59e0b;box-shadow:0 2px 6px rgba(0,0,0,0.45);white-space:nowrap;font-variant-numeric:tabular-nums;">
          <span style="width:6px;height:6px;border-radius:999px;background:#f59e0b;display:inline-block;"></span>
          <span>Need · $${b.offeredRateUsd}/d</span>
        </div>`,
        iconSize: [96, 24],
        iconAnchor: [48, 12],
      });

      const marker = L.marker(
        [
          b.coordinates.lat + (idx % 2 === 0 ? spreadScale * 0.6 : -spreadScale * 0.6),
          b.coordinates.lng - spreadScale * 0.8,
        ],
        { icon: broadcastIcon }
      ).addTo(group);

      marker.bindPopup(`
        <div style="min-width:210px;font-size:12px;line-height:1.45;color:#0f172a;">
          <div style="font-size:11px;color:#b45309;font-weight:600;">
            Field dispatch · ${b.urgency}
          </div>
          <div style="font-weight:600;margin-top:2px;color:#0f172a;">${b.title}</div>
          <div style="color:#334155;font-size:11px;margin-top:4px;font-variant-numeric:tabular-nums;">
            Window: ${b.neededWindow}<br/>
            Offer: <strong style="color:#047857;">$${b.offeredRateUsd}/day</strong> (${b.offeredTerms})<br/>
            Active bids: <strong>${b.bids.length}</strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectBroadcast) onSelectBroadcast(b);
      });
    });

    // 2. Equipment Resource Markers
    resources.forEach((res, idx) => {
      if (selectedCity !== "All" && res.city !== selectedCity) return;
      const owner = organisations.find((o) => o.id === res.ownerOrgId);
      const angle = (idx / Math.max(resources.length, 1)) * Math.PI * 2;
      const latOffset = Math.sin(angle) * spreadScale;
      const lngOffset = Math.cos(angle) * spreadScale;

      const isAvail = res.status === "Available";
      const borderColor = isAvail ? "#14b8a6" : "#64748b";
      const dotColor = isAvail ? "#2dd4bf" : "#94a3b8";

      const gearIcon = L.divIcon({
        className: "custom-gear-icon",
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:#0f1113;color:#f1f5f9;font-weight:600;font-size:11px;padding:3px 8px;border-radius:6px;border:1.5px solid ${borderColor};box-shadow:0 2px 6px rgba(0,0,0,0.45);white-space:nowrap;font-variant-numeric:tabular-nums;">
          <span style="width:6px;height:6px;border-radius:999px;background:${dotColor};display:inline-block;"></span>
          <span>${res.city} · ${res.suggestedRateUsd === 0 ? "Free" : `$${res.suggestedRateUsd}`}</span>
        </div>`,
        iconSize: [92, 24],
        iconAnchor: [46, 12],
      });

      const marker = L.marker(
        [res.coordinates.lat + latOffset, res.coordinates.lng + lngOffset],
        { icon: gearIcon }
      ).addTo(group);

      marker.bindPopup(`
        <div style="min-width:210px;font-size:12px;line-height:1.45;color:#0f172a;">
          <div style="font-size:11px;color:#0f766e;font-weight:600;">
            ${res.category} · ${res.serialNumber}
          </div>
          <div style="font-weight:600;margin-top:2px;color:#0f172a;">${res.title}</div>
          <div style="color:#334155;font-size:11px;margin-top:4px;font-variant-numeric:tabular-nums;">
            Owner: <strong>${owner?.shortName || res.ownerOrgId}</strong><br/>
            Status: <strong>${res.status}</strong> · Rate: <strong>$${res.suggestedRateUsd}/day</strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onRequestResource && res.status === "Available") {
          onRequestResource(res);
        }
      });
    });

    // 3. Newsroom Hub Markers
    organisations.forEach((org, idx) => {
      if (selectedCity !== "All" && org.city !== selectedCity) return;
      const latOffset = idx % 2 === 0 ? spreadScale * 0.35 : -spreadScale * 0.35;
      const orgIcon = L.divIcon({
        className: "custom-org-icon",
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:#0f1113;color:#e0f2fe;font-weight:600;font-size:11px;padding:3px 9px;border-radius:999px;border:1.5px solid #38bdf8;box-shadow:0 2px 6px rgba(0,0,0,0.45);white-space:nowrap;">
          <span style="width:6px;height:6px;border-radius:999px;background:#38bdf8;display:inline-block;"></span>
          <span>${org.shortName}</span>
        </div>`,
        iconSize: [112, 24],
        iconAnchor: [56, 12],
      });

      const marker = L.marker(
        [org.coordinates.lat + latOffset, org.coordinates.lng],
        { icon: orgIcon }
      ).addTo(group);

      marker.bindPopup(`
        <div style="min-width:200px;font-size:12px;line-height:1.45;color:#0f172a;">
          <div style="font-size:11px;color:#0369a1;font-weight:600;">
            ${org.type} · ${org.city}
          </div>
          <div style="font-weight:600;margin-top:2px;color:#0f172a;">${org.name}</div>
          <div style="color:#334155;font-size:11px;margin-top:4px;">
            Specialties: ${org.specialties.join(", ")}
          </div>
        </div>
      `);
    });

    // 4. Specialist Journalist Markers
    experts.forEach((exp, idx) => {
      if (selectedCity !== "All" && exp.city !== selectedCity) return;
      const angle = ((idx + 0.5) / Math.max(experts.length, 1)) * Math.PI * 2;
      const latOffset = Math.sin(angle) * (spreadScale * 1.35);
      const lngOffset = Math.cos(angle) * (spreadScale * 1.35);

      const expIcon = L.divIcon({
        className: "custom-exp-icon",
        html: `<div style="display:inline-flex;align-items:center;gap:5px;background:#0f1113;color:#e2e8f0;font-weight:600;font-size:11px;padding:2px 8px;border-radius:6px;border:1.5px solid #94a3b8;box-shadow:0 2px 6px rgba(0,0,0,0.45);white-space:nowrap;">
          <span style="width:5px;height:5px;border-radius:999px;background:#cbd5e1;display:inline-block;"></span>
          <span>${exp.name.split(" ")[0]}</span>
        </div>`,
        iconSize: [78, 22],
        iconAnchor: [39, 11],
      });

      const marker = L.marker(
        [exp.coordinates.lat + latOffset, exp.coordinates.lng + lngOffset],
        { icon: expIcon }
      ).addTo(group);

      marker.bindPopup(`
        <div style="min-width:200px;font-size:12px;line-height:1.45;color:#0f172a;">
          <div style="font-size:11px;color:#475569;font-weight:600;">
            ${exp.role} · ${exp.availability}
          </div>
          <div style="font-weight:600;margin-top:2px;color:#0f172a;">${exp.name}</div>
          <div style="color:#334155;font-size:11px;margin-top:4px;">
            Skills: ${exp.skills.join(", ")}<br/>
            Languages: <strong>${exp.languages.join(", ")}</strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onInviteExpert) onInviteExpert(exp);
      });
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Map Header Controls */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-300">
            <Navigation className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Geospatial Network Map
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                {process.env.NEXT_PUBLIC_MAPS_API_KEY
                  ? "Maps API active"
                  : "OpenStreetMap"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Select a field request to bid, equipment pin to book, or specialist pin to invite.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map Tile Style Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <Layers className="size-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(["street", "dark", "satellite"] as const).map((styleId) => (
              <button
                key={styleId}
                onClick={() => setMapStyle(styleId)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  mapStyle === styleId
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {MAP_TILE_STYLES[styleId].label}
              </button>
            ))}
          </div>

          {/* City FlyTo Controls */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(["All", "Bulawayo", "Harare", "Mutare"] as const).map((city) => (
              <button
                key={city}
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedCity === city
                    ? "bg-teal-400 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {city === "All" ? "All Zimbabwe" : city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[380px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex flex-wrap items-center gap-4 shadow-sm pointer-events-none tabular-nums">
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5 text-amber-400" />
            <span>Field requests ({broadcasts.length})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Camera className="size-3.5 text-teal-400" />
            <span>Equipment ({resources.length})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-sky-400" />
            <span>Newsrooms ({organisations.length}) &amp; Specialists ({experts.length})</span>
          </span>
        </div>
      </div>
    </div>
  );
}
