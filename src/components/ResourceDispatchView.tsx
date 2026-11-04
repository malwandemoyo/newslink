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
  MapPin,
  Map,
  Calendar,
  ShieldCheck,
  Sparkles,
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
  onCreateResource?: (payload: {
    title: string;
    category: ResourceCategory;
    city: string;
    suggestedRateUsd?: number;
    includesOperator: boolean;
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
  onCreateResource,
  onSwitchOrg,
}: ResourceDispatchViewProps) {
  const [subTab, setSubTab] = useState<"catalog" | "dispatch" | "bookings">(
    "catalog"
  );
  const [showMap, setShowMap] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [gearTitle, setGearTitle] = useState(
    "Sony FX3 Cinema Camera + 24-70mm f/2.8 GM Kit"
  );
  const [gearCategory, setGearCategory] =
    useState<ResourceCategory>("Camera & Optics");
  const [gearCity, setGearCity] = useState("Bulawayo");
  const [gearIncludesOp, setGearIncludesOp] = useState(false);
  const [listingGear, setListingGear] = useState(false);

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
    "Fuel cover + Joint documentary co-byline"
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
    "Film downstream effluent discharge at Umzingwane Dam Weir #3"
  );
  const [reqDates, setReqDates] = useState("Nov 6 – Nov 9, 2026");
  const [reqRate, setReqRate] = useState(0);
  const [reqTerms, setReqTerms] = useState(
    "Free Peer Exchange + Full CITE ZW visual co-credit"
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
    setSubTab("dispatch");
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
    setSubTab("bookings");
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
      {/* Clean Page Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white">
            Equipment & Field Crew Exchange
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Borrow cameras, studios, and drones from partner newsrooms, or broadcast an urgent field request.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 cursor-pointer transition"
          >
            <Map className="size-4 text-teal-400" />
            {showMap ? "Hide Map" : "Show Map"}
          </button>

          <button
            onClick={() => setShowListGearModal(!showListGearModal)}
            className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition"
          >
            <Camera className="size-4" />+ List Camera / Gear (AI Priced)
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition"
          >
            <Plus className="size-4" />
            Post Urgent Field Need
          </button>
        </div>
      </div>

      {/* Inline List New Camera / Gear Form (Gemini AI Auto-Priced) */}
      {showListGearModal && onCreateResource && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!gearTitle.trim()) return;
            setListingGear(true);
            try {
              await onCreateResource({
                title: gearTitle.trim(),
                category: gearCategory,
                city: gearCity,
                includesOperator: gearIncludesOp,
              });
              setShowListGearModal(false);
              setSubTab("catalog");
            } finally {
              setListingGear(false);
            }
          }}
          className="p-4 rounded-2xl border border-teal-500/40 bg-slate-900/95 space-y-3 shadow-xl text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Sparkles className="size-4 text-teal-400" />
              List Newsroom Equipment (Gemini 3.8 Flash Calculates Fair Peer-to-Peer Rate)
            </span>
            <button
              type="button"
              onClick={() => setShowListGearModal(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">
                Equipment Title & Model
              </label>
              <input
                type="text"
                value={gearTitle}
                onChange={(e) => setGearTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={gearCategory}
                onChange={(e) =>
                  setGearCategory(e.target.value as ResourceCategory)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="Camera & Optics">Camera & Optics</option>
                <option value="Drone & Aerial">Drone & Aerial</option>
                <option value="Broadcast Audio">Broadcast Audio</option>
                <option value="Studio & Editing">Studio & Editing</option>
                <option value="Field Transport & Power">
                  Field Transport & Power
                </option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <select
                value={gearCity}
                onChange={(e) => setGearCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="Bulawayo">Bulawayo</option>
                <option value="Harare">Harare</option>
                <option value="Mutare">Mutare</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={gearIncludesOp}
                onChange={(e) => setGearIncludesOp(e.target.checked)}
                className="accent-teal-500"
              />
              Includes licensed newsroom operator / technician
            </label>
            <button
              type="submit"
              disabled={listingGear}
              className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold cursor-pointer"
            >
              {listingGear
                ? "Pricing via Gemini 3.8 Flash & Listing..."
                : "Price with Gemini AI & List Equipment"}
            </button>
          </div>
        </form>
      )}

      {/* Collapsible Interactive Leaflet Map */}
      {showMap && (
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
            setSubTab("dispatch");
            if (b.requesterOrgId !== activeOrgId) {
              setBiddingBroadcast(b);
              setBidRate(b.offeredRateUsd);
            }
          }}
        />
      )}

      {/* Clean 3-Part Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab("catalog")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "catalog"
                ? "bg-teal-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Camera className="size-4" />
            1. Browse Equipment ({resources.length})
          </button>

          <button
            onClick={() => setSubTab("dispatch")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "dispatch"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Radio className="size-4" />
            2. Urgent Field Requests & Bids ({broadcasts.length})
          </button>

          <button
            onClick={() => setSubTab("bookings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "bookings"
                ? "bg-teal-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ClipboardCheck className="size-4" />
            3. My Bookings & Handover PINs ({resourceRequests.length})
          </button>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 pr-2">
          <span className="text-xs text-slate-400 mr-1">Location:</span>
          {["All", "Bulawayo", "Harare", "Mutare"].map((city) => (
            <button
              key={city}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                selectedCity === city
                  ? "bg-slate-800 text-teal-300 border border-teal-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EQUIPMENT CATALOG */}
      {subTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources
              .filter(
                (r) =>
                  (selectedCity === "All" || r.city === selectedCity) &&
                  (selectedCategory === "All" ||
                    r.category === selectedCategory)
              )
              .map((res) => {
                const owner = organisations.find(
                  (o) => o.id === res.ownerOrgId
                );
                const isOwnGear = res.ownerOrgId === activeOrgId;

                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-2xl border border-slate-800/90 bg-slate-900 hover:border-slate-700 transition flex flex-col justify-between gap-5 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-teal-400">
                          {res.category}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            res.status === "Available"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">
                        {res.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-teal-400" />
                          {owner?.shortName} ({res.city})
                        </span>
                        <span className="font-bold text-sm text-white">
                          {res.suggestedRateUsd === 0
                            ? "Free Peer Loan"
                            : `$${res.suggestedRateUsd} / day`}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                        {res.specs.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-teal-400">•</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {res.availableWindow}
                        </span>
                        <span className="text-emerald-400 font-medium">
                          {res.condition}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      {isOwnGear ? (
                        <div className="py-2.5 px-4 rounded-xl bg-slate-900 text-slate-400 text-xs text-center font-medium">
                          Owned by your newsroom ({activeOrg.shortName})
                        </div>
                      ) : res.status === "Available" ? (
                        <button
                          onClick={() => {
                            setBookingResource(res);
                            setReqRate(res.suggestedRateUsd);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Request Equipment Booking
                        </button>
                      ) : (
                        <button
                          onClick={() => setSubTab("bookings")}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold cursor-pointer"
                        >
                          Currently {res.status} — View in Bookings
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: URGENT FIELD REQUESTS & LIVE COUNTER-OFFERS (inDrive Style) */}
      {subTab === "dispatch" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {broadcasts.map((b) => {
            const requester = organisations.find(
              (o) => o.id === b.requesterOrgId
            );
            const isRequester = b.requesterOrgId === activeOrgId;

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-5 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {b.needType} • {b.city}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        b.status === "Matched & Dispatched"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {b.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Requested by{" "}
                      <strong className="text-slate-200">
                        {requester?.name}
                      </strong>{" "}
                      • Needed: {b.neededWindow}
                    </p>
                  </div>

                  {/* Offer Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400 block mb-0.5">
                        Proposed Terms:
                      </span>
                      {b.offeredTerms}
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm shrink-0">
                      ${b.offeredRateUsd}/day
                    </div>
                  </div>

                  {b.handoverPin && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                      <span className="text-xs text-emerald-200 font-semibold flex items-center gap-2">
                        <KeyRound className="size-4 text-emerald-400" />
                        Matched! Show Handover PIN at Pickup:
                      </span>
                      <span className="font-mono font-semibold text-base px-3 py-1 rounded-lg bg-emerald-500 text-slate-950">
                        {b.handoverPin}
                      </span>
                    </div>
                  )}

                  {/* Incoming Offers */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-slate-300">
                      Partner Offers & Counter-Bids ({b.bids.length})
                    </div>

                    {b.bids.length === 0 ? (
                      <div className="text-xs text-slate-400 p-4 rounded-xl border border-dashed border-slate-800 text-center">
                        No offers yet. Partner newsrooms can send an offer or counter-bid below.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {b.bids.map((bid) => (
                          <div
                            key={bid.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                              bid.status === "Accepted"
                                ? "border-emerald-500/50 bg-emerald-950/20"
                                : "border-slate-800 bg-slate-900/80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-sm">
                                {bid.bidderName}
                              </span>
                              <span className="font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ${bid.proposedRateUsd} / day
                              </span>
                            </div>
                            <div className="text-slate-200 font-medium">
                              Offering: {bid.resourceTitle}
                            </div>
                            <div className="text-slate-400">
                              {bid.counterTerms} •{" "}
                              <span className="text-teal-300">
                                {bid.etaNote}
                              </span>
                            </div>

                            {b.status !== "Matched & Dispatched" && (
                              <div className="pt-2 flex justify-end">
                                {isRequester ? (
                                  <button
                                    onClick={() =>
                                      onAcceptBid({
                                        broadcastId: b.id,
                                        bidId: bid.id,
                                      })
                                    }
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                                  >
                                    Accept Offer & Get Handover PIN ✓
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      onSwitchOrg(b.requesterOrgId)
                                    }
                                    className="text-xs text-teal-400 hover:underline font-medium cursor-pointer"
                                  >
                                    Switch to {requester?.shortName} to accept this offer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {b.status !== "Matched & Dispatched" && !isRequester && (
                  <button
                    onClick={() => {
                      setBiddingBroadcast(b);
                      setBidRate(b.offeredRateUsd);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <ArrowLeftRight className="size-4" />
                    Send Offer or Counter-Bid as {activeOrg.shortName}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: MY BOOKINGS & HANDOVER CHECKLISTS */}
      {subTab === "bookings" && (
        <div className="space-y-4">
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
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">
                      {resItem?.title}
                    </h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-slate-800 text-teal-300 border border-slate-700 font-semibold">
                      Handover PIN: {req.handoverPin}
                    </span>
                    <span
                      className={`text-xs px-3 py-0.5 rounded-full font-semibold ${
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

                  <p className="text-sm text-slate-300">
                    <strong>{requester?.name}</strong> borrowing from{" "}
                    <strong>{owner?.name}</strong> • Dates: {req.requestedDates}
                  </p>

                  <p className="text-xs text-slate-400">
                    Assignment: {req.purpose} • Terms: {req.proposedTerms} ($
                    {req.offeredRateUsd}/day)
                  </p>

                  {req.counterOfferTerms && (
                    <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
                      Owner Counter-Offer (${req.counterRateUsd}/day):{" "}
                      {req.counterOfferTerms}
                    </div>
                  )}

                  {(req.conditionOnCheckout || req.conditionOnReturn) && (
                    <div className="text-xs text-emerald-300/90 bg-emerald-950/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                      {req.conditionOnCheckout &&
                        `✓ Checkout Verified: ${req.conditionOnCheckout}`}{" "}
                      {req.conditionOnReturn &&
                        `| ✓ Return Verified: ${req.conditionOnReturn}`}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                          >
                            Approve & Verify Handover ✓
                          </button>
                          <button
                            onClick={() => {
                              setCounteringRequest(req);
                              setCounterRateInput(req.offeredRateUsd + 15);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs cursor-pointer"
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
                              `Returned in Excellent condition; SN ${resItem?.serialNumber} verified`
                            );
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Confirm Equipment Return ✓
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
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Accept Counter-Offer (${req.counterRateUsd}/d) ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => onSwitchOrg(req.ownerOrgId)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Switch to {owner?.shortName} to Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Post Urgent Field Need */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleBroadcastSubmit}
            className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-amber-400">
                  Urgent Field Need Broadcast
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Request Gear or Field Crew from Nearby Newsrooms
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  What do you need?
                </label>
                <input
                  type="text"
                  required
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g., 4K Drone + Operator for Umzingwane Dam Aerial Survey"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    City Hub
                  </label>
                  <select
                    value={bCity}
                    onChange={(e) => setBCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="Bulawayo">Bulawayo</option>
                    <option value="Harare">Harare</option>
                    <option value="Mutare">Mutare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dates / Time Needed
                  </label>
                  <input
                    type="text"
                    required
                    value={bWindow}
                    onChange={(e) => setBWindow(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Proposed Daily Allowance (USD $)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bRate}
                    onChange={(e) => setBRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Need Category
                  </label>
                  <select
                    value={bNeedType}
                    onChange={(e) =>
                      setBNeedType(
                        e.target.value as DispatchBroadcast["needType"]
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
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
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Co-Byline / Exchange Offer
                </label>
                <input
                  type="text"
                  required
                  value={bTerms}
                  onChange={(e) => setBTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Publish Field Need
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Submit Bid / Counter-Offer on a Field Broadcast */}
      {biddingBroadcast && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleBidSubmit}
            className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-amber-400">
                  Respond as {activeOrg.name}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
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
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Equipment & Crew You Are Offering
                </label>
                <input
                  type="text"
                  required
                  value={bidResourceTitle}
                  onChange={(e) => setBidResourceTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Your Daily Rate ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={bidRate}
                    onChange={(e) => setBidRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Pickup / Dispatch Readiness
                  </label>
                  <input
                    type="text"
                    required
                    value={bidEta}
                    onChange={(e) => setBidEta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Credit & Insurance Conditions
                </label>
                <input
                  type="text"
                  required
                  value={bidCounterTerms}
                  onChange={(e) => setBidCounterTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBiddingBroadcast(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Send Offer
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
            className="w-full max-w-lg rounded-2xl border border-teal-500/50 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-teal-400">
                  Book Equipment • Serial #{bookingResource.serialNumber}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
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
                <label className="block text-slate-300 font-medium mb-1">
                  Story / Investigation Purpose
                </label>
                <input
                  type="text"
                  required
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dates Needed
                  </label>
                  <input
                    type="text"
                    required
                    value={reqDates}
                    onChange={(e) => setReqDates(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Daily Contribution ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={reqRate}
                    onChange={(e) => setReqRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Attribution / Exchange Terms
                </label>
                <input
                  type="text"
                  required
                  value={reqTerms}
                  onChange={(e) => setReqTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingResource(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Confirm Booking Request
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
            className="w-full max-w-md rounded-2xl border border-amber-500/50 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">
              Propose Counter-Terms
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Counter Daily Rate ($ USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={counterRateInput}
                  onChange={(e) => setCounterRateInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Updated Terms
                </label>
                <input
                  type="text"
                  required
                  value={counterTermsInput}
                  onChange={(e) => setCounterTermsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCounteringRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Send Counter-Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Physical Handover Checklist */}
      {handoverRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleHandoverComplete}
            className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-emerald-400">
                Equipment Handover Checklist • PIN: {handoverRequest.handoverPin}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Confirm Equipment Condition
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chkSerial}
                  onChange={(e) => setChkSerial(e.target.checked)}
                  className="rounded accent-teal-500 size-4"
                />
                <span className="text-slate-200">
                  Serial Number & Lenses Inspected (Clean / Working)
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chkBattery}
                  onChange={(e) => setChkBattery(e.target.checked)}
                  className="rounded accent-teal-500 size-4"
                />
                <span className="text-slate-200">
                  Batteries Charged & Media Cards Ready
                </span>
              </label>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Handover Note
                </label>
                <input
                  type="text"
                  required
                  value={chkNote}
                  onChange={(e) => setChkNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandoverRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Confirm Handover ✓
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
