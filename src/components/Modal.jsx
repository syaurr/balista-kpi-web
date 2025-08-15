'use client';

import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    // Menangani penutupan modal saat tombol 'Escape' ditekan
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose} // Tutup modal saat mengklik background
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col transform transition-transform duration-300 scale-100"
                onClick={e => e.stopPropagation()} // Mencegah modal tertutup saat mengklik isinya
            >
                {/* Header Modal */}
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#6b1815]">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">&times;</button>
                </div>
                
                {/* Konten Modal */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}