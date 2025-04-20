'use client';


import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';


export default function About() {
    const [isOpen, setIsOpen] = useState(false);


    return (
        <div className="font-[family-name:var(--font-geist-sans)] relative">
            {/* NAVBAR */}
            <nav className="bg-[#BF1414] text-white fixed w-full z-20 top-0 left-0 border-b border-[#BF1414]">
                <div className="relative flex items-center justify-between mx-auto p-4 w-full">
                    {/* Logo (left) */}
                    <div className="flex items-center space-x-3">
                        <img
                            src="https://imgproxy.attic.sh/insecure/f:png/plain/https://imgproxy.attic.sh/jaMb5lwZH-imggW9nwpHLRfBE-wQKkv83_vq5p2DPuo/rs:fit:1024:1024:1:1/t:1:FF00FF:false:false/aHR0cHM6Ly9hdHRp/Yy5zaC9vcm41Z3Ns/czY4N2hzMnR5bXJn/NmU3ZTVxYWU0"
                            className="h-10 w-auto"
                            alt="Logo"
                        />
                        <span className="text-white font-bold text-[28px]">HotSpot</span>
                    </div>


                    {/* Centered Navigation Links */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <ul className="flex space-x-8 font-medium text-white">
                            <li><Link href="/" className="hover:underline">Home</Link></li>
                            <li><Link href="/about" className="hover:underline">About</Link></li>
                            <li><Link href="/resources" className="hover:underline">Resources</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>


            {/* CONTENT */}
            <div className="w-full h-[900px] bg-[#FFFFFF] pt-30 px-6 text-center">
                <h1 className="text-3xl font-bold text-[#BF1414]">About Page</h1>
                <p className="mt-4 text-lg text-gray-700">Welcome to the About section of HotSpot!</p>
            </div>
        </div>
    );
}


