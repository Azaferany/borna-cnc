import { useStore } from "../../app/store";
import { useShallow } from "zustand/react/shallow";
import { Html } from "@react-three/drei";
import { Color } from "three";

export const OffsetMarkers = () => {
    const gCodeOffsets = useStore(useShallow(x => x.gCodeOffsets));
    const activeModes = useStore(useShallow(x => x.activeModes));

    // Only show G54-G59 offsets that are not at origin
    const validOffsets = Object.entries(gCodeOffsets).filter(([key, position]) => 
        key.startsWith('G5') && 
        key !== 'G92' && 
        (position.x !== 0 || position.y !== 0 || position.z !== 0)
    );

    return (
        <>
            {validOffsets.map(([offset, position]) => (
                <group key={offset} position={[position.x, position.y, position.z]}>
                    {/* Vertical line */}
                    <mesh>
                        <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
                        <meshStandardMaterial 
                            color={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                            emissive={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                    {/* Horizontal crosshair */}
                    <group rotation={[0, 0, Math.PI / 2]}>
                        <mesh>
                            <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
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
                            <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
                            <meshStandardMaterial 
                                color={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                emissive={activeModes?.WorkCoordinateSystem === offset ? new Color(0x00ff00) : new Color(0xff0000)}
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                    </group>
                    <Html position={[0, 12, 0]} center>
                        <div className={`${activeModes?.WorkCoordinateSystem === offset ? 'bg-green-600/80' : 'bg-black/80'} text-white px-0.5 py-0.5 rounded text-sm font-mono`}>
                            {offset}
                        </div>
                    </Html>
                </group>
            ))}
        </>
    );
}; 