'use client';

interface WeeklyDataPoint {
  date: string;
  views: number;
  whatsapp: number;
  website: number;
}

interface MetricsChartProps {
  data: WeeklyDataPoint[];
}

export default function MetricsChart({ data }: MetricsChartProps) {
  if (!data.length) {
    return (
      <p className="text-[#a090b8] text-sm py-8 text-center">
        Sin datos de esta semana todavia.
      </p>
    );
  }

  // Find max value for scaling
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.views, d.whatsapp, d.website]),
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2 min-w-[480px] h-48 px-2 pb-6 relative">
        {/* Y-axis label */}
        <span className="absolute left-0 top-0 text-[10px] text-[#a090b8]">
          {maxVal}
        </span>

        {data.map((week) => {
          const viewsH = (week.views / maxVal) * 100;
          const whatsappH = (week.whatsapp / maxVal) * 100;
          const websiteH = (week.website / maxVal) * 100;

          // Format date label
          const dateLabel = formatWeekLabel(week.date);

          return (
            <div
              key={week.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="flex items-end gap-[2px] h-36 w-full justify-center">
                {/* Views bar - purple */}
                <div
                  className="w-3 rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(viewsH, 2)}%`,
                    backgroundColor: '#7b2ff2',
                    opacity: week.views > 0 ? 1 : 0.2,
                  }}
                  title={`Vistas: ${week.views}`}
                />
                {/* WhatsApp bar - green */}
                <div
                  className="w-3 rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(whatsappH, 2)}%`,
                    backgroundColor: '#25D366',
                    opacity: week.whatsapp > 0 ? 1 : 0.2,
                  }}
                  title={`WhatsApp: ${week.whatsapp}`}
                />
                {/* Website bar - blue */}
                <div
                  className="w-3 rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(websiteH, 2)}%`,
                    backgroundColor: '#3b82f6',
                    opacity: week.website > 0 ? 1 : 0.2,
                  }}
                  title={`Web: ${week.website}`}
                />
              </div>
              <span className="text-[10px] text-[#a090b8] whitespace-nowrap">
                {dateLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[#a090b8]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#7b2ff2]" />
          Vistas
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#25D366]" />
          WhatsApp
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
          Web
        </span>
      </div>
    </div>
  );
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  return `${day} ${months[d.getMonth()]}`;
}
