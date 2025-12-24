import { useEffect, useState } from "react";
import useLooperEngine, { type LooperState } from "../hooks/useLooperEngine";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Knob } from "./Knob";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const stateToColor: Record<LooperState, string> = {
    empty: "bg-neutral-500",
    "init recording": "bg-red-500",
    playing: "bg-green-500",
    overdubbing: "bg-orange-500",
};

const stateToText: Record<LooperState, string> = {
    empty: "Empty",
    "init recording": "Recording",
    playing: "Playing",
    overdubbing: "Overdubbing",
};

export default function LooperPedal() {
    const {
        looperState,
        looperProgress,
        latency,
        resumeAudioContext,
        footswitch,
        setGain: setLooperGain,
    } = useLooperEngine();

    const [gain, setGain] = useState(1);

    const isRecording = looperState === "init recording" || looperState === "overdubbing";

    useEffect(() => {
        // TODO: Finn en bedre måte å aktivere audio context
        // når vi går til en annen tab blir contexten suspendert
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
                        value={looperProgress}
                        maxValue={1}
                        styles={buildStyles({
                            strokeLinecap: "butt",
                            pathTransition: "none",
                            pathColor: "var(--color-primary)",
                        })}
                    >
                        <p className="text-xs font-mono">Latency: {Math.round(latency * 1000)}ms</p>
                        <div className="flex justify-center items-center gap-2">
                            <div className={cn("size-3 rounded-full", stateToColor[looperState])}></div>
                            <p className="font-mono">{stateToText[looperState]}</p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>

                <div className="flex flex-col justify-center items-center">
                    <Knob max={2} value={gain} onChange={handleGainChange} />
                    <p className="font-mono">Level</p>
                </div>

                <h1 className="text-4xl font-black italic font-mono">looper/1.1</h1>

                {/* TODO: Gi bedre visuell feedback når vi trykker på footswitchen */}
                <Button onClick={footswitch} className="w-full h-42 font-mono text-2xl">
                    Press to {!isRecording ? "record" : "stop"}
                </Button>
            </div>
        </>
    );
}
