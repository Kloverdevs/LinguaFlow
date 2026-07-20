import { describe, it, expect } from 'vitest';
import { clampFabPosition } from '@/content/floating-button';

describe('clampFabPosition', () => {
  const VW = 1000;
  const VH = 800;
  const SIZE = 48;

  it('keeps an in-bounds position unchanged', () => {
    expect(clampFabPosition(200, 300, VW, VH, SIZE)).toEqual({ x: 200, y: 300 });
  });

  it('clamps negative coordinates to 0', () => {
    expect(clampFabPosition(-50, -20, VW, VH, SIZE)).toEqual({ x: 0, y: 0 });
  });

  it('clamps to the far edge accounting for button size', () => {
    expect(clampFabPosition(9999, 9999, VW, VH, SIZE)).toEqual({
      x: VW - SIZE,
      y: VH - SIZE,
    });
  });

  it('handles a viewport smaller than the button', () => {
    expect(clampFabPosition(100, 100, 30, 30, SIZE)).toEqual({ x: 0, y: 0 });
  });

  it('clamps exactly at the boundary', () => {
    expect(clampFabPosition(VW - SIZE, VH - SIZE, VW, VH, SIZE)).toEqual({
      x: VW - SIZE,
      y: VH - SIZE,
    });
  });
});
