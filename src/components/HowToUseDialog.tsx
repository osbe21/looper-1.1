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
                {/* <DialogHeader>
                    <DialogTitle>How does the looper/1.1 work?</DialogTitle>
                </DialogHeader> */}
                {/* TODO: Fyll ut denne */}
                <H1>Looper 1.1</H1>
                <P>A digital, browser-based looper pedal.</P>
                <H2>How to use</H2>
                <P>
                    Press the footswitch to start recording a loop. You can also
                    use the space bar. Press it one more time to stop recording.
                    This loop will now play back, and you can use it to play
                    over. You can also press the footswitch again to overdub.
                    Use the undo button to revert an overdub.
                </P>
                <H2>Notice</H2>
                <P>
                    You need to allow microphone-access. If you're having
                    trouble recording, make sure you have selected the right
                    microphone. It's also possible to alternative inputs, such
                    as Fender Mustang Micro, or Boss Katana Go.
                </P>

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
