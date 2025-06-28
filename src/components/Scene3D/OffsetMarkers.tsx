import { useStore } from "../../app/store";
import { useShallow } from "zustand/react/shallow";
import { Html } from "@react-three/drei";
import { Color } from "three";

export const OffsetMarkers = () => {
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const activeModes = useStore(useShallow(x => x.activeModes));

    // Get G92 offset
    const g92Offset = gCodeOffsets.G92 || {x: 0, y: 0, z: 0};

    // Get all offsets (including G92) that are not at origin
    const validOffsets = Object.entries(gCodeOffsets).filter(([key, position]) =>
        (key.startsWith('G5')) &&
        (position.x !== 0 || position.y !== 0 || position.z !== 0)
    );

    return (
        <>
            {validOffsets.map(([offset, position]) => {
                // Apply G92 offset to work coordinate systems (G54-G59), but not to G92 itself
                const effectivePosition = offset === 'G92'
                    ? position
                    : {
                        x: position.x + g92Offset.x,
                        y: position.y + g92Offset.y,
                        z: position.z + g92Offset.z
                    };

                return (
                    <group key={offset} position={[effectivePosition.x, effectivePosition.y, effectivePosition.z]}>
                        {/* Vertical line */}
                        <mesh>
                            <cylinderGeometry args={[0.5, 0.5, 20, 8]}/>
                            <meshStandardMaterial
                                color={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                emissive={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                        {/* Horizontal crosshair */}
                        <group rotation={[0, 0, Math.PI / 2]}>
                            <mesh>
                                <cylinderGeometry args={[0.5, 0.5, 20, 8]}/>
                                <meshStandardMaterial
                                    color={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                    emissive={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                    emissiveIntensity={0.5}
                                />
                            </mesh>
                        </group>
                        {/* Depth crosshair */}
                        <group rotation={[Math.PI / 2, 0, 0]}>
                            <mesh>
                                <cylinderGeometry args={[0.5, 0.5, 20, 8]}/>
                                <meshStandardMaterial
                                    color={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                    emissive={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                    emissiveIntensity={0.5}
                                />
                            </mesh>
                        </group>
                        <Html position={[0, 12, 0]} center>
                            <div
                                className={`${activeModes?.WorkCoordinateSystem === offset ? 'bg-green-600/80' : 'bg-black/80'} text-white px-0.5 py-0.5 rounded text-sm font-mono`}>
                                {offset}
                            </div>
                        </Html>
                    </group>
                );
            })}
         </>
    );
}; 