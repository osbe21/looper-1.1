import { H1, H2, P } from "./Typography";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";

export default function InformationDialog() {
    return (
        <Dialog defaultOpen>
            <DialogTrigger asChild>
                <Button variant="ghost" size="default">
                    How to use?
                </Button>
            </DialogTrigger>
            <DialogContent>
                <H1>
                    Welcome to{" "}
                    <span className="font-mono italic">looper 1.1</span>
                </H1>

                <P>
                    Record, layer, and build epic guitar loops right in your
                    browser!
                </P>

                <H2>Quick Start</H2>

                <ol className="ml-4 list-outside list-decimal">
                    <P>
                        <li>
                            Hit the footswitch or spacebar to start recording
                            your riff.
                        </li>
                        <li>
                            Play your loop once, then press again to stop and
                            start playback.
                        </li>
                        <li>
                            Layer overdubs by pressing the footswitch during
                            playback.
                        </li>
                        <li>Use Undo to remove the last overdub.</li>
                    </P>
                </ol>

                <H2>Pro Tips</H2>

                <ul className="ml-4 list-outside list-disc">
                    <P>
                        <li>Grant mic access for recording.</li>
                        <li>
                            Select the correct input (guitar interface or mic).
                        </li>
                        <li>
                            Compatible with Fender Mustang Micro, Boss Katana
                            Go, etc.
                        </li>
                        <li>Nail your timing for seamless loops!</li>
                    </P>
                </ul>

                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
