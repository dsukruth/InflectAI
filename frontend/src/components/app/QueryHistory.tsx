interface QueryHistoryProps {
  queries: Array<{ id: string; transcript: string }>;
  onSelect: (id: string) => void;
}

const QueryHistory = ({ queries, onSelect }: QueryHistoryProps) => (
  <div className="h-full flex flex-col overflow-hidden">
    <h3
      className="text-[10px] font-semibold text-muted-foreground px-4 pt-4 pb-3 shrink-0"
      style={{ letterSpacing: "0.2em" }}
    >
      QUERY HISTORY
    </h3>
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {queries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center mt-8">
          Your queries will appear here
        </p>
      ) : (
        <div className="space-y-2">
          {queries.map((q, i) => (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate py-1"
            >
              Q{i + 1}: {q.transcript?.slice(0, 30) || "..."}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default QueryHistory;
