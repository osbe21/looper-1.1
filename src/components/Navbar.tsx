import type { LooperOptions } from "@/hooks/useLooperEngine";
import HowToUseDialog from "./HowToUseDialog";
import SettingsDialog from "./SettingsDialog";

interface Props {
    looperOptions: LooperOptions;
    onUpdateLooperOptions: (newOptions: Partial<LooperOptions>) => void;
}

export default function Navbar({ looperOptions, onUpdateLooperOptions }: Props) {
    return (
        <nav className="flex justify-between items-center px-6 py-2 bg-background border-b">
            <h1 className="text-2xl text-primary font-bold italic font-mono">looper/1.1</h1>
            <div className="flex gap-2">
                <HowToUseDialog />
                <SettingsDialog looperOptions={looperOptions} onUpdateLooperOptions={onUpdateLooperOptions} />
            </div>
        </nav>
    );
}
