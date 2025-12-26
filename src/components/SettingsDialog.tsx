import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import type { LooperOptions } from "@/hooks/useLooperEngine";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useState, type FormEvent } from "react";

interface Props {
    looperOptions: LooperOptions;
    onUpdateLooperOptions: (newOptions: Partial<LooperOptions>) => void;
}

export default function SettingsDialog({
    looperOptions,
    onUpdateLooperOptions,
}: Props) {
    const [noiseSupression, setNoiseSupression] = useState(
        looperOptions.microphoneSettings.noiseSupression
    );
    const [echoCancellation, setEchoCancellation] = useState(
        looperOptions.microphoneSettings.echoCancellation
    );

    const [latencyCompensation, setLatencyCompensation] = useState(0);
    const [bufferSize, setBufferSize] = useState(looperOptions.bufferSize);
    const [updateProgressInterval, setUpdateProgressInterval] = useState(
        looperOptions.updateProgressInterval
    );

    useEffect(() => {
        setNoiseSupression(looperOptions.microphoneSettings.noiseSupression);
        setEchoCancellation(looperOptions.microphoneSettings.echoCancellation);
        setLatencyCompensation(looperOptions.latencyCompensation);
        setBufferSize(looperOptions.bufferSize);
        setUpdateProgressInterval(looperOptions.updateProgressInterval);
    }, [looperOptions]);

    const newOptions = {
        microphoneSettings: {
            noiseSupression,
            echoCancellation,
        },
        latencyCompensation,
        bufferSize,
        updateProgressInterval,
    };

    function handleSubmit(event: FormEvent) {
        // event.preventDefault();

        onUpdateLooperOptions(newOptions);
    }

    return (
        <Dialog>
            <form onSubmit={handleSubmit}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>
                            Only edit these settings if you're experiencing
                            issues with audio quality or performance.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="my-2 h-72 pr-4">
                        <FieldGroup className="my-4 space-y-4">
                            <FieldSet>
                                <FieldLegend>Microphone options</FieldLegend>
                                <FieldDescription>
                                    Changing these can improve performance, but
                                    reduce audio quality.
                                </FieldDescription>
                                <FieldGroup>
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="noise-supression"
                                            checked={noiseSupression}
                                            onCheckedChange={(checked) =>
                                                setNoiseSupression(
                                                    checked === "indeterminate"
                                                        ? false
                                                        : checked
                                                )
                                            }
                                        />
                                        <FieldLabel htmlFor="noise-supression">
                                            Noise supression
                                        </FieldLabel>
                                    </Field>

                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="echo-cancellation"
                                            checked={echoCancellation}
                                            onCheckedChange={(checked) =>
                                                setEchoCancellation(
                                                    checked === "indeterminate"
                                                        ? false
                                                        : checked
                                                )
                                            }
                                        />
                                        <FieldLabel htmlFor="echo-cancellation">
                                            Echo cancellation
                                        </FieldLabel>
                                    </Field>
                                </FieldGroup>
                            </FieldSet>

                            <Field>
                                <FieldTitle>Latency compensation</FieldTitle>
                                <FieldDescription>
                                    Adjust this value if your recordings are out
                                    of sync with the playback.
                                </FieldDescription>
                                <FieldLabel htmlFor="latency-compensation">
                                    {latencyCompensation * 1000} ms
                                </FieldLabel>
                                <Slider
                                    id="latency-compensation"
                                    min={-0.05}
                                    max={0.05}
                                    step={0.001}
                                    value={[latencyCompensation]}
                                    onValueChange={(value) =>
                                        setLatencyCompensation(value[0])
                                    }
                                />
                            </Field>

                            <Field>
                                <FieldTitle>Max buffer size</FieldTitle>
                                <FieldDescription>
                                    Increasing this allows for longer
                                    recordings, but uses more memory.
                                </FieldDescription>
                                <FieldLabel htmlFor="buffer-size">
                                    {formatSeconds(bufferSize)}
                                </FieldLabel>
                                <Slider
                                    id="buffer-size"
                                    min={60}
                                    max={10 * 60}
                                    step={30}
                                    value={[bufferSize]}
                                    onValueChange={(value) =>
                                        setBufferSize(value[0])
                                    }
                                />
                            </Field>

                            <Field>
                                <FieldTitle>
                                    Loop progress update interval
                                </FieldTitle>
                                <FieldDescription>
                                    Lowering this value makes the progress bar
                                    smoother, but uses more CPU.
                                </FieldDescription>
                                <FieldLabel htmlFor="loop-progress-update-interval">
                                    {updateProgressInterval.toFixed(2)} s
                                </FieldLabel>
                                <Slider
                                    id="loop-progress-update-interval"
                                    min={0.01}
                                    max={0.2}
                                    step={0.01}
                                    value={[updateProgressInterval]}
                                    onValueChange={(value) =>
                                        setUpdateProgressInterval(value[0])
                                    }
                                />
                            </Field>
                        </FieldGroup>
                    </ScrollArea>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>

                        <DialogClose asChild>
                            <Button
                                type="submit"
                                variant="default"
                                onClick={handleSubmit}
                                disabled={
                                    JSON.stringify(newOptions) ===
                                    JSON.stringify(looperOptions)
                                }
                            >
                                Apply
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}

function formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}s`;
}
