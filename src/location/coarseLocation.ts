import type { Coordinate } from "../journey/snailCrawl";

const METERS_PER_DEGREE_LATITUDE = 111320;

export function coarsenCoordinate(
  coordinate: Coordinate,
  precisionMeters = 50
): Coordinate {
  const latitudeStep = precisionMeters / METERS_PER_DEGREE_LATITUDE;
  const longitudeStep =
    precisionMeters /
    Math.max(
      1,
      METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(coordinate.latitude))
    );

  return {
    latitude: roundToStep(coordinate.latitude, latitudeStep),
    longitude: roundToStep(coordinate.longitude, longitudeStep)
  };
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
