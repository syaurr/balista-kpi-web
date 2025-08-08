export default function ScoreCard({ title, value, unit = '' }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            <p className="mt-2 text-4xl font-bold text-[#033f3f]">
                {value.toFixed(2)}
                <span className="text-lg font-medium text-gray-400">{unit}</span>
            </p>
        </div>
    )
}