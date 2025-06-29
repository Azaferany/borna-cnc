// Camera presets
import {Vector3, Box3, PerspectiveCamera} from "three";
import {useThree} from "@react-three/fiber";
import {useCallback, useEffect, useRef, useState} from "react";
import {TrackballControls} from "@react-three/drei";
import {TrackballControls as TrackballControlsImpl} from 'three-stdlib';

// eslint-disable-next-line react-refresh/only-export-components
export const CAMERA_PRESETS = {
    center: {offset: new Vector3(50, -50, 200)},
    top: { offset: new Vector3(0, 0, 1) },
    front: {offset: new Vector3(0.1, 1, 0)},
    side: {offset: new Vector3(1, 0, 0)},
    iso: {offset: new Vector3(1, 1, 1)},
    toolhead: {offset: new Vector3(100, 100, 100)},
};

// Camera Controller Component
export const CameraController = ({preset, boundingBox, machineCoordinate, followToolhead, onPresetComplete}: {
    preset: keyof typeof CAMERA_PRESETS | null,
    boundingBox: Box3 | null,
    machineCoordinate?: Vector3 | null,
    followToolhead?: boolean,
    onPresetComplete?: () => void
}) => {
    const { camera } = useThree();
    const controlsRef = useRef<TrackballControlsImpl>(null);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [lastToolheadPosition, setLastToolheadPosition] = useState<Vector3 | null>(null);
    const lastExecutionTimeRef = useRef<number>(0);

    const calculateCameraDistance = (box: Box3, camera: PerspectiveCamera) => {
        const size = new Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // Convert FOV to radians
        const fovRad = camera.fov * (Math.PI / 180);

        // Calculate the distance needed to make the object take up 80% of the view width
        // tan(fov/2) = (objectSize/2) / distance
        // distance = (objectSize/2) / tan(fov/2)
        // We want objectSize to be 80% of the view, so we divide by 0.8
        return (maxDim / 3) / Math.cosh(fovRad / 2) / 0.8;
    };

    // Function to follow toolhead
    const handleFollowToolhead = useCallback(() => {
        if (machineCoordinate && controlsRef.current) {
            if (lastToolheadPosition) {
                // Calculate the movement delta
                const delta = new Vector3().subVectors(machineCoordinate, lastToolheadPosition);

                // Move both camera and target by the same delta to maintain relative position
                camera.position.add(delta);
                controlsRef.current.target.add(delta);
                controlsRef.current.update();
            } else {
                // First time following - set target to toolhead position
                controlsRef.current.target.copy(machineCoordinate);
                controlsRef.current.update();
            }

            setLastToolheadPosition(machineCoordinate.clone());
        }
    }, [camera.position, lastToolheadPosition, machineCoordinate]);

    useEffect(() => {
        if (preset == "center") {
            const {offset} = CAMERA_PRESETS[preset];

            // For TrackballControls, we want to position the camera and set the target
            camera.position.set(
                offset.x,
                offset.y,
                offset.z
            );

            // Set the target to the center of the scene
            controlsRef.current?.target.set(0, 0, 0);
            controlsRef.current?.update();

            // Reset after animation
            setTimeout(() => {
                onPresetComplete?.();
            }, 1000);
            return;
        }

        if (preset == "toolhead" && machineCoordinate) {
            const {offset} = CAMERA_PRESETS[preset];

            // Position the camera relative to the toolhead position
            camera.position.set(
                machineCoordinate.x + offset.x,
                machineCoordinate.y + offset.y,
                machineCoordinate.z + offset.z
            );

            // Set the target to the toolhead position
            controlsRef.current?.target.set(machineCoordinate.x, machineCoordinate.y, machineCoordinate.z);
            controlsRef.current?.update();

            // Reset after animation
            setTimeout(() => {
                onPresetComplete?.();
            }, 1000);
            return;
        }
        if (preset && controlsRef.current && boundingBox && camera instanceof PerspectiveCamera) {
            const center = new Vector3(0,0,0);
            boundingBox.getCenter(center);
            if (preset == "front")
                camera.up.set(0, 0, 1);
            else if (preset == "side")
                camera.up.set(0, 1, 0);
            else if (preset == "top")
                camera.up.set(0, 1, 0);

            camera.lookAt(new Vector3(0, 0, 0));

            // Calculate camera distance
            const cameraDistance = calculateCameraDistance(boundingBox, camera) * 1.2;

            // Get the offset direction from the preset
            const { offset } = CAMERA_PRESETS[preset];

            // Normalize the offset and scale by camera distance
            const normalizedOffset = offset.clone().normalize().multiplyScalar(cameraDistance);
            // Position the camera
            camera.position.set(
                center.x + normalizedOffset.x,
                center.y + normalizedOffset.y,
                center.z + normalizedOffset.z
            );
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
            //controlsRef.current.reset()

            // Set the target to the center of the box


            // Reset after animation
            setTimeout(() => {

                onPresetComplete?.();
            }, 1000);
        }
    }, [preset, camera, boundingBox, machineCoordinate, onPresetComplete]);

    // Follow toolhead logic with 3-second throttling
    useEffect(() => {
        if (followToolhead && machineCoordinate) {
            const now = Date.now();
            const timeSinceLastExecution = now - lastExecutionTimeRef.current;

            // Only execute if 3 seconds have passed since last execution
            if (timeSinceLastExecution >= 3000) {
                handleFollowToolhead();
                lastExecutionTimeRef.current = now;
            }
        } else {
            // Reset last position when not following
            setLastToolheadPosition(null);
            // Reset execution time when not following
            lastExecutionTimeRef.current = 0;
        }
    }, [followToolhead, handleFollowToolhead, machineCoordinate]);

    useEffect(() => {
        if (boundingBox && !hasInitialized && controlsRef.current && camera instanceof PerspectiveCamera) {
            // Calculate the center of the bounding box
            const center = new Vector3(0,0,0);
            boundingBox?.getCenter(center);

            // Calculate camera distance
            const cameraDistance = calculateCameraDistance(boundingBox, camera);

            // Get the offset direction from the preset
            const {offset} = CAMERA_PRESETS["top"];

            // Normalize the offset and scale by camera distance
            const normalizedOffset = offset.clone().normalize().multiplyScalar(cameraDistance);

            // Position the camera
            camera.position.set(
                center.x + normalizedOffset.x,
                center.y + normalizedOffset.y,
                center.z + normalizedOffset.z
            );
            // Set the target to the center of the box
            controlsRef.current.target.copy(center);
            controlsRef.current.update();

            setHasInitialized(true);
        }
    }, [boundingBox, camera, hasInitialized]);


    return <TrackballControls
        makeDefault
        ref={controlsRef}
        cursorZoom
        enabled={true}
    />;
};
