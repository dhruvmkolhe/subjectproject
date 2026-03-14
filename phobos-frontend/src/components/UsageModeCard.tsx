import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UsageModeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  variant?: "web" | "cli";
}

const UsageModeCard = ({ icon, title, description, features, variant = "web" }: UsageModeCardProps) => {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg",
        variant === "web"
          ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            variant === "web" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsageModeCard;
