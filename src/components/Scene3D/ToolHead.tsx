import {Vector3} from "three";
import type {GCodeCommand, Point3D} from "../../types/GCodeTypes.ts";

export const ToolHead: React.FC<{ position: Point3D,gCodeCommand?:GCodeCommand }> = ({ position}) => {

    return (
        <group position={new Vector3(position.x,position.y,position.z)}
/*               rotation={ gCodeCommand ? new Euler(
            -THREE.MathUtils.degToRad((gCodeCommand.endA! - gCodeCommand.startA) / 2 + gCodeCommand.startA),
            -THREE.MathUtils.degToRad((gCodeCommand.endB! - gCodeCommand.startB)/2 + gCodeCommand.startB),
            -THREE.MathUtils.degToRad((gCodeCommand.endC! - gCodeCommand.startC)/2 + gCodeCommand.startC)
        ) : undefined}*/
        >
            {/* Tool holder */}
            <mesh position={[0, 26, 0]}>
                <cylinderGeometry args={[2, 2, 36, 16]} />
                <meshStandardMaterial color="#0000ff" roughness={0.2} />
            </mesh>
            {/* Tool tip */}
            <mesh position={[0, 4, 0]}>
                <coneGeometry args={[2, -8, 32]} />
                <meshStandardMaterial color="#0000ff" roughness={0.2} />
            </mesh>
            {/* Position indicator */}
        </group>
    );
};