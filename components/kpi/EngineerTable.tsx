interface EngineerRow {
  name: string;
  assigned: number;
  resolved: number;
  openCritical: number;
  avgResolveHours: number | null;
}

export function EngineerTable({ data }: { data: EngineerRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Engineer Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Engineer</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Assigned</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Resolved</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Open P1/P2</th>
              <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Avg Resolve</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-medium">{row.name}</td>
                <td className="py-2.5 px-3 text-right text-gray-600">{row.assigned}</td>
                <td className="py-2.5 px-3 text-right text-gray-600">{row.resolved}</td>
                <td className="py-2.5 px-3 text-right">
                  {row.openCritical > 0 ? (
                    <span className="text-red-600 font-semibold">{row.openCritical}</span>
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
