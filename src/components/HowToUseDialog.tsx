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
                <DialogHeader>
                    <DialogTitle>How does the looper/1.1 work?</DialogTitle>
                </DialogHeader>

                <p>It's important to enable microphone access</p>
                <p>Press space to record and stop</p>

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
