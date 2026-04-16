"use client";

export default function StatsCard({
  title,
  value,
  loading = false,
  subtitle,
  valueColor = "#4f7c82",
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 transition hover:shadow-lg">
      <h2 className="text-base sm:text-lg font-medium sm:font-semibold text-gray-900 mb-2">
        {title}
      </h2>

      {loading ? (
        <p className="text-2xl sm:text-3xl font-bold" style={{ color: valueColor }}>
          ...
        </p>
      ) : (
        <p className="text-2xl sm:text-3xl font-bold" style={{ color: valueColor }}>
          {value}
        </p>
      )}

      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}