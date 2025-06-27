import {TourProvider, useTour} from '@reactour/tour';
import {useStore} from '../../app/store';
import {useEffect} from 'react';
import {useShallow} from "zustand/react/shallow";

const tourSteps = [
    {
        selector: '[data-tour="connection-status"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
                <p>This shows your current connection status to the CNC machine. You can connect via USB or Network.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="scene-3d"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">3D Scene</h3>
                <p>This is your main workspace where you can visualize your G-code toolpaths in 3D. Use mouse to rotate,
                    zoom, and pan the view.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="gcode-editor"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">G-Code Editor</h3>
                <p>View and edit your G-code here. You can load files and see the current line being executed
                    highlighted.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="control-buttons"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Control Buttons</h3>
                <p>These are your main machine control buttons: Start, Pause, Stop, and Reset your CNC operations.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="jog-controls"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Jog Controls</h3>
                <p>Use these controls to manually move your CNC machine axes. Adjust step size and move in precise
                    increments.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="continuous-mode"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Continuous Mode</h3>
                <p>When enabled, hold down jog buttons to move continuously. Release to stop. Perfect for fine
                    positioning and manual control.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="keyboard-mode"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Keyboard Mode</h3>
                <p>Use arrow keys for X/Y movement, Page Up/Down for Z axis. Hold Shift + arrows for diagonal movement.
                    The yellow ring indicates keyboard mode is active.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="console"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Console</h3>
                <p>Monitor machine responses and send manual G-code commands directly to your CNC machine.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="status-display"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Status Display</h3>
                <p>View real-time machine coordinates, work coordinates, and current machine state information.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="relative-coordinates"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Relative Coordinates</h3>
                <p>These blue values show your position relative to the current work coordinate system (G54-G59). This
                    is your "working zero" - the reference point for your current job.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="absolute-coordinates"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Absolute Coordinates</h3>
                <p>These green values show your position in absolute machine coordinates. This is the true position
                    relative to the machine's home position, regardless of work offsets.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="home-buttons"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Home Buttons</h3>
                <p>Use these green home buttons to return each axis to its home position. This is essential for machine
                    calibration and safety.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="zero-buttons"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Zero Buttons</h3>
                <p>Set the current position as zero for each axis. This establishes your work coordinate system for
                    accurate positioning.</p>
            </div>
        ),
    },
    {
        selector: '[data-tour="reset-buttons"]',
        content: (
            <div className="p-2">
                <h3 className="text-lg font-semibold mb-2">Reset Buttons</h3>
                <p>Reset temporary work offsets (G92) for each axis. Use this to clear any temporary coordinate
                    adjustments.</p>
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => {
                            const {markTourCompleted, setTourOpen} = useStore.getState();
                            setTourOpen(false);
                            markTourCompleted();
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        🎉 Finish Tour
                    </button>
                </div>
            </div>
        ),
    },
];

const TourComponent: React.FC = () => {
    const tourState = useStore(useShallow(x => x.tourState));
    const setTourOpen = useStore(x => x.setTourOpen);
    const {setIsOpen, setCurrentStep} = useTour();

    useEffect(() => {
        if (tourState.isFirstTime && !tourState.hasCompletedTour) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                setTourOpen(true);
                setIsOpen(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [tourState.isFirstTime, tourState.hasCompletedTour, setTourOpen, setIsOpen]);

    useEffect(() => {
        setCurrentStep(0);
        setIsOpen(tourState.isTourOpen);
    }, [tourState.isTourOpen, setIsOpen]);

    return null;
};

const TourWrapper: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const markTourCompleted = useStore(x => x.markTourCompleted);
    const setTourOpen = useStore(x => x.setTourOpen);

    return (
        <TourProvider
            steps={tourSteps}
            onClickClose={() => {
                setTourOpen(false);
                markTourCompleted();
            }}
            onClickMask={() => {
                setTourOpen(false);
                markTourCompleted();
            }}
            afterOpen={() => setTourOpen(true)}
            beforeClose={() => {
                setTourOpen(false);
                markTourCompleted();
            }}
            className="tour-provider z-[9999999999999]"
            padding={{mask: [8, 8, 8, 8]}}
            showNavigation={true}
            showBadge={true}
            startAt={0}

        >
            {children}
            <TourComponent/>
        </TourProvider>
    );
};

export default TourWrapper; 