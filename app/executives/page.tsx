import { executives } from '@/data/executives';
import ExecutiveCard from '@/components/executives/ExecutiveCard';

export default function ExecutivesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">임원단</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {executives.map((executive, index) => (
          <ExecutiveCard
            key={index}
            role={executive.role}
            name={executive.name}
          />
        ))}
      </div>
    </div>
  );
}
