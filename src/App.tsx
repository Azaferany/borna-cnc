import { HashRouter, BrowserRouter, Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import GrblConfigPage from "./pages/GrblConfigPage.tsx";
import {GRBLProvider} from "./app/GRBLProvider.tsx";
import {GCodeBufferProvider} from "./app/GCodeBufferProvider.tsx";
import isElectron from 'is-electron';
import {ROUTES} from './app/routes';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {WindowControls} from "./components/WindowControls/WindowControls.tsx";
import TourWrapper from "./components/Tour/Tour.tsx";
import {AlarmModalProvider} from "./components/AlarmModal/AlarmModalProvider.tsx";
import FontController from "./components/FontController/FontController.tsx";
import {useLanguagePersistence} from "./app/useLanguagePersistence.ts";
import {useStore} from "./app/store.ts";
import {useEffect} from "react";

function App() {
    const Router = isElectron() ? HashRouter : BrowserRouter;
    const initializeTourState = useStore(state => state.initializeTourState);

    // Initialize language persistence
    useLanguagePersistence();

    // Initialize tour state from secure storage
    useEffect(() => {
        initializeTourState();
    }, [initializeTourState]);

    return (
        <TourWrapper>
            <FontController/>
            <GRBLProvider>
                <GCodeBufferProvider>
                    <Router>
                        <Routes>
                            <Route path={ROUTES.HOME} element={<>
                                <AlarmModalProvider>
                                    <WindowControls/>
                                    <HomePage/>
                                </AlarmModalProvider>
                            </>}/>
                            <Route path={ROUTES.MACHINE_CONFIG} element={<><WindowControls/><GrblConfigPage/></>}/>
                        </Routes>
                    </Router>
                    <ToastContainer
                        position="top-right"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        theme="dark"
                        toastClassName="!top-8 opacity-85"
                    />
                </GCodeBufferProvider>
            </GRBLProvider>
        </TourWrapper>
    );
}

export default App;
