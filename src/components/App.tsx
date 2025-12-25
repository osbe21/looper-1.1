import { useState } from "react";
import LooperPedal from "./LooperPedal";
import Navbar from "./Navbar";
import type { LooperOptions } from "@/hooks/useLooperEngine";

export default function App() {
    // TODO: Load disse fra local storage
    const [looperOptions, setLooperOptions] = useState<LooperOptions>({
        microphoneSettings: {
            echoCancellation: true,
            noiseSuppression: true,
        },
        bufferSize: 5 * 60,
        updateProgressInterval: 0.01,
    });

    function handleUpdateOptions(newOptions: Partial<LooperOptions>) {
        setLooperOptions((prevSettings) => ({
            ...prevSettings,
            ...newOptions,
        }));
    }

    return (
        <>
            <header className="sticky top-0">
                <Navbar looperOptions={looperOptions} onUpdateLooperOptions={handleUpdateOptions} />
            </header>

            <main className="flex flex-col items-center gap-8">
                {/* // TODO: Vis noe UI når vi ikke har tilgang til mikrofonen */}
                <LooperPedal options={looperOptions} />
            </main>
        </>
    );
}
