"use client";

import React, { useState } from "react";
import { Organisation, Resource, JournalistProfile } from "@/types/newsroom";
import { MapPin, Camera, Users, Building2, Navigation, ExternalLink } from "lucide-react";

interface GeographicMapProps {
  organisations: Organisation[];
  resources: Resource[];
  experts: JournalistProfile[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onRequestResource?: (resource: Resource) => void;
}

const CITY_COORDS: Record<
  string,
  { xPercent: number; yPercent: number; lat: string; lng: string; region: string }
> = {
  Bulawayo: {
    xPercent: 34,
    yPercent: 68,
    lat: "20.1489° S",
    lng: "28.5806° E",
    region: "Matabeleland Hub",
  },
  Harare: {
    xPercent: 62,
    yPercent: 28,
    lat: "17.8252° S",
    lng: "31.0335° E",
    region: "Mashonaland Hub",
  },
  Mutare: {
    xPercent: 82,
    yPercent: 45,
    lat: "18.9707° S",
    lng: "32.6709° E",
    region: "Manicaland Eastern Corridor",
  },
};

export default function GeographicMap({
  organisations,
  resources,
  experts,
  selectedCity,
  onSelectCity,
  onRequestResource,
}: GeographicMapProps) {
  const [mapMode, setMapMode] = useState<"tactical" | "osm">("tactical");

  const cities = ["Bulawayo", "Harare", "Mutare"];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#11192c] overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Geographic Resource & Expertise Discovery
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                PostGIS + OpenStreetMap
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Click a regional hub to filter nearby cameras, studios, field kits, and verified specialists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectCity("All")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              selectedCity === "All"
                ? "bg-teal-500 text-slate-950 font-semibold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Nodes ({resources.length})
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => onSelectCity(city === selectedCity ? "All" : city)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                selectedCity === city
                  ? "bg-teal-500 text-slate-950 font-semibold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {city}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => setMapMode(mapMode === "tactical" ? "osm" : "tactical")}
            className="px-2.5 py-1 rounded text-xs bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1"
            title="Switch between Tactical Network Map and Live OpenStreetMap Embed"
          >
            <ExternalLink className="w-3 h-3 text-teal-400" />
            {mapMode === "tactical" ? "Live OSM Tile View" : "Tactical Node View"}
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Left 2 Columns: Interactive Spatial Canvas or Live OSM iframe */}
        <div className="lg:col-span-2 relative min-h-[300px] bg-[#0a101f] border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden">
          {mapMode === "osm" ? (
            <div className="w-full h-full min-h-[300px] relative">
              <iframe
                title="OpenStreetMap Zimbabwe Network Nodes"
                className="w-full h-[310px] opacity-85 contrast-125"
                src="https://www.openstreetmap.org/export/embed.html?bbox=25.5%2C-22.2%2C33.2%2C-15.8&layer=mapnik&marker=-20.1489%2C28.5806"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-300">
                OpenStreetMap Contributors • Bulawayo (-20.1489, 28.5806) • Harare (-17.8252, 31.0335)
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[310px] p-4 select-none">
              {/* Coordinate Grid Background */}
              <svg
                className="absolute inset-0 w-full h-full opacity-25"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="geo-grid"
                    width="36"
                    height="36"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 36 0 L 0 0 0 36"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#geo-grid)" />
                {/* Connecting Fibre / Collaboration Corridors */}
                <line
                  x1="34%"
                  y1="68%"
                  x2="62%"
                  y2="28%"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <line
                  x1="62%"
                  y1="28%"
                  x2="82%"
                  y2="45%"
                  stroke="#0ea5e9"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <line
                  x1="34%"
                  y1="68%"
                  x2="82%"
                  y2="45%"
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
              </svg>

              {/* Top-left Telemetry legend */}
              <div className="relative z-10 inline-flex flex-col gap-1 bg-slate-900/90 border border-slate-800/90 rounded-lg px-3 py-2 text-xs">
                <div className="font-mono text-[11px] text-teal-400 font-semibold">
                  SOUTHERN AFRICA COLLABORATION MESH
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Active Hub
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 border-t border-dashed border-teal-400 inline-block" /> Co-Investigation Link
                  </span>
                </div>
              </div>

              {/* Plot City Markers */}
              {cities.map((city) => {
                const coord = CITY_COORDS[city];
                const cityOrgs = organisations.filter((o) => o.city === city);
                const cityRes = resources.filter((r) => r.city === city);
                const availRes = cityRes.filter((r) => r.status === "Available");
                const cityExp = experts.filter((e) => e.city === city);
                const isSelected = selectedCity === city;

                return (
                  <button
                    key={city}
                    onClick={() => onSelectCity(isSelected ? "All" : city)}
                    style={{ left: `${coord.xPercent}%`, top: `${coord.yPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group text-left transition-all z-20`}
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-40 ${
                          isSelected ? "bg-teal-400" : "bg-sky-400"
                        }`}
                      />
                      <div
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg transition ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 border-teal-300 font-semibold scale-105"
                            : "bg-slate-900/95 text-slate-100 border-slate-700 hover:border-teal-400"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">{city}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-slate-950/25 text-slate-950"
                              : "bg-teal-500/20 text-teal-300"
                          }`}
                        >
                          {availRes.length} gear
                        </span>
                      </div>
                    </div>

                    {/* Mini card under pin */}
                    <div className="mt-1.5 bg-slate-950/95 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 shadow-xl min-w-[165px]">
                      <div className="font-mono text-[10px] text-slate-400">
                        {coord.lat}, {coord.lng}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5 text-slate-200">
                        <span>{cityOrgs.length} Newsroom(s)</span>
                        <span className="text-teal-400">{cityExp.length} Experts</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Bottom caption */}
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                Showing {selectedCity === "All" ? "all 3 regional corridors" : `${selectedCity} corridor`}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Nearby Equipment & Hub Summary */}
        <div className="p-4 flex flex-col justify-between bg-[#0f172a]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                {selectedCity === "All" ? "Network-Wide Pool" : `${selectedCity} Equipment Pool`}
              </span>
              <span className="text-xs text-slate-400">
                {
                  resources.filter(
                    (r) => selectedCity === "All" || r.city === selectedCity
                  ).length
                }{" "}
                items listed
              </span>
            </div>

            <div className="space-y-2.5 max-h-[225px] overflow-y-auto pr-1">
              {resources
                .filter((r) => selectedCity === "All" || r.city === selectedCity)
                .map((res) => {
                  const owner = organisations.find((o) => o.id === res.ownerOrgId);
                  return (
                    <div
                      key={res.id}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-100 leading-snug">
                          {res.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            res.status === "Available"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : res.status === "Requested"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {owner?.shortName} • {res.city}
                        </span>
                        {onRequestResource && res.status === "Available" && (
                          <button
                            onClick={() => onRequestResource(res)}
                            className="text-teal-400 hover:text-teal-300 font-medium underline cursor-pointer"
                          >
                            Request Gear →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              {organisations.length} Verified Newsrooms
            </span>
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              Peer-to-Peer Handover Logged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
