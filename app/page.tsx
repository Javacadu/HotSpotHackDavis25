"use client"

import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const CaliMap = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function HomePage() {

  return (
    <main className="p-7">
      <CaliMap />
    </main>
  );
}
