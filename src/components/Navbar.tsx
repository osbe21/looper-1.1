import type { LooperOptions } from "@/hooks/useLooperEngine";
import HowToUseDialog from "./HowToUseDialog";
import SettingsDialog from "./SettingsDialog";

interface Props {
    looperOptions: LooperOptions;
    onUpdateLooperOptions: (newOptions: Partial<LooperOptions>) => void;
}

export default function Navbar({
    looperOptions,
    onUpdateLooperOptions,
}: Props) {
    return (
        <nav className="bg-background flex items-center justify-between border-b px-6 py-2">
            <h1 className="text-primary font-mono text-2xl font-bold italic">
                looper/1.1
            </h1>
            <div className="flex gap-2">
                <HowToUseDialog />
                <SettingsDialog
                    looperOptions={looperOptions}
                    onUpdateLooperOptions={onUpdateLooperOptions}
                />
            </div>
        </nav>
    );
}
