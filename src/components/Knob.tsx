import { useState } from "react";

interface Props {
    min?: number;
    max?: number;
    value?: number;
    onChange?: (value: number) => void;
}

export function Knob({
    min = 0,
    max = 1,
    value = 0,
    onChange = () => {},
}: Props) {
    const rotation = -135 + ((value - min) / (max - min)) * 270;

    return (
        <div className="relative size-16">
            {/* Invisible range input */}
            <input
                type="range"
                min={min}
                max={max}
                step="any"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 cursor-pointer opacity-0"
            />

            {/* Knob */}
            <svg viewBox="0 0 100 100" className="h-full w-full">
                {/* Base */}
                <circle cx="50" cy="50" r="50" className="fill-secondary" />

                {/* Indicator */}
                <g
                    style={{
                        transformOrigin: "50% 50%",
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    <rect
                        x="48"
                        y="0"
                        width="4"
                        height="25"
                        className="fill-secondary-foreground"
                    />
                </g>
            </svg>
        </div>
    );
}
