import { useState } from "react";
import LooperPedal from "./LooperPedal";
import Navbar from "./Navbar";
import type { LooperOptions } from "@/hooks/useLooperEngine";
import { Toaster } from "sonner";

const defaultLooperOptions: LooperOptions = {
    microphoneSettings: {
        noiseSupression: true,
        echoCancellation: true,
    },
    latencyCompensation: 0,
    updateProgressInterval: 0.01,
};

// Endre css variabler, fonter, etc for hele nettsiden (tweakcn?)
export default function App() {
    // TODO: Load disse fra local storage
    const [looperOptions, setLooperOptions] =
        useState<LooperOptions>(defaultLooperOptions);

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
                        <LooperPedal options={looperOptions} />
                    </div>
                </main>
            </div>

            <Toaster position="top-center" />
        </>
    );
}
