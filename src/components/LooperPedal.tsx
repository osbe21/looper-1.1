import { useState, type ChangeEvent } from "react";
import useLooperEngine, { LooperState } from "../hooks/useLooperEngine";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Knob } from "./Knob";
import { Button } from "./ui/button";

export default function LooperPedal() {
    const [gain, setGain] = useState(1);
    // const {
    //     looperState,
    //     loopProgress,
    //     latency,
    //     audioContextState,
    //     resumeAudioContext,
    //     footswitch,
    //     setGain,
    //     setMicrophoneSettings,
    // } = useLooperEngine();

    // function handleGainChange(e: ChangeEvent<HTMLInputElement>) {
    //     setGain(e.target.valueAsNumber);
    //     setGainKnob(e.target.valueAsNumber);
    // }

    return (
        <>
            <div className="w-86 h-164 p-4 flex flex-col justify-between items-center border bg-card rounded-2xl shadow-2xl">
                <div className="size-54">
                    <CircularProgressbarWithChildren
                        value={0.2}
                        maxValue={1}
                        styles={buildStyles({ strokeLinecap: "butt", pathColor: "var(--color-primary)" })}
                    >
                        <div className="flex justify-center items-center gap-2">
                            <div className="size-3 rounded-full bg-green-500"></div>
                            <p className="font-mono">Recording</p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>

                <div className="flex flex-col justify-center items-center">
                    <Knob value={gain} onChange={setGain} />
                    <p className="font-mono">Level</p>
                </div>

                <h1 className="text-4xl font-black italic font-mono">looper/1.1</h1>

                <Button className="w-full h-42 font-mono text-2xl">Press to record</Button>
            </div>
            {/* <h2>Latency {Math.round(latency * 1000)}ms</h2>

            <button onClick={footswitch} className="border cursor-pointer">
                {isRecording ? "Stop recording" : "Start recording"}
            </button>

            <br />

            <progress value={loopProgress} max={1}></progress>

            <br />

            <label>
                Gain: {gainKnob}
                <br />
                <input value={gainKnob} onChange={handleGainChange} type="range" min={0.01} max={1} step={0.01} />
            </label> */}

            {/* <div className="flex flex-col justify-evenly items-center w-72 h-110 rounded-2xl border-2"> */}
            {/* Title */}
            {/* <h1 className="text-2xl font-bold">Looper 1.1</h1> */}

            {/* Gain knob */}
            {/* <div className="size-12 border rounded-full">
                    <div className="w-0.5 h-3 m-auto bg-black"></div>
                </div> */}

            {/* LED */}
            {/* <div className="size-4 border rounded-full"></div> */}

            {/* Footswitch */}
            {/* <button className="size-16 border rounded-full">
                    <div className="m-auto size-12 border rounded-full"></div>
                </button> */}
            {/* </div> */}
        </>
    );
}
