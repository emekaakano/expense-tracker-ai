'use client';

import { useMemo } from 'react';

interface PseudoQRProps {
  value: string;
  size?: number;
  cells?: number;
  color?: string;
  background?: string;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function isFinderPattern(x: number, y: number, n: number): boolean | null {
  const inFinder = (cx: number, cy: number): boolean | null => {
    const dx = x - cx;
    const dy = y - cy;
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return null;
    if (dx === 0 || dx === 6 || dy === 0 || dy === 6) return true;
    if (dx === 1 || dx === 5 || dy === 1 || dy === 5) return false;
    return true;
  };
  const corners: [number, number][] = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  for (const [cx, cy] of corners) {
    const v = inFinder(cx, cy);
    if (v !== null) return v;
  }
  if ((x === 6 && y > 6 && y < n - 7) || (y === 6 && x > 6 && x < n - 7)) {
    return (x + y) % 2 === 0;
  }
  return null;
}

export function PseudoQR({
  value,
  size = 144,
  cells = 25,
  color = '#0f172a',
  background = '#ffffff',
}: PseudoQRProps) {
  const grid = useMemo(() => {
    const seed = hashString(value);
    const rand = mulberry32(seed);
    const cellList: boolean[][] = [];
    for (let y = 0; y < cells; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < cells; x++) {
        const finder = isFinderPattern(x, y, cells);
        if (finder !== null) row.push(finder);
        else row.push(rand() > 0.5);
      }
      cellList.push(row);
    }
    return cellList;
  }, [value, cells]);

  const cellSize = size / cells;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`QR code for ${value}`}
      className="rounded-lg"
    >
      <rect width={size} height={size} fill={background} />
      {grid.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}
