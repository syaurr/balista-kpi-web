// src/components/ScoreCard.jsx

export default function ScoreCard({ title, value, unit = '', prominent = false }) {
    // Tentukan gaya berdasarkan properti 'prominent'
    const bgColor = prominent ? 'bg-[#033f3f]' : 'bg-white';
    const titleColor = prominent ? 'text-teal-200' : 'text-gray-500';
    const valueColor = prominent ? 'text-white' : 'text-[#033f3f]';
    const valueSize = prominent ? 'text-5xl' : 'text-4xl'; // Ukuran font lebih besar
    const shadowEffect = prominent ? 'shadow-lg hover:shadow-xl hover:-translate-y-1' : 'shadow-md';

    return (
        <div className={`${bgColor} p-6 rounded-xl ${shadowEffect} transition-all duration-300`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>
                {title}
            </h3>
            <p className={`mt-2 font-bold ${valueColor} ${valueSize}`}>
                {/* Pastikan nilai adalah angka sebelum toFixed */}
                {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                <span className={`text-lg font-medium ${prominent ? 'text-teal-300' : 'text-gray-400'}`}>{unit}</span>
            </p>
        </div>
    );
}