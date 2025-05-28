import {BrowserRouter, Route, Routes} from "react-router";
import HomePage from "./pages/HomePage.tsx";
import {GRBLProvider} from "./app/GRBLProvider.tsx";
import {GCodeBufferProvider} from "./app/GCodeBufferContext.tsx";

function App() {
    return (
        <GRBLProvider>
            <GCodeBufferProvider>

                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                    </Routes>
                </BrowserRouter>
            </GCodeBufferProvider>
        </GRBLProvider>
    );
}

export default App;
