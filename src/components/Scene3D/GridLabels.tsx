import {Text} from "@react-three/drei";

export const GridLabels = () => {
    const labels = [];
    const gridSize = 5000;
    const cellSize = 100;
    const numLabels = gridSize / cellSize;

    // Add labels along X axis
    for (let i = -numLabels / 2; i <= numLabels / 2; i++) {
        const x = i * cellSize;
        if (x == 0)
            continue;
        labels.push(
            <Text
                key={`x-${i}`}
                position={[x + 12, -12, 0]}
                rotation={[0, 0, 0]}
                fontSize={10}
                color="#6b7280"
            >
                {x}
            </Text>
        );
    }

    // Add labels along Z axis
    for (let i = -numLabels / 2; i <= numLabels / 2; i++) {
        const y = i * cellSize;
        if (y == 0)
            continue;
        labels.push(
            <Text
                key={`z-${i}`}
                position={[-12, y + 12, 0]}
                rotation={[0, 0, 0]}
                fontSize={10}
                color="#6b7280"
            >
                {y}
            </Text>
        );
    }

    return <>{labels}</>;
};