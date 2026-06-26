export default function Panel({ title, children }) {
  return (
    <div className="bg-surface dark:bg-slate-900 rounded-xl border border-border-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border-card">
        <h3 className="font-semibold text-text-main">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
