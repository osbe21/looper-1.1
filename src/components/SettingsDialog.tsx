import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import type { LooperOptions } from "@/hooks/useLooperEngine";
import { ModeToggle } from "./ModeToggle";

interface Props {
    looperOptions: LooperOptions;
    onUpdateLooperOptions: (newOptions: Partial<LooperOptions>) => void;
}

export default function SettingsDialog({ looperOptions, onUpdateLooperOptions }: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <p>Settings content goes here</p>

                <ModeToggle />

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
