"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { EnrollmentSeriesPoint } from "@/lib/actions/instructor";

interface EnrollmentChartProps {
  data: EnrollmentSeriesPoint[];
}

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "dd MMM"),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.70 0.18 50)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="oklch(0.70 0.18 50)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.90 0.012 70 / 60%)"
        />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: "oklch(0.46 0.02 60)" }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "oklch(0.46 0.02 60)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.012 70)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => [Number(value ?? 0), "Enrollments"]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="oklch(0.70 0.18 50)"
          strokeWidth={2}
          fill="url(#enrollGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.70 0.18 50)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
