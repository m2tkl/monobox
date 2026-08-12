import { describe, expect, it } from 'vitest';

import { isPointInSafeTriangle, useSafeTriangle } from './useSafeTriangle';

describe('isPointInSafeTriangle', () => {
  it('detects a point inside the triangle', () => {
    expect(isPointInSafeTriangle(
      { x: 6, y: 5 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    )).toBe(true);
  });

  it('detects a point outside the triangle', () => {
    expect(isPointInSafeTriangle(
      { x: 2, y: 8 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    )).toBe(false);
  });
});

describe('useSafeTriangle', () => {
  const mouseEvent = (clientX: number, clientY: number) => new MouseEvent('mousemove', {
    clientX,
    clientY,
  });

  it('keeps aiming while the pointer moves toward the target bounds', () => {
    const safeTriangle = useSafeTriangle({ padding: 0 });
    safeTriangle.trackPointer(mouseEvent(0, 5));

    expect(safeTriangle.isAimingAt(mouseEvent(6, 5), {
      left: 10,
      top: 0,
      bottom: 10,
    })).toBe(true);
  });

  it('does not keep aiming when the pointer moves away from the target', () => {
    const safeTriangle = useSafeTriangle({ padding: 0 });
    safeTriangle.trackPointer(mouseEvent(6, 5));

    expect(safeTriangle.isAimingAt(mouseEvent(4, 5), {
      left: 10,
      top: 0,
      bottom: 10,
    })).toBe(false);
  });
});
