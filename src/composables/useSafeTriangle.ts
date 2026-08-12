type SafeTrianglePoint = {
  x: number;
  y: number;
};

type SafeTriangleTargetBounds = {
  left: number;
  top: number;
  bottom: number;
};

type SafeTriangleOptions = {
  padding?: number;
  tolerance?: number;
};

const toPoint = (event: MouseEvent): SafeTrianglePoint => ({
  x: event.clientX,
  y: event.clientY,
});

const triangleArea = (
  first: SafeTrianglePoint,
  second: SafeTrianglePoint,
  third: SafeTrianglePoint,
) => Math.abs(
  (first.x * (second.y - third.y)
    + second.x * (third.y - first.y)
    + third.x * (first.y - second.y)) / 2,
);

export const isPointInSafeTriangle = (
  point: SafeTrianglePoint,
  triangleA: SafeTrianglePoint,
  triangleB: SafeTrianglePoint,
  triangleC: SafeTrianglePoint,
  tolerance = 0.5,
) => {
  const area = triangleArea(triangleA, triangleB, triangleC);
  const pointArea = triangleArea(point, triangleB, triangleC)
    + triangleArea(triangleA, point, triangleC)
    + triangleArea(triangleA, triangleB, point);
  return Math.abs(area - pointArea) < tolerance;
};

export function useSafeTriangle(options: SafeTriangleOptions = {}) {
  const padding = options.padding ?? 12;
  const tolerance = options.tolerance ?? 0.5;
  let previousPointer: SafeTrianglePoint | null = null;
  let currentPointer: SafeTrianglePoint | null = null;

  const trackPointer = (event: MouseEvent) => {
    previousPointer = currentPointer;
    currentPointer = toPoint(event);
  };

  const reset = () => {
    previousPointer = null;
    currentPointer = null;
  };

  const isAimingAt = (event: MouseEvent, target: SafeTriangleTargetBounds) => {
    const current = toPoint(event);
    const previous = previousPointer ?? currentPointer;
    if (!previous) return false;
    if (current.x <= previous.x) return false;
    if (current.x >= target.left) return false;

    return isPointInSafeTriangle(
      current,
      previous,
      {
        x: target.left,
        y: target.top - padding,
      },
      {
        x: target.left,
        y: target.bottom + padding,
      },
      tolerance,
    );
  };

  return {
    isAimingAt,
    reset,
    trackPointer,
  };
}
