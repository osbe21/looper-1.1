import LooperPedal from "./LooperPedal";
import InformationDialog from "./HowToUseDialog";
import Navbar from "./Navbar";

export default function App() {
    return (
        <>
            <header className="sticky top-0">
                <Navbar />
            </header>

            <main className="flex flex-col items-center gap-8">
                {/* // TODO: Lag et settings panel for looperen */}
                {/* // TODO: Vis noe UI når vi ikke har tilgang til mikrofonen */}
                <LooperPedal />
            </main>
        </>
    );
}
