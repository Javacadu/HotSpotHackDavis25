'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MapWrapper from './components/map-wrapper';


export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [county, setCounty] = useState('');
  const router = useRouter();


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


          {/* Language Selector (right) */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center font-medium justify-center px-4 py-2 text-sm text-white rounded-lg border border-white hover:bg-white hover:text-[#BF1414] transition-colors duration-200"
            >
              <svg className="w-5 h-5 rounded-full me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3900 3900">
                <path fill="#b22234" d="M0 0h7410v3900H0z" />
                <path d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0" stroke="#fff" strokeWidth="300" />
                <path fill="#3c3b6e" d="M0 0h2964v2100H0z" />
              </svg>
              English (US)
            </button>


            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black border border-gray-100 rounded-lg shadow-md z-50">
                <ul className="py-2 text-sm">
                  <li><a href="#" className="flex items-center px-4 py-2 transition-colors duration-200 hover:bg-white hover:text-[#BF1414]">🇺🇸 English (US)</a></li>
                  <li><a href="#" className="flex items-center px-4 py-2 transition-colors duration-200 hover:bg-white hover:text-[#BF1414]">🇲🇽 Español</a></li>
                  <li><a href="#" className="flex items-center px-4 py-2 transition-colors duration-200 hover:bg-white hover:text-[#BF1414]">🇮🇹 Italiano</a></li>
                  <li><a href="#" className="flex items-center px-4 py-2 transition-colors duration-200 hover:bg-white hover:text-[#BF1414]">🇨🇳 中文 (繁體)</a></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>


      {/* CONTENT */}
      <div className="w-full min-h-screen bg-[#F2F2F2] flex flex-col items-center justify-center pt-[120px] px-4">
        {/* Text above the box */}
        <h1 className="text-3xl font-bold text-[#BF1414] mb-6">
          Welcome to HotSpot
        </h1>
        <p className="text-gray-700 text-lg mb-10 text-center max-w-xl">
          Enter your county below to find current fire zone information in your area.
        </p>


        {/* White box containing the search bar */}
        <div className="bg-white p-6 rounded-lg shadow-md w-[800px] h-[500px]">
          <MapWrapper />
        </div>

      </div>
    </div>
  );
}
