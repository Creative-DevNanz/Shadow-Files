export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function falloffFactor(t: number, falloff: number): number {
    return Math.exp(-falloff * t);
}