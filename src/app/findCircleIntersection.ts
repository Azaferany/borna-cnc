import {Plane, type Point3D} from "../types/GCodeTypes.ts";

/**
 * Finds the intersection points of two circles projected onto a specified plane.
 * The third dimension of the returned points is an approximation based on the average
 * of the input circle centers for the corresponding axis.
 *
 * This function handles cases where circles don't intersect, are tangent, or are coincident.
 *
 * @param center1 The 3D center of the first circle.
 * @param radius1 The radius of the first circle.
 * @param center2 The 3D center of the second circle.
 * @param radius2 The radius of the second circle.
 * @param plane The plane onto which the circles are projected (XY, XZ, or YZ).
 * @param clockwise If true, the first returned point will be "clockwise" relative to the line from proj1 to proj2,
 * and the second will be "counter-clockwise". Otherwise, the order is reversed.
 * @returns An array of Point3D objects representing the intersection points.
 * - Returns an empty array if there are no intersections.
 * - Returns one point if the circles are tangent.
 * - Returns two points if there are two distinct intersections.
 * - Throws an error if circles are coincident (infinite intersections).
 */
export function findCircleIntersection(
    center1: Point3D,
    radius1: number,
    center2: Point3D,
    radius2: number,
    plane: Plane,
    clockwise: boolean = true
): Point3D[] {
    // Project circles onto the specified plane
    const proj1 = projectToPlane(center1, plane);
    const proj2 = projectToPlane(center2, plane);

    // Calculate distance between projected centers
    const dx = proj2.x - proj1.x;
    const dy = proj2.y - proj1.y;
    const distanceSq = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSq);

    // --- Handle Edge Cases ---

    // 1. Circles are too far apart (no intersection)
    if (distance > radius1 + radius2 + Number.EPSILON) {
        return [];
    }

    // 2. One circle is entirely inside the other (no intersection)
    if (distance < Math.abs(radius1 - radius2) - Number.EPSILON) {
        return [];
    }

    // 3. Circles are coincident (infinite intersections)
    // Check if centers are the same and radii are the same
    if (distance < Number.EPSILON && Math.abs(radius1 - radius2) < Number.EPSILON) {
        throw new Error("Circles are coincident; infinite intersection points.");
    }

    // Calculate intersection points
    // 'a' is the distance from proj1 to the radical line along the line connecting the centers
    const a = (radius1 * radius1 - radius2 * radius2 + distanceSq) / (2 * distance);

    // 'h' is the half-length of the chord connecting the intersection points
    const hSq = radius1 * radius1 - a * a;
    // Handle floating point inaccuracies that might make hSq slightly negative near tangency
    const h = Math.sqrt(Math.max(0, hSq)); // Ensure h is not NaN if hSq is tiny negative

    // Point on the line between centers, where the perpendicular chord intersects
    const px = proj1.x + a * (dx / distance);
    const py = proj1.y + a * (dy / distance);

    // If h is effectively zero, circles are tangent
    if (h < Number.EPSILON) {
        // Tangent case: only one intersection point
        const tangentPoint = unprojectFromPlane({ x: px, y: py }, plane, center1, center2);
        return [tangentPoint];
    }

    // Calculate two intersection points
    const offsetX = h * (-dy / distance);
    const offsetY = h * (dx / distance);

    let point1: Point3D, point2: Point3D;

    // The clockwise parameter determines the order of the two returned points
    // relative to the vector (dx, dy) from proj1 to proj2.
    // If clockwise, (px + offsetX, py + offsetY) will be "to the right" of the vector,
    // and (px - offsetX, py - offsetY) will be "to the left".
    if (clockwise) {
        point1 = unprojectFromPlane({ x: px + offsetX, y: py + offsetY }, plane, center1, center2);
        point2 = unprojectFromPlane({ x: px - offsetX, y: py - offsetY }, plane, center1, center2);
    } else {
        point1 = unprojectFromPlane({ x: px - offsetX, y: py - offsetY }, plane, center1, center2);
        point2 = unprojectFromPlane({ x: px + offsetX, y: py + offsetY }, plane, center1, center2);
    }

    return [point1, point2];
}

function projectToPlane(point: Point3D, plane: Plane): { x: number; y: number } {
    switch (plane) {
        case Plane.XY:
            return { x: point.x, y: point.y };
        case Plane.XZ:
            // For XZ plane, 'y' in 2D corresponds to 'z' in 3D
            return { x: point.x, y: point.z };
        case Plane.YZ:
            // For YZ plane, 'x' in 2D corresponds to 'z' in 3D, 'y' in 2D corresponds to 'y' in 3D
            return { x: point.z, y: point.y };
        default:
            // This case should ideally not be reached if Plane is a strict enum
            throw new Error('Invalid plane specified');
    }
}

/**
 * Reconstructs a 3D point from a 2D projected point on a given plane.
 * The third dimension (the one "lost" during projection) is approximated by
 * the average of the corresponding coordinate from the two input circle centers.
 * This is a simplification and the reconstructed 3D point may not lie on the
 * original 3D circles if they are not coplanar with the projection plane.
 *
 * @param point2D The 2D point on the projected plane.
 * @param plane The plane onto which the original points were projected.
 * @param center1 The 3D center of the first circle (used for averaging the third coordinate).
 * @param center2 The 3D center of the second circle (used for averaging the third coordinate).
 * @returns A Point3D object.
 */
function unprojectFromPlane(
    point2D: { x: number; y: number },
    plane: Plane,
    center1: Point3D,
    center2: Point3D
): Point3D {
    // Use average of the two centers for the third coordinate
    // This assumes the circles are relatively "flat" or their centers are close
    // in the third dimension. This is an approximation.
    const avgCenter = {
        x: (center1.x + center2.x) / 2,
        y: (center1.y + center2.y) / 2,
        z: (center1.z + center2.z) / 2
    };

    switch (plane) {
        case Plane.XY:
            return { x: point2D.x, y: point2D.y, z: avgCenter.z };
        case Plane.XZ:
            // XZ plane: 2D x -> 3D x, 2D y -> 3D z
            return { x: point2D.x, y: avgCenter.y, z: point2D.y };
        case Plane.YZ:
            // YZ plane: 2D x -> 3D z, 2D y -> 3D y
            return { x: avgCenter.x, y: point2D.y, z: point2D.x };
        default:
            throw new Error('Invalid plane specified');
    }
}