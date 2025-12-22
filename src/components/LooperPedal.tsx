import { useState, type ChangeEvent } from "react";
import useLooperEngine, { LooperState } from "../hooks/useLooperEngine";

export default function LooperPedal() {
    const {
        looperState,
        loopProgress,
        latency,
        audioContextState,
        pokeAudioContext,
        footswitch,
        setGain,
        setMicrophoneSettings,
    } = useLooperEngine();

    const [gainKnob, setGainKnob] = useState(1);

    const isRecording = looperState === LooperState.InitRecording || looperState === LooperState.Overdubbing;

    function handleGainChange(e: ChangeEvent<HTMLInputElement>) {
        setGain(e.target.valueAsNumber);
        setGainKnob(e.target.valueAsNumber);
    }

    if (audioContextState !== "running")
        return (
            <button onClick={pokeAudioContext} className="border cursor-pointer">
                Poke audio context
            </button>
        );

    return (
        <>
            <h2>Latency {Math.round(latency * 1000)}ms</h2>

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
            </label>

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
