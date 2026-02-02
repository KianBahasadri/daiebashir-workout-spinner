import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./shared/styles/variables.css";
import "./shared/styles/layout.css";
import "./shared/styles/math-shared.css";

import { SpinnerApp } from "./features/spinner/SpinnerApp";
import { SnakesApp } from "./features/snakes-ladders/SnakesApp";

function SnakesLaddersPage() {
    return <SnakesApp />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/spinner" replace />} />
                <Route path="/spinner" element={<SpinnerApp />} />
                <Route path="/snakes-ladders" element={<SnakesLaddersPage />} />
                <Route path="*" element={<Navigate to="/spinner" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
