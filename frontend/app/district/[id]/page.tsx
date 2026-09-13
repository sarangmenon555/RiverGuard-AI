"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLocations, fetchDashboard } from "@/lib/api";
import DistrictCard from "@/components/DistrictCard";
import { useParams } from "next/navigation";

export default function DistrictDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: Infinity,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const district = locationsData?.districts.find((d) => d.id === id);
  const prediction = dashboard?.districts.find((d) => d.district_id === id);

  if (!district) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-slate-400">
        Loading district information...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{district.name}</h1>
      <p className="mt-1 text-slate-400">
        Primary river system: {district.river}
      </p>

      <div className="mt-6">
        <DistrictCard district={district} prediction={prediction} />
      </div>
    </div>
  );
}
