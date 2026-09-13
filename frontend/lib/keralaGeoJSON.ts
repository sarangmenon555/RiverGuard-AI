import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { KERALA_STATE_OUTLINE, DISTRICT_BOUNDARIES } from "./keralaBoundaries";

export interface DistrictFeatureProps {
  id: string;
}

export type DistrictFeature = GeoJSON.Feature<GeoJSON.Polygon, DistrictFeatureProps>;

export function getStateFeature(): GeoJSON.Feature<GeoJSON.Polygon, {}> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [KERALA_STATE_OUTLINE],
    },
  };
}

export function getDistrictFeatureCollection(): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  DistrictFeatureProps
> {
  const features: DistrictFeature[] = Object.entries(DISTRICT_BOUNDARIES).map(
    ([id, ring]) => ({
      type: "Feature",
      properties: { id },
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    })
  );

  return {
    type: "FeatureCollection",
    features,
  };
}

export function getDistrictFeature(id: string): DistrictFeature | undefined {
  const ring = DISTRICT_BOUNDARIES[id];
  if (!ring) return undefined;
  return {
    type: "Feature",
    properties: { id },
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

// Shared projection setup so every layer drawn on top of the map (district
// fills, the rainfall overlay, future layers) uses identical geographic
// alignment. Always call this with the same width/height/padding as the
// base map for a given view.
export function createMapProjection(
  width: number,
  height: number,
  padding: number
) {
  const stateFeature = getStateFeature();
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    stateFeature as GeoPermissibleObjects
  );
  const pathGenerator = geoPath(projection);
  return { projection, pathGenerator, stateFeature };
}
