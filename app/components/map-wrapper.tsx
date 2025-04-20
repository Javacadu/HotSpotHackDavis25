"use client"

import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const CaliMap = dynamic(() => import("./map"), {
    ssr: false,
    loading: () => <p>Loading map...</p>,
});

export default function MapWrapper() {
    return <div className="">
        <CaliMap />
    </div>
}