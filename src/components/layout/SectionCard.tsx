import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon?: LucideIcon;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon: Icon, description, actions, children, className = "" }: Props) {
  return (
    <section
      className={`surface-card overflow-hidden ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, hint, accent }: StatProps) {
  return (
    <div className="surface-card p-5 relative overflow-hidden group transition-all hover:border-primary/30">
      {accent && (
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-display">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}