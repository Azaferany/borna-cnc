import { Color} from 'three';
import {Line} from "@react-three/drei";
import type {Point3D} from "../../types/GCodeTypes.ts";
import React from "react";


interface SpatialPartitionProps {
    points: Point3D[];
    color: Color | string;
    lineWidth: number;
    isHighlighted?: boolean;
    gCodeLimeNumber?: number;
}

export const SpatialPartition: React.FC<SpatialPartitionProps> = ({ points, color, lineWidth, isHighlighted }) => {
   if(points.length === 0) {
       return null;
   }

    console.log(points.filter(x=>!x.x || !x.y || !x.y));

    return (
        <Line
            points={points.map((point)  =>  {
                return [point.x, point.y, point.z]
            })}
            color={isHighlighted ? '#00ff00' : color}
            lineWidth={isHighlighted ? lineWidth * 20 : lineWidth}
        />
    );
}