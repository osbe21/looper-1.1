import LooperPedal from "./LooperPedal";
import InformationDialog from "./InformationDialog";

export default function App() {
    return (
        <main className="m-8 flex flex-col items-center gap-8">
            <InformationDialog />

            {/* // TODO: Lag et settings panel for looperen */}
            <LooperPedal />
        </main>
    );
}
