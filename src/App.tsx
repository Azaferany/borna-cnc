import { HashRouter, BrowserRouter, Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import GrblConfigPage from "./pages/GrblConfigPage.tsx";
import {GRBLProvider} from "./app/GRBLProvider.tsx";
import {GCodeBufferProvider} from "./app/GCodeBufferProvider.tsx";
import isElectron from 'is-electron';
import {ROUTES} from './app/routes';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const Router = isElectron() ? HashRouter : BrowserRouter;

    return (
        <GRBLProvider>
            <GCodeBufferProvider>
                <Router>
                    <Routes>
                        <Route path={ROUTES.HOME} element={<HomePage/>}/>
                        <Route path={ROUTES.MACHINE_CONFIG} element={<GrblConfigPage/>}/>
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
                />
            </GCodeBufferProvider>
        </GRBLProvider>
    );
}

export default App;
