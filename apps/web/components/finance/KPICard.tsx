import { memo } from "react";

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  format?: "currency" | "percentage" | "number";
}

const KPICard = memo<KPICardProps>(
  ({
    title,
    value,
    change,
    icon,
    trend,
    loading = false,
    format = "number",
  }) => {
    const formatValue = (val: number | string) => {
      if (typeof val === "string") return val;
      if (loading) return "---";

      switch (format) {
        case "currency":
          return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
          }).format(val);
        case "percentage":
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString("es-MX");
      }
    };

    const getTrendColor = (trend?: string) => {
      switch (trend) {
        case "up":
          return "text-green-600";
        case "down":
          return "text-red-600";
        default:
          return "text-gray-600";
      }
    };

    const getTrendIcon = (trend?: string) => {
      switch (trend) {
        case "up":
          return "↗️";
        case "down":
          return "↘️";
        default:
          return "→";
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          </div>
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        </div>

        <div className="text-3xl font-bold text-gray-900 mb-2">
          {formatValue(value)}
        </div>

        {change !== undefined && (
          <div className={`text-sm flex items-center ${getTrendColor(trend)}`}>
            <span className="mr-1">{getTrendIcon(trend)}</span>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}% vs período anterior
          </div>
        )}

        {loading && (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        )}
      </div>
    );
  }
);

KPICard.displayName = "KPICard";

export default KPICard;
