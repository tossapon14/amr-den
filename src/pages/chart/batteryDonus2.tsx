import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BatteryDonutChartProps {
  level: number; // Battery percentage (0 - 100)
}

const BatteryDonutChart2: React.FC<BatteryDonutChartProps> = ({ level }) => {
  const battery_low_alert = Number(import.meta.env.VITE_REACT_APP_BATTERY_LOW_ALERT) || 30;

  const data = [
    { name: "Battery", value: level }, // Filled part
    { name: "Remaining", value: 100 - level }, // Empty part
  ];


  // Change color based on battery level
  const getBatteryColor = (level: number): string => {
    if (level > 50) return "#0d6efd"; // Green (High)
    else if (level > battery_low_alert) return "#FFC107"; // Yellow (Medium)
    return "#ff1100ff"; // Red (Low)
  };

  return (
    <div style={{ position: "relative", width: 300, height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Battery Level Arc */}
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="40%"
            innerRadius={90}
            outerRadius={105}
            startAngle={90}
            endAngle={-270} // Rotates the chart correctly
          >
            <Cell key="filled" fill={getBatteryColor(level)} />
            <Cell key="empty" fill="#E0E0E0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div
        style={{ top: "42%", left: "50%" }}
        className={`text-batteryDonut ${battery_low_alert >= level ? "color-red" : "color-black"}`}
      >
        <h2 className={`${battery_low_alert >= level ? "color-red animation" : "color-black"}`}>{level}</h2>
        <p style={{ fontSize: "12px", fontWeight: "normal"}}>battery %</p>

      </div>
    </div>
  );
};

export default BatteryDonutChart2;