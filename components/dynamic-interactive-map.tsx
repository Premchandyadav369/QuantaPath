"use client";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/interactive-map").then(mod => mod.InteractiveMap), {
    ssr: false,
    loading: () => <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">Loading Map...</div>
});

export function DynamicInteractiveMap() {
    return <InteractiveMap />;
}
