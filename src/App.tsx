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

function App() {
    const Router = isElectron() ? HashRouter : BrowserRouter;

    return (
        <TourWrapper>
            <GRBLProvider>
                <GCodeBufferProvider>
                    <Router>
                        <Routes>
                            <Route path={ROUTES.HOME} element={<><WindowControls/><HomePage/></>}/>
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
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="dark"
                        toastClassName="!top-8 opacity-85"
                    />
                </GCodeBufferProvider>
            </GRBLProvider>
        </TourWrapper>
    );
}

export default App;
