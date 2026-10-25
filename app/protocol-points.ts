type PointStation = { id: string; point: string; targets: { point: string }[] };

// Read only the active protocol. Do not suggest the station's own unfinished input.
export function protocolPointSuggestions(stations: readonly PointStation[], editingStationId: string): string[] {
  const points = new Set<string>();
  for (const station of stations) {
    const candidates = [
      ...(station.id === editingStationId ? [] : [station.point]),
      ...station.targets.map(target => target.point),
    ];
    for (const value of candidates) {
      const point = value.trim();
      if (point) points.add(point);
    }
  }
  return [...points];
}

// Walk earlier protocol entries backwards: targets follow their station setup.
// The current setup is excluded so its input cannot become its own suggestion.
export function lastInstrumentHeightSuggestions(
  stations: readonly { id: string; point: string; instrumentHeight: string; targets: { point: string; height: string }[] }[],
  editingStationId: string,
  point: string,
): string[] {
  const number = point.trim();
  if (!number) return [];
  const index = stations.findIndex(station => station.id === editingStationId);
  if (index < 0) return [];
  for (let i = index - 1; i >= 0; i--) {
    const station = stations[i];
    for (let j = station.targets.length - 1; j >= 0; j--) {
      const target = station.targets[j];
      if (target.point.trim() === number && target.height.trim()) {
        return [target.height.trim()];
      }
    }
    if (station.point.trim() === number && station.instrumentHeight.trim()) {
      return [station.instrumentHeight.trim()];
    }
  }
  return [];
}
