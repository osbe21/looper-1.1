import { Info } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

export default function InformationDialog() {
    return (
        <Dialog defaultOpen>
            <DialogTrigger asChild>
                <Button>
                    <Info />
                    Information
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How does the looper/1.1 work?</DialogTitle>
                    <DialogDescription>
                        Blah blah blah Lorem ipsum dolor sit, amet consectetur adipisicing elit. Hic officia beatae
                        vero, adipisci ullam blanditiis tempora quibusdam provident, amet eveniet quo suscipit error in
                        ad eaque autem ex? Et, porro!
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
