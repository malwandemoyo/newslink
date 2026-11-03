"use client";

import React, { useState } from "react";
import {
  Organisation,
  Resource,
  ResourceCategory,
  ResourceRequest,
  DispatchBroadcast,
  JournalistProfile,
} from "@/types/newsroom";
import GeographicMap from "./GeographicMap";
import {
  Radio,
  Camera,
  Plus,
  CheckCircle2,
  ArrowLeftRight,
  KeyRound,
  ClipboardCheck,
  DollarSign,
  Clock,
  MapPin,
} from "lucide-react";

interface ResourceDispatchViewProps {
  organisations: Organisation[];
  resources: Resource[];
  resourceRequests: ResourceRequest[];
  broadcasts: DispatchBroadcast[];
  experts: JournalistProfile[];
  activeOrgId: string;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onCreateResourceRequest: (payload: {
    resourceId: string;
    purpose: string;
    requestedDates: string;
    proposedTerms: string;
    offeredRateUsd: number;
  }) => Promise<void>;
  onCounterOfferRequest: (payload: {
    requestId: string;
    counterRateUsd: number;
    counterOfferTerms: string;
  }) => Promise<void>;
  onUpdateResourceRequest: (payload: {
    requestId: string;
    nextStatus: ResourceRequest["status"];
    serialNumberVerified?: boolean;
    batteryAndMediaChecked?: boolean;
    conditionNote?: string;
  }) => Promise<void>;
  onCreateBroadcast: (payload: {
    title: string;
    needType: DispatchBroadcast["needType"];
    category: ResourceCategory;
    city: string;
    radiusKm: number;
    neededWindow: string;
    offeredRateUsd: number;
    offeredTerms: string;
    urgency: DispatchBroadcast["urgency"];
  }) => Promise<void>;
  onSubmitBid: (payload: {
    broadcastId: string;
    resourceTitle: string;
    proposedRateUsd: number;
    counterTerms: string;
    etaNote: string;
    distanceKm: number;
  }) => Promise<void>;
  onAcceptBid: (payload: {
    broadcastId: string;
    bidId: string;
  }) => Promise<void>;
  onSwitchOrg: (orgId: string) => void;
}

export default function ResourceDispatchView({
  organisations,
  resources,
  resourceRequests,
  broadcasts,
  experts,
  activeOrgId,
  selectedCity,
  onSelectCity,
  onCreateResourceRequest,
  onCounterOfferRequest,
  onUpdateResourceRequest,
  onCreateBroadcast,
  onSubmitBid,
  onAcceptBid,
  onSwitchOrg,
}: ResourceDispatchViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Broadcast Need Form State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bTitle, setBTitle] = useState("");
  const [bNeedType, setBNeedType] = useState<DispatchBroadcast["needType"]>(
    "Equipment + Field Operator"
  );
  const [bCategory, setBCategory] =
    useState<ResourceCategory>("Camera & Optics");
  const [bCity, setBCity] = useState("Bulawayo");
  const [bRadius, setBRadius] = useState(35);
  const [bWindow, setBWindow] = useState("Tomorrow, 07:00 – 16:00");
  const [bRate, setBRate] = useState(25);
  const [bTerms, setBTerms] = useState(
    "Fuel cover + Joint documentary co-byline on News Exchange"
  );

  // Submit Bid / Counter-Offer Modal State
  const [biddingBroadcast, setBiddingBroadcast] =
    useState<DispatchBroadcast | null>(null);
  const [bidResourceTitle, setBidResourceTitle] = useState(
    "Sony FX6 4K Cinema Kit + Wireless Lavaliers + Operator"
  );
  const [bidRate, setBidRate] = useState(30);
  const [bidCounterTerms, setBidCounterTerms] = useState(
    "$30/day fuel & insurance cover + CITE ZW visual co-credit"
  );
  const [bidEta, setBidEta] = useState(
    "1.8 km from Bulawayo hub • Ready for 06:45 pickup"
  );

  // Direct Resource Request Modal
  const [bookingResource, setBookingResource] = useState<Resource | null>(null);
  const [reqPurpose, setReqPurpose] = useState(
    "Film downstream effluent discharge at Umzingwane Dam Weir #3 and interview community water committee"
  );
  const [reqDates, setReqDates] = useState("Nov 6 – Nov 9, 2026");
  const [reqRate, setReqRate] = useState(0);
  const [reqTerms, setReqTerms] = useState(
    "Reciprocal Network Loan ($0 fee + Full CITE ZW visual co-credit)"
  );

  // Counter-Offer on Direct Booking Modal
  const [counteringRequest, setCounteringRequest] =
    useState<ResourceRequest | null>(null);
  const [counterRateInput, setCounterRateInput] = useState(15);
  const [counterTermsInput, setCounterTermsInput] = useState(
    "$15/day insurance pool contribution + return by Nov 9 18:00"
  );

  // Handover Checklist Modal
  const [handoverRequest, setHandoverRequest] =
    useState<ResourceRequest | null>(null);
  const [chkSerial, setChkSerial] = useState(true);
  const [chkBattery, setChkBattery] = useState(true);
  const [chkNote, setChkNote] = useState(
    "Serial verified on chassis, 2x 256GB CFexpress cards formatted, batteries at 100%"
  );

  const activeOrg =
    organisations.find((o) => o.id === activeOrgId) || organisations[0];

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;
    await onCreateBroadcast({
      title: bTitle.trim(),
      needType: bNeedType,
      category: bCategory,
      city: bCity,
      radiusKm: bRadius,
      neededWindow: bWindow,
      offeredRateUsd: bRate,
      offeredTerms: bTerms,
      urgency: "Urgent (Within 24h)",
    });
    setBTitle("");
    setShowBroadcastModal(false);
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingBroadcast) return;
    await onSubmitBid({
      broadcastId: biddingBroadcast.id,
      resourceTitle: bidResourceTitle,
      proposedRateUsd: bidRate,
      counterTerms: bidCounterTerms,
      etaNote: bidEta,
      distanceKm: 1.8,
    });
    setBiddingBroadcast(null);
  };

  const handleDirectBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingResource) return;
    await onCreateResourceRequest({
      resourceId: bookingResource.id,
      purpose: reqPurpose,
      requestedDates: reqDates,
      proposedTerms: reqTerms,
      offeredRateUsd: reqRate,
    });
    setBookingResource(null);
  };

  const handleCounterRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counteringRequest) return;
    await onCounterOfferRequest({
      requestId: counteringRequest.id,
      counterRateUsd: counterRateInput,
      counterOfferTerms: counterTermsInput,
    });
    setCounteringRequest(null);
  };

  const handleHandoverComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverRequest) return;
    const nextStatus =
      handoverRequest.status === "Approved" ||
      handoverRequest.status === "Checked Out"
        ? "Returned"
        : "Approved";
    await onUpdateResourceRequest({
      requestId: handoverRequest.id,
      nextStatus,
      serialNumberVerified: chkSerial,
      batteryAndMediaChecked: chkBattery,
      conditionNote: chkNote,
    });
    setHandoverRequest(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Leaflet Geospatial Map */}
      <GeographicMap
        organisations={organisations}
        resources={resources}
        broadcasts={broadcasts}
        experts={experts}
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        onRequestResource={(res) => {
          setBookingResource(res);
          setReqRate(res.suggestedRateUsd);
        }}
        onSelectBroadcast={(b) => {
          if (b.requesterOrgId !== activeOrgId) {
            setBiddingBroadcast(b);
            setBidRate(b.offeredRateUsd);
          }
        }}
      />

      {/* 2. inDrive-Style Live Field Dispatch Board ("Post a Need" + Bids & Counter-Offers) */}
      <div className="rounded-xl border border-amber-500/30 bg-[#11192c] overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Live Field Dispatch & Counter-Offer Feed (inDrive Model)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {broadcasts.length} Active Broadcasts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Broadcast an urgent field equipment or operator need with your proposed rate/terms; nearby newsrooms accept or send counter-offers in real time
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBroadcastModal(!showBroadcastModal)}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            Broadcast Urgent Field Need
          </button>
        </div>

        {/* Broadcast Need Drawer */}
        {showBroadcastModal && (
          <form
            onSubmit={handleBroadcastSubmit}
            className="p-4 border-b border-slate-800 bg-slate-950/90 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                New Field Dispatch Broadcast (From {activeOrg.name})
              </span>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">
                  What equipment or field specialist do you need?
                </label>
                <input
                  type="text"
                  required
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g., Need 4K Drone + Licensed Pilot for Tailings Dam #2 Aerial Survey"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Need Type</label>
                <select
                  value={bNeedType}
                  onChange={(e) =>
                    setBNeedType(
                      e.target.value as DispatchBroadcast["needType"]
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                >
                  <option value="Equipment + Field Operator">
                    Equipment + Field Operator
                  </option>
                  <option value="Equipment Only">Equipment Only</option>
                  <option value="Specialist Freelancer">
                    Specialist Freelancer
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">City Hub & Radius</label>
                <div className="flex gap-2">
                  <select
                    value={bCity}
                    onChange={(e) => setBCity(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Bulawayo">Bulawayo</option>
                    <option value="Harare">Harare</option>
                    <option value="Mutare">Mutare</option>
                  </select>
                  <input
                    type="number"
                    value={bRadius}
                    onChange={(e) => setBRadius(Number(e.target.value))}
                    className="w-20 px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                    title="Radius in km"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Needed Time Window
                </label>
                <input
                  type="text"
                  required
                  value={bWindow}
                  onChange={(e) => setBWindow(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Proposed Daily Rate (USD $)
                </label>
                <input
                  type="number"
                  min={0}
                  value={bRate}
                  onChange={(e) => setBRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="md:col-span-3 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">
                    Reciprocal Exchange / Attribution Offer
                  </label>
                  <input
                    type="text"
                    required
                    value={bTerms}
                    onChange={(e) => setBTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                >
                  Publish Live Broadcast
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Broadcasts & Bids List */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {broadcasts
            .filter(
              (b) => selectedCity === "All" || b.city === selectedCity
            )
            .map((b) => {
              const requester = organisations.find(
                (o) => o.id === b.requesterOrgId
              );
              const isRequester = b.requesterOrgId === activeOrgId;

              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          {b.needType}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-400" />
                          {b.city} ({b.radiusKm}km radius)
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          b.status === "Matched & Dispatched"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {b.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Posted by{" "}
                        <strong className="text-slate-200">
                          {requester?.name}
                        </strong>{" "}
                        • Window: {b.neededWindow}
                      </p>
                    </div>

                    {/* Offer Box */}
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400">Proposed Terms:</span>{" "}
                        {b.offeredTerms}
                      </div>
                      <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs shrink-0">
                        Offer: ${b.offeredRateUsd}/day
                      </div>
                    </div>

                    {/* Handover PIN if Matched */}
                    {b.handoverPin && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
                        <span className="text-emerald-200 flex items-center gap-1.5 font-semibold">
                          <KeyRound className="w-4 h-4 text-emerald-400" />
                          Dispatch Confirmed! Physical Handover PIN:
                        </span>
                        <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                          {b.handoverPin}
                        </span>
                      </div>
                    )}

                    {/* Incoming Bids / Counter-Offers */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>
                          Incoming Partner Bids & Counter-Offers ({b.bids.length})
                        </span>
                        {!isRequester && b.status !== "Matched & Dispatched" && (
                          <button
                            onClick={() => {
                              setBiddingBroadcast(b);
                              setBidRate(b.offeredRateUsd + 5);
                            }}
                            className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            + Submit Counter-Offer as {activeOrg.shortName}
                          </button>
                        )}
                      </div>

                      {b.bids.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-2.5 rounded border border-dashed border-slate-800">
                          No bids yet. Switch active newsroom persona or click “Submit Bid / Counter-Offer” below.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {b.bids.map((bid) => {
                            const isHigherRate =
                              bid.proposedRateUsd > b.offeredRateUsd;
                            return (
                              <div
                                key={bid.id}
                                className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                                  bid.status === "Accepted"
                                    ? "border-emerald-500/50 bg-emerald-950/20"
                                    : "border-slate-800 bg-slate-900/80"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-100">
                                    {bid.bidderName}
                                  </span>
                                  <span
                                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                      isHigherRate
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                                    }`}
                                  >
                                    {isHigherRate
                                      ? `Counter: $${bid.proposedRateUsd}/d`
                                      : `Matched: $${bid.proposedRateUsd}/d`}
                                  </span>
                                </div>
                                <div className="text-slate-200 font-medium">
                                  Gear/Crew: {bid.resourceTitle}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Terms: {bid.counterTerms} •{" "}
                                  <span className="text-teal-300">
                                    {bid.etaNote}
                                  </span>
                                </div>

                                {b.status !== "Matched & Dispatched" && (
                                  <div className="pt-1 flex items-center justify-end gap-2">
                                    {isRequester ? (
                                      <button
                                        onClick={() =>
                                          onAcceptBid({
                                            broadcastId: b.id,
                                            bidId: bid.id,
                                          })
                                        }
                                        className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                                      >
                                        Accept Offer & Generate Handover PIN ✓
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          onSwitchOrg(b.requesterOrgId)
                                        }
                                        className="text-[11px] text-teal-400 hover:underline cursor-pointer"
                                      >
                                        Switch to {requester?.shortName} to Accept →
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  {b.status !== "Matched & Dispatched" && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      {!isRequester ? (
                        <button
                          onClick={() => {
                            setBiddingBroadcast(b);
                            setBidRate(b.offeredRateUsd);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          Respond with Bid / Counter-Offer as {activeOrg.shortName}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Your broadcast is live. Switch to{" "}
                          <button
                            onClick={() => onSwitchOrg("org-cite")}
                            className="text-teal-400 underline cursor-pointer"
                          >
                            CITE ZW
                          </button>{" "}
                          to send a counter-offer, or accept a bid above.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. Direct Equipment Catalog & Handover Ledger */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-400" />
              Direct Newsroom Equipment Pool (Leihs / Snipe-IT Asset Ledger)
            </h2>
            <p className="text-xs text-slate-400">
              Book specific serialized cameras, audio kits, studios, and field vehicles with PIN-verified physical handover checklists
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              "All",
              "Camera & Optics",
              "Audio & Podcast",
              "Studio & Edit Bay",
              "Drone & Environmental Sensor",
              "Field Vehicle & Power",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-teal-500 text-slate-950 font-semibold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources
            .filter(
              (r) =>
                (selectedCity === "All" || r.city === selectedCity) &&
                (selectedCategory === "All" || r.category === selectedCategory)
            )
            .map((res) => {
              const owner = organisations.find((o) => o.id === res.ownerOrgId);
              const isOwnGear = res.ownerOrgId === activeOrgId;

              return (
                <div
                  key={res.id}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        SN: {res.serialNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          res.status === "Available"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : res.status === "Requested"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 leading-snug">
                      {res.title}
                    </h3>

                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>
                        Custodian:{" "}
                        <strong className="text-slate-200">
                          {owner?.shortName}
                        </strong>
                      </span>
                      <span className="text-teal-300 font-mono font-semibold">
                        {res.suggestedRateUsd === 0
                          ? "$0 Reciprocal"
                          : `$${res.suggestedRateUsd}/day`}
                      </span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {res.specs.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>

                    <div className="text-[11px] text-slate-400">
                      Window: {res.availableWindow} • Condition:{" "}
                      <span className="text-emerald-300">{res.condition}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    {isOwnGear ? (
                      <span className="text-[11px] text-slate-400 italic block text-center">
                        Custodian: Your Newsroom ({activeOrg.shortName})
                      </span>
                    ) : res.status === "Available" ? (
                      <button
                        onClick={() => {
                          setBookingResource(res);
                          setReqRate(res.suggestedRateUsd);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
                      >
                        Book or Propose Terms →
                      </button>
                    ) : (
                      <span className="text-xs text-amber-300 font-medium block text-center">
                        Status: {res.status} (Manage in Handover Ledger below)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Active Bookings, Counter-Offers & Physical Handover Checklist Ledger */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-teal-400" />
                Active Equipment Bookings, Counter-Offers & Physical Handover Checklist
              </h3>
              <p className="text-[11px] text-slate-400">
                Includes PIN verification (`CN-XXXX`), serial number inspection, and return condition sign-off
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {resourceRequests.map((req) => {
              const resItem = resources.find((r) => r.id === req.resourceId);
              const requester = organisations.find(
                (o) => o.id === req.requesterOrgId
              );
              const owner = organisations.find((o) => o.id === req.ownerOrgId);
              const isOwner = activeOrgId === req.ownerOrgId;
              const isRequester = activeOrgId === req.requesterOrgId;

              return (
                <div
                  key={req.id}
                  className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {resItem?.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        PIN: {req.handoverPin}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          req.status === "Approved" ||
                          req.status === "Checked Out"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : req.status === "Counter-Offer Sent"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>{requester?.shortName}</strong> →{" "}
                      <strong>{owner?.shortName}</strong> ({req.requestedDates}) •
                      Offered: <strong>${req.offeredRateUsd}/day</strong> (
                      {req.proposedTerms})
                    </p>

                    {req.counterOfferTerms && (
                      <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 rounded">
                        ⚡ Owner Counter-Offer (${req.counterRateUsd}/day):{" "}
                        {req.counterOfferTerms}
                      </div>
                    )}

                    {(req.conditionOnCheckout || req.conditionOnReturn) && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        {req.conditionOnCheckout &&
                          `✓ Checkout Verified: ${req.conditionOnCheckout}`}{" "}
                        {req.conditionOnReturn &&
                          `| ✓ Return Verified: ${req.conditionOnReturn}`}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isOwner ? (
                      <>
                        {req.status === "Pending Approval" && (
                          <>
                            <button
                              onClick={() => {
                                setHandoverRequest(req);
                                setChkNote(
                                  `Verified SN ${resItem?.serialNumber}, batteries 100%, formatted cards`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                            >
                              Verify Checklist & Approve Handover ✓
                            </button>
                            <button
                              onClick={() => {
                                setCounteringRequest(req);
                                setCounterRateInput(req.offeredRateUsd + 15);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs cursor-pointer"
                            >
                              Send Counter-Offer
                            </button>
                          </>
                        )}
                        {req.status === "Approved" && (
                          <button
                            onClick={() => {
                              setHandoverRequest(req);
                              setChkNote(
                                `Returned in Excellent condition; SN ${resItem?.serialNumber} sensor & audio inputs verified`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                          >
                            Inspect & Log Equipment Return ✓
                          </button>
                        )}
                      </>
                    ) : isRequester && req.status === "Counter-Offer Sent" ? (
                      <button
                        onClick={() =>
                          onUpdateResourceRequest({
                            requestId: req.id,
                            nextStatus: "Approved",
                            conditionNote:
                              "Counter-offer accepted by requester; ready for pickup",
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Accept Counter-Offer (${req.counterRateUsd}/d) ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => onSwitchOrg(req.ownerOrgId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs cursor-pointer"
                      >
                        Switch to {owner?.shortName} to Manage Handover →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Submit Bid / Counter-Offer on a Field Broadcast */}
      {biddingBroadcast && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleBidSubmit}
            className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">
                  Submit Field Dispatch Bid / Counter-Offer
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {biddingBroadcast.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBiddingBroadcast(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Bidding Newsroom:</span>
                <strong className="text-teal-300">{activeOrg.name}</strong>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Equipment & Crew You Are Offering
                </label>
                <input
                  type="text"
                  required
                  value={bidResourceTitle}
                  onChange={(e) => setBidResourceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Your Daily Rate (USD $) (Requester offered $
                    {biddingBroadcast.offeredRateUsd})
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={bidRate}
                    onChange={(e) => setBidRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Distance & Readiness ETA
                  </label>
                  <input
                    type="text"
                    required
                    value={bidEta}
                    onChange={(e) => setBidEta(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Counter-Terms / Co-Byline Conditions
                </label>
                <input
                  type="text"
                  required
                  value={bidCounterTerms}
                  onChange={(e) => setBidCounterTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBiddingBroadcast(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Send Live Bid / Counter-Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Direct Equipment Booking */}
      {bookingResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleDirectBookingSubmit}
            className="w-full max-w-lg rounded-2xl border border-teal-500/50 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-teal-400">
                  Direct Equipment Booking • SN: {bookingResource.serialNumber}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {bookingResource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingResource(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Investigation Assignment / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Booking Window
                  </label>
                  <input
                    type="text"
                    required
                    value={reqDates}
                    onChange={(e) => setReqDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Offered Rate (USD $/day)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={reqRate}
                    onChange={(e) => setReqRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Proposed Attribution / Reciprocal Terms
                </label>
                <input
                  type="text"
                  required
                  value={reqTerms}
                  onChange={(e) => setReqTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingResource(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Request Booking & Generate PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Send Counter-Offer on Direct Booking */}
      {counteringRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCounterRequestSubmit}
            className="w-full max-w-md rounded-2xl border border-amber-500/50 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white">
              Send Counter-Offer on Booking #{counteringRequest.id}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Counter Daily Rate (USD $)
                </label>
                <input
                  type="number"
                  min={0}
                  value={counterRateInput}
                  onChange={(e) => setCounterRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Counter Terms / Return Condition Requirement
                </label>
                <input
                  type="text"
                  required
                  value={counterTermsInput}
                  onChange={(e) => setCounterTermsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCounteringRequest(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Send Counter-Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Physical Handover & Condition Verification Checklist */}
      {handoverRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleHandoverComplete}
            className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                Physical Equipment Handover Protocol • PIN:{" "}
                {handoverRequest.handoverPin}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Verify Serial Number & Equipment Condition
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chkSerial}
                  onChange={(e) => setChkSerial(e.target.checked)}
                  className="rounded accent-teal-500"
                />
                <span>
                  Chassis Serial Number & Optics Inspected (No scratches/dust)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chkBattery}
                  onChange={(e) => setChkBattery(e.target.checked)}
                  className="rounded accent-teal-500"
                />
                <span>
                  Batteries Charged & Media Cards Cleared / Verified
                </span>
              </label>

              <div>
                <label className="block text-slate-400 mb-1">
                  Signed Condition Log Note
                </label>
                <input
                  type="text"
                  required
                  value={chkNote}
                  onChange={(e) => setChkNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandoverRequest(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Confirm & Sign Handover Log ✓
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
