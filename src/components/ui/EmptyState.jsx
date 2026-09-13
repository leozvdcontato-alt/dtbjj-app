import { Users } from "lucide-react";

export default function EmptyState({
  title,
  description,
  Icon = Users,
  action,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-500">
        <Icon size={19} />
      </div>

      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-zinc-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
