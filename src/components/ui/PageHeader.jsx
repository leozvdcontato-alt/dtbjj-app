export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-5 text-zinc-500">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
