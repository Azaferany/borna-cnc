// Camera presets
import {Vector3, Box3, PerspectiveCamera} from "three";
import {useThree} from "@react-three/fiber";
import {useEffect, useRef, useState} from "react";
import {TrackballControls} from "@react-three/drei";
import {TrackballControls as TrackballControlsImpl} from 'three-stdlib';

// eslint-disable-next-line react-refresh/only-export-components
export const CAMERA_PRESETS = {
    center: {offset: new Vector3(50, -50, 200)},
    top: { offset: new Vector3(0, 0, 1) },
    front: { offset: new Vector3(0, 1, 0) },
    side: {offset: new Vector3(1, 0, 0)},
    iso: {offset: new Vector3(1, 1, 1)}
};

// Camera Controller Component
export const CameraController = ({preset, boundingBox, onPresetComplete}: {
    preset: keyof typeof CAMERA_PRESETS | null,
    boundingBox: Box3 | null,
    onPresetComplete?: () => void
}) => {
    const { camera } = useThree();
    const controlsRef = useRef<TrackballControlsImpl>(null);
    const [hasInitialized, setHasInitialized] = useState(false);

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
    }, [preset, camera, boundingBox, onPresetComplete]);

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
        dynamicDampingFactor={0.2}
    />;
};
