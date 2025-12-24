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

interface Props {
    settings: LooperOptions;
    onUpdateSettings: (newSettings: Partial<LooperOptions>) => void;
}

// TODO: Legg til dark mode støtte
export default function SettingsDialog({ settings, onUpdateSettings }: Props) {
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
