import { useState } from "react";
import LooperPedal from "./LooperPedal";
import Navbar from "./Navbar";
import type { LooperOptions } from "@/hooks/useLooperEngine";
import { Toaster } from "sonner";

export default function App() {
    // TODO: Load disse fra local storage
    const [looperOptions, setLooperOptions] = useState<LooperOptions>({
        microphoneSettings: {
            noiseSupression: true,
            echoCancellation: true,
        },
        latencyCompensation: 0,
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
            <div className="flex min-h-screen flex-col">
                <header>
                    <Navbar
                        looperOptions={looperOptions}
                        onUpdateLooperOptions={handleUpdateOptions}
                    />
                </header>

                <main className="flex flex-1">
                    <div className="flex-1">
                        {/* // TODO: Vis noe UI når vi ikke har tilgang til mikrofonen */}
                        <LooperPedal options={looperOptions} />
                    </div>
                </main>
            </div>

            <Toaster position="top-center" />
        </>
    );
}
