"use client";

import { useState } from "react";
import { useBoundaryIndex } from "@/hooks/use-boundary-index";
import { UiButton, UiSpinner } from "@/components/ui/app-ui";

/** Homepage search: picks a location, then opens the explorer with it applied. */
export function AreaSearch() {
  const { index, failed } = useBoundaryIndex();
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  const provinces = index?.provinces.filter((item) => !region || item.region === region) ?? [];
  const cities = province ? (index?.cities.filter((item) => item.province === province) ?? []) : [];

  return (
    <form className="area-search" action="/explore" method="get" aria-label="Search lot plans by area">
      <label>
        <span>Region</span>
        <select
          name="region"
          value={region}
          disabled={!index}
          onChange={(event) => {
            setRegion(event.target.value);
            setProvince("");
            setCity("");
          }}
        >
          <option value="">All regions</option>
          {index?.regions.map((item) => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Province</span>
        <select
          name="province"
          value={province}
          disabled={!index}
          onChange={(event) => {
            setProvince(event.target.value);
            setCity("");
          }}
        >
          <option value="">All provinces</option>
          {provinces.map((item) => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>City / municipality</span>
        <select name="city" value={city} disabled={!province} onChange={(event) => setCity(event.target.value)}>
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Looking for</span>
        <select name="purpose" defaultValue="">
          <option value="">Land for sale</option>
          <option value="sale">Lots for sale</option>
        </select>
      </label>
      <UiButton className="area-search-submit" type="submit">Search lots</UiButton>
      <p className="area-search-note" role="status" aria-live="polite">
        {failed
          ? "The location list could not be loaded. You can still search every lot listing."
          : index
            ? `Search across ${index.provinces.length} provinces and ${index.cities.length.toLocaleString("en-PH")} cities and municipalities.`
            : <UiSpinner label="Loading locations" />}
      </p>
    </form>
  );
}
