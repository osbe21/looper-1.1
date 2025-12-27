import { useEffect } from "react";
import { toast } from "sonner";

export default function useLatencyConstraintWarning() {
    useEffect(() => {
        const supportedConstraints =
            navigator.mediaDevices.getSupportedConstraints();

        if (
            !("latency" in supportedConstraints) ||
            !supportedConstraints.latency
        ) {
            toast.warning(
                "Your browser does not support input latency detection",
                {
                    description:
                        "Manually increasing latency compensation in settings may help with synchronization issues.",
                    duration: Infinity,
                }
            );
        }
    });
}
