import { Users } from "lucide-react";

export default function EmptyState({
  title,
  description,
  Icon = Users,
  action,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-zinc-500">
        <Icon size={22} />
      </div>

      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
