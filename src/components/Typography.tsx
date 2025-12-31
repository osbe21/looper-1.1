import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
    children?: ReactNode;
    className?: string;
}

export function H1({ children, className }: Props) {
    return (
        <h1
            className={cn(
                "scroll-m-20 text-center text-4xl font-bold tracking-tight text-balance",
                className
            )}
        >
            {children}
        </h1>
    );
}

export function H2({ children, className }: Props) {
    return (
        <h2
            className={cn(
                "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
                className
            )}
        >
            {children}
        </h2>
    );
}

export function P({ children, className }: Props) {
    return <p className={cn("leading-7", className)}>{children}</p>;
}
