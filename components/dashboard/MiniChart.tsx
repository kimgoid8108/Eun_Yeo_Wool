interface MiniChartProps {
  title: string;
  data: number[];
  labels?: string[];
}

export default function MiniChart({ title, data, labels }: MiniChartProps) {
  const maxValue = Math.max(...data, 1);
  const bars = data.map((value, index) => ({
    value,
    height: (value / maxValue) * 100,
    label: labels?.[index] || `${index + 1}`,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="flex items-end justify-between gap-2 h-40">
        {bars.map((bar, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="relative w-full h-full flex items-end">
              <div
                className="w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${bar.height}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 mt-2">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
