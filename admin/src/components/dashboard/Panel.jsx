export default function Panel({ title, children }) {
  return (
    <div className="admin-panel overflow-hidden rounded-xl border">
      <div className="border-b border-border-card px-6 py-4">
        <h3 className="font-semibold text-text-main">{title}</h3>
      </div>
      <div className="min-w-0 p-6">{children}</div>
    </div>
  );
}
