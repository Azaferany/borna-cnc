import {BrowserRouter, Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import { GRBLProvider } from './contexts/GRBLContext';

function App() {
    return (
        <GRBLProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </GRBLProvider>
    );
}

export default App;
