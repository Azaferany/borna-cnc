import { HashRouter, BrowserRouter, Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import {GRBLProvider} from "./app/GRBLProvider.tsx";
import {GCodeBufferProvider} from "./app/GCodeBufferProvider.tsx";
import isElectron from 'is-electron';

function App() {
    const Router = isElectron() ? HashRouter : BrowserRouter;

    return (
        <GRBLProvider>
            <GCodeBufferProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                    </Routes>
                </Router>
            </GCodeBufferProvider>
        </GRBLProvider>
    );
}

export default App;
