import useLooper, { LooperState } from "../hooks/useLooper";

export default function LooperPedal() {
    const { state, loopProgress, audioContextState, pokeAudioContext, footswitch, setMicrophoneSettings } = useLooper();

    const isRecording = state === LooperState.InitRecording || state === LooperState.Overdubbing;

    if (audioContextState !== "running")
        return (
            <button onClick={pokeAudioContext} className="border cursor-pointer">
                Poke audio context
            </button>
        );

    return (
        <>
            <button onClick={footswitch} className="border cursor-pointer">
                {isRecording ? "Stop recording" : "Start recording"}
            </button>

            <progress value={loopProgress} max={1}></progress>

            <div className="flex flex-col justify-evenly items-center w-72 h-110 rounded-2xl border-2">
                {/* Title */}
                <h1 className="text-2xl font-bold">Looper 1.1</h1>

                {/* Gain knob */}
                <div className="size-12 border rounded-full">
                    <div className="w-0.5 h-3 m-auto bg-black"></div>
                </div>

                {/* LED */}
                <div className="size-4 border rounded-full"></div>

                {/* Footswitch */}
                <button className="size-16 border rounded-full">
                    <div className="m-auto size-12 border rounded-full"></div>
                </button>
            </div>
        </>
    );
}
