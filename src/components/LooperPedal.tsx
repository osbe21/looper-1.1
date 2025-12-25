import { useEffect, useState } from "react";
import useLooperEngine, { type LooperOptions, type LooperState } from "../hooks/useLooperEngine";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Knob } from "./Knob";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

const stateToRingColor: Record<LooperState, string> = {
    empty: "var(--color-neutral-500)",
    "init recording": "var(--color-red-500)",
    playing: "var(--color-green-500)",
    overdubbing: "var(--color-orange-500)",
};

const stateToIndicatorColor: Record<LooperState, string> = {
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

export default function LooperPedal({ options }: { options: LooperOptions }) {
    const {
        looperState,
        looperProgress,
        latency,
        resumeAudioContext,
        footswitch,
        setGain: setLooperGain,
    } = useLooperEngine(options);

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
        <div className="h-full flex flex-col justify-stretch">
            <div className="flex gap-4 p-4">
                {/* Progress ring */}
                <div className="flex-3">
                    <CircularProgressbarWithChildren
                        value={looperProgress}
                        maxValue={1}
                        styles={buildStyles({
                            strokeLinecap: "butt",
                            pathTransition: "none",
                            pathColor: stateToRingColor[looperState],
                            trailColor: "var(--color-muted)",
                        })}
                    >
                        <div className="flex flex-col justify-center items-center gap-2">
                            <div className="flex justify-center items-baseline gap-2">
                                <div className={cn("size-3 rounded-full", stateToIndicatorColor[looperState])}></div>
                                <p className="text-lg">{stateToText[looperState]}</p>
                            </div>

                            <Separator />

                            <p className="text-xs">Latency: {Math.round(latency * 1000)}ms</p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>

                {/* Settings */}
                <div className="flex-1 flex flex-col px-2 border rounded-lg">
                    {/* Knob and label */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-1">
                        <p className="font-medium">Level</p>
                        <Knob max={2} value={gain} onChange={handleGainChange} />
                    </div>

                    <Separator />

                    <div className="flex-1 flex flex-col justify-evenly items-center">
                        <Button variant="outline">Undo</Button>
                        <Button variant="outline">Reset</Button>
                    </div>
                </div>
            </div>

            {/* <Separator /> */}

            <h1 className="my-4 text-center text-4xl font-bold font-mono italic">looper/1.1</h1>

            {/* Footswitch */}
            <div className="flex-1 p-2 pt-0">
                <button className="size-full flex justify-center items-center text-muted-foreground text-4xl bg-primary rounded-2xl">
                    Press to {!isRecording ? "record" : "stop"}
                </button>
            </div>
        </div>
    );
}
