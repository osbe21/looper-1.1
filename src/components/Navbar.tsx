import HowToUseDialog from "./HowToUseDialog";
import SettingsDialog from "./SettingsDialog";

export default function Navbar() {
    return (
        <nav className="flex justify-between items-center px-6 py-2 bg-background border-b">
            <h1 className="text-2xl font-bold italic font-mono">looper/1.1</h1>
            <div className="flex gap-2">
                <HowToUseDialog />
                <SettingsDialog />
            </div>
        </nav>
    );
}
