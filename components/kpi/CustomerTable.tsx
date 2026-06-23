interface CustomerRow {
  name: string;
  total: number;
  open: number;
  critical: number;
  avgResolveHours: number | null;
}

export function CustomerTable({ data }: { data: CustomerRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Customer / Dealership Impact</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Name</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Total</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Open</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">P1/P2</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Avg Resolve</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-medium">{row.name}</td>
                <td className="py-2.5 px-3 text-right text-gray-600">{row.total}</td>
                <td className="py-2.5 px-3 text-right text-gray-600">{row.open}</td>
                <td className="py-2.5 px-3 text-right">
                  {row.critical > 0 ? (
                    <span className="text-red-600 font-semibold">{row.critical}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-600">
                  {row.avgResolveHours !== null ? `${row.avgResolveHours}h` : "—"}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
