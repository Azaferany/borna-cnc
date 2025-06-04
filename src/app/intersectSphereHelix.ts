import {Plane, type Point3D} from "../types/GCodeTypes.ts";

/**
 * Computes the intersection points (if any) between:
 * 1) A sphere with center `sphereCenter` and radius `sphereRadius`.
 * 2) A one‐turn helix with:
 * - center `helixCenter`
 * - radius `helixRadius`
 * - pitch `pitch`
 * - lying in plane `plane`
 * - orientation `clockwise` (true = negative angular direction)
 *
 * Returns an array of intersection points (0, 1, or 2 elements).
 */
export function intersectSphereHelix(
    sphereCenter: Point3D,
    sphereRadius: number,
    helixCenter: Point3D,
    helixRadius: number,
    pitch: number,
    plane: Plane,
    clockwise: boolean
): Point3D[] {
    // Sign factor for sine term: clockwise => -1, else +1
    const s: number = clockwise ? -1 : 1;

    // Number of samples to bracket roots in [0, 2π].
    // Increase for greater robustness (e.g., 2000).
    const N = 360 * 1000; // Keeping original sample count
    const TWO_PI = 2 * Math.PI;
    const dt = TWO_PI / N;
    const EPSILON = 1e-15; // A small epsilon for floating-point comparisons

    /**
     * Parametric helix function H(t): returns the [x, y, z] for a given t ∈ [0, 2π].
     */
    function helixPoint(t: number): Point3D {
        // Common circular coordinates
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        // Linear advance along the "axis" over one turn:
        const linearAdvance = (pitch / TWO_PI) * t;

        switch (plane) {
            case Plane.XY:
                return {
                    x: helixCenter.x + helixRadius * cosT,
                    y: helixCenter.y + s * helixRadius * sinT,
                    z: helixCenter.z + linearAdvance
                };
            case Plane.XZ:
                return {
                    x: helixCenter.x + helixRadius * cosT,
                    y: helixCenter.y + linearAdvance,
                    z: helixCenter.z + s * helixRadius * sinT
                };
            case Plane.YZ:
                return {
                    x: helixCenter.x + linearAdvance,
                    y: helixCenter.y + helixRadius * cosT,
                    z: helixCenter.z + s * helixRadius * sinT
                };
            default:
                // This case should ideally be handled with an error or more robust default
                // For now, mirroring original behavior.
                return { x: 0, y: 0, z: 0 };
        }
    }

    /**
     * f(t) = ||H(t) - sphereCenter||^2 - sphereRadius^2.
     * A root of f(t)=0 indicates intersection.
     */
    function f(t: number): number {
        const H = helixPoint(t);
        const dx = H.x - sphereCenter.x;
        const dy = H.y - sphereCenter.y;
        const dz = H.z - sphereCenter.z;
        return dx * dx + dy * dy + dz * dz - sphereRadius * sphereRadius;
    }

    /**
     * Bisection to refine a root in [tL, tR] until |f(tMid)| < tol or max iterations.
     */
    function findRootBisection(tL: number, tR: number, tol = 1e-8, maxIter = 50): number | null {
        const fL = f(tL);
        const fR = f(tR);

        // Check for exact roots at boundaries within tolerance
        if (Math.abs(fL) < tol) return tL;
        if (Math.abs(fR) < tol) return tR;

        // If no sign change or both are positive/negative, no root in this interval
        // Also handle cases where fL or fR are very close to zero but not exactly zero
        if (fL * fR > 0 && Math.abs(fL) > tol && Math.abs(fR) > tol) return null;

        let a = tL, b = tR;
        let fa = fL, fb = fR;
        let c = 0, fc = 0;

        for (let i = 0; i < maxIter; i++) {
            c = 0.5 * (a + b);
            fc = f(c);

            if (Math.abs(fc) < tol) {
                return c;
            }

            // Decide which subinterval to keep
            // Use tolerance for comparisons to avoid infinite loops near zero
            if (fa * fc < 0) { // Sign change between a and c
                b = c;
                fb = fc;
            } else { // Sign change between c and b, or no sign change (move 'a' to 'c')
                a = c;
                fa = fc;
            }

            // If interval becomes too small, return current midpoint
            if (Math.abs(b - a) < tol) return c;
        }
        // If max iterations reached, return best estimate
        return c;
    }

    // 1. Sample f(t) at N points to find sign changes.
    const roots: number[] = [];
    let tPrev = 0;
    let fPrev = f(tPrev);

    for (let i = 1; i <= N; i++) {
        const tCurr = i * dt;
        const fCurr = f(tCurr);

        // Check for sign change or if one of the values is close to zero
        if (fPrev * fCurr <= 0 || Math.abs(fPrev) < EPSILON || Math.abs(fCurr) < EPSILON) {
            // Attempt to bracket and refine root
            const tLeft = tPrev;
            const tRight = tCurr;
            const root = findRootBisection(tLeft, tRight);

            if (root !== null) {
                // Ensure uniqueness: check if the found root is significantly different from already added roots
                const alreadyFound = roots.some(existingRoot => Math.abs(existingRoot - root) < EPSILON * 10); // Use a slightly larger tolerance for uniqueness check
                if (!alreadyFound) {
                    // Clamp root into [0, 2π) range. Note: 2π should map to 0 effectively for a one-turn helix.
                    let rClamped = root % TWO_PI;
                    if (rClamped < 0) rClamped += TWO_PI; // Ensure positive value

                    roots.push(rClamped);
                }
            }
        }
        tPrev = tCurr;
        fPrev = fCurr;
    }

    // Sort roots to ensure consistent output order if needed, though not strictly required by problem
    roots.sort((a, b) => a - b);

    // 2. Map each root t_k to (x,y,z)
    const intersections: Point3D[] = roots.map(tk => helixPoint(tk));

    return intersections;
}

/**
 * Determines the order of two points on a single-turn helix.
 * Returns 1 if point1 comes before point2, 2 if point2 comes before point1, and 0 if they are considered the same.
 *
 * @param helixRadius The radius of the helix.
 * @param helixCenter The center of the helix's base.
 * @param helixPlane The plane in which the circular projection of the helix lies.
 * @param helixClockwise True if the helix is clockwise, false for counter-clockwise.
 * @param helixPitch The vertical displacement of the helix per full turn.
 * @param point1 The first point to compare.
 * @param point2 The second point to compare.
 */
export function determineHelixPointOrder(
    helixRadius: number,
    helixCenter: Point3D,
    helixPlane: Plane,
    helixClockwise: boolean,
    helixPitch: number,
    point1: Point3D,
    point2: Point3D
): number {
    // Helper function to calculate the angular position and height along the helix axis for a given point.
    const getPointParameters = (p: Point3D) => {
        let angle: number;
        let height: number;
        let xProj: number; // The x-coordinate in the 2D projection plane
        let yProj: number; // The y-coordinate in the 2D projection plane

        // Determine the projected coordinates and the height based on the helix plane.
        // The 'height' is always the coordinate along the helix's axis.
        switch (helixPlane) {
            case Plane.XY:
                // For XY plane, the projection is in X-Y, and Z is the helix axis.
                xProj = p.x - helixCenter.x;
                yProj = p.y - helixCenter.y;
                height = p.z - helixCenter.z;
                break;
            case Plane.XZ:
                // For XZ plane, the projection is in X-Z, and Y is the helix axis.
                // Note: p.z is treated as the 'y' component for atan2 in this projection.
                xProj = p.x - helixCenter.x;
                yProj = p.z - helixCenter.z;
                height = p.y - helixCenter.y;
                break;
            case Plane.YZ:
                // For YZ plane, the projection is in Y-Z, and X is the helix axis.
                // Note: p.y is treated as the 'x' component and p.z as the 'y' component for atan2.
                xProj = p.y - helixCenter.y;
                yProj = p.z - helixCenter.z;
                height = p.x - helixCenter.x;
                break;
            default:
                // Handle invalid plane input.
                throw new Error("Invalid helix plane specified.");
        }

        // Calculate the angle using atan2, which correctly handles all quadrants.
        angle = Math.atan2(yProj, xProj);
        // Normalize the angle to be between 0 and 2*PI for consistent comparison.
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        return { angle, height };
    };

    // Get parameters for both points.
    const params1 = getPointParameters(point1);
    const params2 = getPointParameters(point2);

    // Define a small tolerance for floating point comparisons to avoid precision issues.
    const epsilon = 1e-9;

    // Adjust the effective clockwise direction for the XZ plane.
    // This addresses the user's feedback that the XZ plane ordering was "reversed".
    // This implies that the user's definition of "clockwise" for XZ is opposite
    // to the standard mathematical interpretation when using atan2(Z, X) and looking down the positive Y-axis.
    let effectiveClockwise = helixClockwise;
    if (helixPlane === Plane.XZ) {
        effectiveClockwise = !helixClockwise;
    }

    // Compare points based on the effective winding direction.
    if (effectiveClockwise) {
        // For an effectively clockwise helix:
        // A larger angle means the point is "earlier" in the sequence (as angles decrease in a clockwise rotation).
        // If angles are approximately equal, then the point with smaller height is earlier.
        if (params1.angle > params2.angle + epsilon) {
            return 1; // point1 is earlier
        } else if (params2.angle > params1.angle + epsilon) {
            return 2; // point2 is earlier
        } else { // Angles are approximately equal
            if (params1.height < params2.height - epsilon) {
                return 1; // point1 is earlier (smaller height means earlier along the axis)
            } else if (params2.height < params1.height - epsilon) {
                return 2; // point2 is earlier
            } else {
                return 0; // Points are considered the same
            }
        }
    } else { // Effectively counter-clockwise
        // For an effectively counter-clockwise helix:
        // A smaller angle means the point is "earlier" in the sequence (as angles increase in a counter-clockwise rotation).
        // If angles are approximately equal, then the point with smaller height is earlier.
        if (params1.angle < params2.angle - epsilon) {
            return 1; // point1 is earlier
        } else if (params2.angle < params1.angle - epsilon) {
            return 2; // point2 is earlier
        } else { // Angles are approximately equal
            if (params1.height < params2.height - epsilon) {
                return 1; // point1 is earlier (smaller height means earlier along the axis)
            } else if (params2.height < params1.height - epsilon) {
                return 2; // point2 is earlier
            } else {
                return 0; // Points are considered the same
            }
        }
    }
}