import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LogsChart = ({ logs }) => {
  if (!logs || logs.length === 0) return <p>No logs to display in chart.</p>;

  // Level bazında sayıları hesapla
  const levelCounts = logs.reduce((acc, log) => {
    const level = log.level?.toLowerCase() || "unknown";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Grafiğe uygun array formatı
  const chartData = Object.keys(levelCounts).map((level) => ({
    level,
    count: levelCounts[level],
  }));

  return (
    <div style={{ width: "100%", height: 300, marginTop: "2rem" }}>
      <h2>📊 Log Levels Chart</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="level" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LogsChart;
