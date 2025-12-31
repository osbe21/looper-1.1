import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
    isOn: boolean;
    onClick?: () => void;
}

export default function Footswitch({ isOn, onClick }: Props) {
    const [isPressed, setIsPressed] = useState(false);

    return (
        <div className="bg-muted border-border relative size-full rounded-lg border p-3 shadow-sm">
            {/* The Actual Moving Button */}
            <button
                onClick={onClick}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                onTouchStart={() => setIsPressed(true)}
                onTouchEnd={() => setIsPressed(false)}
                className={cn(
                    "border-input relative flex size-full flex-col items-center justify-center overflow-hidden rounded border transition-all duration-75 ease-out",
                    isOn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    isPressed
                        ? "translate-y-2 scale-[0.99] shadow-[inset_0_4px_0_0_rgba(0,0,0,0.1)]"
                        : "translate-y-0 scale-100 shadow-[0_10px_0_0_hsl(var(--muted-foreground)/0.4),0_10px_20px_rgba(0,0,0,0.1)]"
                )}
            >
                {/* Typography */}
                <div className="flex flex-col items-center select-none">
                    <span className="text-2xl tracking-tight">
                        Press to {isOn ? "stop" : "record"}
                    </span>
                </div>

                {/* Indicator Dot - Uses 'primary' or 'muted' foreground */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full transition-colors duration-200 ${isOn ? "bg-primary-foreground" : "bg-muted-foreground"} `}
                    />
                </div>
            </button>
        </div>
    );
}
