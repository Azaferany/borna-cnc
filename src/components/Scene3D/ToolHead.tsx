import {Vector3} from "three";
import type {GCodeCommand, Point3D} from "../../types/GCodeTypes.ts";

export const ToolHead: React.FC<{ position: Point3D,gCodeCommand?:GCodeCommand }> = ({ position}) => {

    return (
        <group position={new Vector3(position.x,position.y,position.z)}
               rotation={[Math.PI / 2, 0, 0]}
/*               rotation={ gCodeCommand ? new Euler(
            -THREE.MathUtils.degToRad((gCodeCommand.endA! - gCodeCommand.startA) / 2 + gCodeCommand.startA),
            -THREE.MathUtils.degToRad((gCodeCommand.endB! - gCodeCommand.startB)/2 + gCodeCommand.startB),
            -THREE.MathUtils.degToRad((gCodeCommand.endC! - gCodeCommand.startC)/2 + gCodeCommand.startC)
        ) : undefined}*/
        >
            {/* Tool holder */}
            <mesh position={[0, 40.5, 0]} >
                <cylinderGeometry args={[6, 6, 50, 16]} />
                <meshStandardMaterial color="#ffa500" roughness={0.2} />
            </mesh>
            {/* Tool tip */}
            <mesh position={[0, 7.6, 0]}>
                <coneGeometry args={[6, -16, 32,16]} />
                <meshStandardMaterial color="#ffa500" roughness={0.2} />
            </mesh>
            {/* Position indicator */}
        </group>
    );
};