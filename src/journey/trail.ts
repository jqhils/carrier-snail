export type FadingTrailSegment = {
  fromProgress: number;
  opacity: number;
  toProgress: number;
};

export function buildFadingTrailSegments({
  progress,
  segmentCount
}: {
  progress: number;
  segmentCount: number;
}): FadingTrailSegment[] {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  if (clampedProgress === 0 || segmentCount <= 0) {
    return [];
  }

  const segmentLength = clampedProgress / segmentCount;

  return Array.from({ length: segmentCount }, (_, index) => {
    const ageRatio = (index + 1) / segmentCount;

    return {
      fromProgress: segmentLength * index,
      opacity: 0.12 + ageRatio * 0.58,
      toProgress: segmentLength * (index + 1)
    };
  });
}
