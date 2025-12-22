import { useEffect, useState, type ChangeEvent } from "react";
import useLooperEngine, { type LooperState } from "../hooks/useLooperEngine";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Knob } from "./Knob";
import { Button } from "./ui/button";

export default function LooperPedal() {
    const {
        looperState,
        loopProgress,
        latency,
        audioContextState,
        resumeAudioContext,
        footswitch,
        setGain: setLooperGain,
        setMicrophoneSettings,
    } = useLooperEngine();

    const [gain, setGain] = useState(1);

    const isRecording = looperState == "init recording" || looperState == "overdubbing";

    useEffect(() => {
        window.addEventListener("click", resumeAudioContext, { once: true });

        return () => window.removeEventListener("click", resumeAudioContext);
    }, []);

    function handleGainChange(value: number) {
        setGain(value);
        setLooperGain(value);
    }

    return (
        <>
            <div className="w-86 h-164 p-4 flex flex-col justify-between items-center border bg-card rounded-2xl shadow-2xl">
                <div className="size-54 m-6">
                    <CircularProgressbarWithChildren
                        value={loopProgress}
                        maxValue={1}
                        styles={buildStyles({
                            strokeLinecap: "butt",
                            pathTransition: "none",
                            pathColor: "var(--color-primary)",
                        })}
                    >
                        <p className="text-xs font-mono">Latency: {Math.round(latency * 1000)}ms</p>
                        <div className="flex justify-center items-center gap-2">
                            <div className="size-3 rounded-full bg-green-500"></div>
                            <p className="font-mono">{looperState}</p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>

                <div className="flex flex-col justify-center items-center">
                    <Knob max={2} value={gain} onChange={handleGainChange} />
                    <p className="font-mono">Level</p>
                </div>

                <h1 className="text-4xl font-black italic font-mono">looper/1.1</h1>

                <Button onClick={footswitch} className="w-full h-42 font-mono text-2xl">
                    Press to {!isRecording ? "record" : "stop"}
                </Button>
            </div>
        </>
    );
}
