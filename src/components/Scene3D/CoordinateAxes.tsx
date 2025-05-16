import {Line} from "@react-three/drei";
import React from "react";

export const CoordinateAxes: React.FC = React.memo(() => (
    <group>
        <Line
            points={[[0, 0, 0], [50, 0, 0]]}
            color="red"
            lineWidth={2}
        />
        <Line
            points={[[0, 0, 0], [0, 50, 0]]}
            color="green"
            lineWidth={2}
        />
        <Line
            points={[[0, 0, 0], [0, 0, 50]]}
            color="blue"
            lineWidth={2}
        />
    </group>
));