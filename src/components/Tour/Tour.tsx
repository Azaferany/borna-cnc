import {TourProvider, useTour} from '@reactour/tour';
import {useStore} from '../../app/store';
import {useEffect} from 'react';
import {useShallow} from "zustand/react/shallow";
import {useTranslation} from 'react-i18next';


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
    }, [tourState.isTourOpen, setIsOpen, setCurrentStep]);

    return null;
};

const TourWrapper: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {t} = useTranslation();
    const markTourCompleted = useStore(x => x.markTourCompleted);
    const setTourOpen = useStore(x => x.setTourOpen);

    const tourSteps = [
        {
            selector: '[data-tour="connection-status"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.connectionStatus.title')}</h3>
                    <p>{t('tour.connectionStatus.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="scene-3d"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.scene3d.title')}</h3>
                    <p>{t('tour.scene3d.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="gcode-editor"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.gcodeEditor.title')}</h3>
                    <p>{t('tour.gcodeEditor.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="control-buttons"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.controlButtons.title')}</h3>
                    <p>{t('tour.controlButtons.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="jog-controls"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.jogControls.title')}</h3>
                    <p>{t('tour.jogControls.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="continuous-mode"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.continuousMode.title')}</h3>
                    <p>{t('tour.continuousMode.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="keyboard-mode"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.keyboardMode.title')}</h3>
                    <p>{t('tour.keyboardMode.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="console"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.console.title')}</h3>
                    <p>{t('tour.console.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="status-display"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.statusDisplay.title')}</h3>
                    <p>{t('tour.statusDisplay.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="relative-coordinates"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.relativeCoordinates.title')}</h3>
                    <p>{t('tour.relativeCoordinates.description')}</p>
                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            💡 {t('tour.relativeCoordinates.editableNote')}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            selector: '[data-tour="absolute-coordinates"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.absoluteCoordinates.title')}</h3>
                    <p>{t('tour.absoluteCoordinates.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="home-buttons"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.homeButtons.title')}</h3>
                    <p>{t('tour.homeButtons.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="zero-buttons"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.zeroButtons.title')}</h3>
                    <p>{t('tour.zeroButtons.description')}</p>
                </div>
            ),
        },
        {
            selector: '[data-tour="reset-buttons"]',
            content: (
                <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2">{t('tour.resetButtons.title')}</h3>
                    <p>{t('tour.resetButtons.description')}</p>
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={async () => {
                                setTourOpen(false);
                                await markTourCompleted();
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {t('tour.finishTour')}
                        </button>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <TourProvider
            steps={tourSteps}
            onClickClose={async () => {
                setTourOpen(false);
                await markTourCompleted();
            }}
            onClickMask={async () => {
                setTourOpen(false);
                await markTourCompleted();
            }}
            afterOpen={() => setTourOpen(true)}
            beforeClose={async () => {
                setTourOpen(false);
                await markTourCompleted();
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