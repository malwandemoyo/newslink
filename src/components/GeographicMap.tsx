"use client";

import React, { useEffect, useRef } from "react";
import {
  Organisation,
  Resource,
  DispatchBroadcast,
  JournalistProfile,
} from "@/types/newsroom";
import { Navigation, Radio, Camera, Users } from "lucide-react";
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
}

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
}: GeographicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletNS.Map | null>(null);
  const layerGroupRef = useRef<LeafletNS.LayerGroup | null>(null);

  // Initialize Leaflet map once on mount
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

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
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

  // Fly to city when selectedCity changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const target = CITY_VIEWPORTS[selectedCity] || CITY_VIEWPORTS.All;
    map.flyTo(target.center, target.zoom, { duration: 0.9 });
  }, [selectedCity]);

  // Re-render markers and dispatch radius circles when data changes
  useEffect(() => {
    async function updateLayers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = await import("leaflet");
      renderMapMarkers(L);
    }
    updateLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, broadcasts, experts, selectedCity]);

  function renderMapMarkers(L: typeof LeafletNS) {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. Draw inDrive-style Dispatch Broadcast Radius Rings & Markers
    broadcasts.forEach((b) => {
      if (selectedCity !== "All" && b.city !== selectedCity) return;

      // Dispatch Radius Circle (in meters)
      L.circle([b.coordinates.lat, b.coordinates.lng], {
        radius: b.radiusKm * 250, // visual scaled radius for city/regional view
        color: b.status === "Matched & Dispatched" ? "#10b981" : "#f59e0b",
        fillColor: b.status === "Matched & Dispatched" ? "#10b981" : "#f59e0b",
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: "5, 5",
      }).addTo(group);

      const broadcastIcon = L.divIcon({
        className: "custom-dispatch-icon",
        html: `<div style="display:flex;align-items:center;gap:4px;background:#f59e0b;color:#020617;font-weight:700;font-size:10px;padding:3px 8px;border-radius:999px;border:2px solid #fef3c7;box-shadow:0 4px 12px rgba(245,158,11,0.5);white-space:nowrap;">
          <span>📡 NEED</span>
          <span>$${b.offeredRateUsd}/d</span>
        </div>`,
        iconSize: [90, 24],
        iconAnchor: [45, 12],
      });

      const marker = L.marker([b.coordinates.lat, b.coordinates.lng], {
        icon: broadcastIcon,
      }).addTo(group);

      marker.bindPopup(`
        <div style="min-width:210px;font-size:12px;line-height:1.4;">
          <div style="font-size:10px;font-family:monospace;color:#fbbf24;text-transform:uppercase;font-weight:700;">
            inDrive Field Broadcast • ${b.urgency}
          </div>
          <div style="font-weight:700;margin-top:3px;color:#fff;">${b.title}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:4px;">
            Window: ${b.neededWindow}<br/>
            Offer: <strong style="color:#34d399;">$${b.offeredRateUsd}/day</strong> (${b.offeredTerms})<br/>
            Active Bids: <strong>${b.bids.length}</strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectBroadcast) onSelectBroadcast(b);
      });
    });

    // 2. Draw Equipment Resource Markers
    resources.forEach((res, idx) => {
      if (selectedCity !== "All" && res.city !== selectedCity) return;
      const owner = organisations.find((o) => o.id === res.ownerOrgId);
      // Slight offset so overlapping city markers are all clickable
      const latOffset = (idx % 3 - 1) * 0.0035;
      const lngOffset = (Math.floor(idx / 3) - 0.5) * 0.0035;

      const isAvail = res.status === "Available";
      const bg = isAvail ? "#14b8a6" : "#475569";
      const fg = isAvail ? "#020617" : "#e2e8f0";

      const gearIcon = L.divIcon({
        className: "custom-gear-icon",
        html: `<div style="display:flex;align-items:center;gap:4px;background:${bg};color:${fg};font-weight:700;font-size:10px;padding:3px 7px;border-radius:6px;border:1px solid #99f6e4;box-shadow:0 4px 10px rgba(0,0,0,0.5);white-space:nowrap;">
          <span>🎥 ${res.city}</span>
          <span>${res.suggestedRateUsd === 0 ? "FREE" : `$${res.suggestedRateUsd}`}</span>
        </div>`,
        iconSize: [84, 24],
        iconAnchor: [42, 12],
      });

      const marker = L.marker(
        [res.coordinates.lat + latOffset, res.coordinates.lng + lngOffset],
        { icon: gearIcon }
      ).addTo(group);

      marker.bindPopup(`
        <div style="min-width:210px;font-size:12px;line-height:1.4;">
          <div style="font-size:10px;font-family:monospace;color:#2dd4bf;">
            ${res.category} • SN: ${res.serialNumber}
          </div>
          <div style="font-weight:700;margin-top:2px;color:#fff;">${res.title}</div>
          <div style="color:#cbd5e1;font-size:11px;margin-top:4px;">
            Owner: <strong>${owner?.shortName || res.ownerOrgId}</strong><br/>
            Status: <strong>${res.status}</strong> • Rate: <strong>$${res.suggestedRateUsd}/day</strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onRequestResource && res.status === "Available") {
          onRequestResource(res);
        }
      });
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
      {/* Map Header Controls */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              Live Leaflet Geospatial Dispatch & Equipment Map
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                Leaflet + PostGIS Coords
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any <span className="text-amber-300 font-medium">📡 NEED</span> marker to bid/counter-offer, or any <span className="text-teal-300 font-medium">🎥 Gear</span> marker to book equipment
            </p>
          </div>
        </div>

        {/* City FlyTo Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", "Bulawayo", "Harare", "Mutare"] as const).map((city) => (
            <button
              key={city}
              onClick={() => onSelectCity(city)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCity === city
                  ? "bg-teal-500 text-slate-950 font-semibold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {city === "All" ? "All Zimbabwe (6x)" : `${city} Hub (13x)`}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[340px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-300 flex flex-wrap items-center gap-4 shadow-xl pointer-events-none">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Amber Circle = Active Field Broadcast Radius</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>Teal Pin = Available Equipment</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>{organisations.length} Newsroom Nodes</span>
          </span>
        </div>
      </div>
    </div>
  );
}
