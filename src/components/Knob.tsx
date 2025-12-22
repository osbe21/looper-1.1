import { useState } from "react";

interface Props {
    value: number;
    onChange: (value: number) => void;
}

export function Knob({ value, onChange }: Props) {
    const rotation = -135 + value * 270;

    return (
        <div className="relative size-20">
            {/* Invisible range input */}
            <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />

            {/* Knob */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Base */}
                <circle cx="50" cy="50" r="45" className="fill-accent-foreground" />

                {/* Indicator */}
                <g
                    style={{
                        transformOrigin: "50% 50%",
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    <rect x="48" y="5" width="4" height="20" className="fill-accent" />
                </g>
            </svg>
        </div>
    );
}
