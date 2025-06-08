import {Html} from '@react-three/drei';
import {useStore} from '../../app/store';
import {useShallow} from 'zustand/react/shallow';
import {processor} from './GCodeToPointProcessor';
import {useState} from 'react';
import {Color} from 'three';

interface HoverDotsProps {
    gCodeLineNumber: number;
}

export const HoverDots: React.FC<HoverDotsProps> = ({gCodeLineNumber}) => {
    const toolPathGCodes = useStore(useShallow(x => x.toolPathGCodes));
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; z: number } | null>(null);

    if (!toolPathGCodes) return null;

    const completeData = processor.processCommands(toolPathGCodes.filter(x => x.hasMove));
    const feedMoveStartPoints = completeData.feedMoveStartPoints.flatMap(group =>
        group.filter(point => point.gCodeLineNumber === gCodeLineNumber)
    );

    return (
        <>
            {feedMoveStartPoints.map((point, index) => (
                <group key={`hover-dot-${index}`} position={[point.point.x, point.point.y, point.point.z]}>
                    <mesh
                        onPointerOver={() => setHoveredPoint(point.point)}
                        onPointerOut={() => setHoveredPoint(null)}
                    >
                        <sphereGeometry args={[0.5, 16, 16]}/>
                        <meshStandardMaterial
                            color={new Color(0x00ff00)}
                            transparent
                            opacity={0.6}
                        />
                    </mesh>
                    {hoveredPoint && (
                        <Html center>
                            <div className="bg-black/80 text-white px-2 py-1 rounded text-sm font-mono">
                                X: {point.point.x.toFixed(2)}<br/>
                                Y: {point.point.y.toFixed(2)}<br/>
                                Z: {point.point.z.toFixed(2)}
                            </div>
                        </Html>
                    )}
                </group>
            ))}
        </>
    );
}; 