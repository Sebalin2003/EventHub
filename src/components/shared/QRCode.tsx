// Deterministic pixel-art QR visual derived from the ticket code string
export default function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const GRID = 21
  const cell = size / GRID

  // Deterministic hash: map each char to a bit
  function bit(r: number, c: number): boolean {
    // Finder patterns (corners)
    const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c > GRID - 8) || (r > GRID - 8 && c < 7)
    if (inFinder(r, c)) {
      const ro = r > GRID - 8 ? r - (GRID - 7) : r
      const co = c > GRID - 8 ? c - (GRID - 7) : c
      const border = ro === 0 || ro === 6 || co === 0 || co === 6
      const inner = ro >= 2 && ro <= 4 && co >= 2 && co <= 4
      return border || inner
    }
    // Data modules — deterministic from value string
    const idx = (r * GRID + c) % value.length
    const charCode = value.charCodeAt(idx % value.length)
    return ((charCode ^ (r * 7) ^ (c * 13)) & 1) === 0
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width={size} height={size} fill="#fff" />
      {Array.from({ length: GRID }).map((_, r) =>
        Array.from({ length: GRID }).map((_, c) =>
          bit(r, c) ? (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1B2A4A" />
          ) : null
        )
      )}
    </svg>
  )
}

