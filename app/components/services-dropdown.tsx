'use client';

import { useState } from 'react';

interface Service {
    name: string;
    explanation: string;
    accessibility: string;
    link: string;
}

interface ServicesDropdownProps {
    services: Service[];
}

export default function ServicesDropdown({ services }: ServicesDropdownProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Services</h2>
            <div className="space-y-4">
                {services ? services.map((service, idx) => (
                    <div
                        key={service.name}
                        className="border border-gray-200 rounded-lg shadow-sm bg-white"
                    >
                        <button
                            className="w-full flex justify-between items-center px-6 py-4 focus:outline-none"
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            aria-expanded={openIndex === idx}
                            aria-controls={`service-details-${idx}`}
                        >
                            <span className="text-lg font-semibold text-blue-700">{service.name}</span>
                            <svg
                                className={`w-5 h-5 transform transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openIndex === idx && (
                            <div
                                id={`service-details-${idx}`}
                                className="px-6 pb-4 pt-1 text-gray-700 animate-fade-in"
                            >
                                <p className="mb-2"><span className="font-semibold">Explicación:</span> {service.explanation}</p>
                                <p className="mb-2"><span className="font-semibold">Accesibilidad:</span> {service.accessibility}</p>
                                <a
                                    href={service.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                >
                                    Más información
                                </a>
                            </div>
                        )}
                    </div>
                )) : ""}
            </div>
            <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
        </div>
    );
}