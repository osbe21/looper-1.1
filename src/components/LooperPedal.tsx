import { useEffect, useState } from "react";
import useLooperEngine, {
    type LooperOptions,
    type LooperState,
} from "../hooks/useLooperEngine";
import {
    buildStyles,
    CircularProgressbarWithChildren,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Knob } from "./Knob";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import Footswitch from "./Footswitch";

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

    const isRecording =
        looperState === "init recording" || looperState === "overdubbing";

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                event.preventDefault();
                footswitch();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        // TODO: Finn en bedre måte å aktivere audio context
        // når vi går til en annen tab blir contexten suspendert
        window.addEventListener("click", resumeAudioContext, { once: true });

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("click", resumeAudioContext);
        };
    }, []);

    function handleGainChange(value: number) {
        setGain(value);
        setLooperGain(value);
    }

    return (
        <div className="flex h-full flex-col justify-stretch gap-4 p-4 md:flex-row">
            <div className="flex gap-4 md:m-8 md:flex-col">
                {/* Progress ring */}
                <div className="flex flex-1 items-center justify-center">
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
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex items-baseline justify-center gap-2">
                                <div
                                    className={cn(
                                        "size-3 rounded-full",
                                        stateToIndicatorColor[looperState]
                                    )}
                                ></div>
                                <p className="text-lg">
                                    {stateToText[looperState]}
                                </p>
                            </div>

                            <Separator />

                            <p className="text-xs">
                                Latency: {Math.round(latency * 1000)}ms
                            </p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>

                {/* Settings */}
                <div className="flex flex-col gap-3 rounded border p-3 md:flex-row">
                    {/* Knob and label */}
                    <div className="flex flex-1 flex-col items-center justify-center gap-2">
                        <p className="font-medium">Level</p>
                        <Knob
                            max={2}
                            value={gain}
                            onChange={handleGainChange}
                        />
                    </div>

                    <Separator className="md:hidden" />
                    <Separator
                        orientation="vertical"
                        className="hidden md:block"
                    />

                    {/* Undo and reset buttons */}
                    <div className="flex flex-1 flex-col items-center justify-evenly gap-2">
                        <Button variant="outline">Undo</Button>
                        <Button variant="outline">Reset</Button>
                    </div>
                </div>
            </div>

            <h1 className="my-4 text-center font-mono text-4xl font-bold italic md:hidden">
                looper/1.1
            </h1>

            {/* Footswitch */}
            <div className="flex-1 md:p-8">
                {/* TODO: Få denne til å se mer ut som en fysisk footswitch */}
                <Footswitch isOn={isRecording} onClick={footswitch} />
            </div>
        </div>
    );
}
