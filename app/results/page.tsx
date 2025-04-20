'use client';
import { useSearchParams } from 'next/navigation';


export default function ResultsPage() {
    const searchParams = useSearchParams();
    const county = searchParams.get('county');


    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Results for: {county}</h1>
            {/* Add your county-specific data here */}
        </div>
    );
}
