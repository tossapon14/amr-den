import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BatteryDonutChartProps {
  level: number; // Battery percentage (0 - 100)
}

const BatteryDonutChart: React.FC<BatteryDonutChartProps> = ({ level }) => {
  const data = [
    { name: "Battery", value: level }, // Filled part
    { name: "Remaining", value: 100 - level }, // Empty part
  ];
  const battery_low_alert = Number(import.meta.env.VITE_REACT_APP_BATTERY_LOW_ALERT) || 30;


  // Change color based on battery level
  const getBatteryColor = (level: number): string => {
    if (level > 40) return "#003092"; // Green (High)
    else if (level > battery_low_alert) return "#FFC107"; // Yellow (Medium)
    return "#ff0000ff"; // Red (Low)
  };

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Battery Level Arc */}
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={50}
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
        className={`text-batteryDonut ${battery_low_alert >= level ? "color-red" : "color-black"}`}
      >
        <h3 style={{fontSize:"12px"}} className={`${battery_low_alert >= level ? "color-red animation" : "color-black"}`}>{level}</h3>
        <p style={{ fontSize: "8px", fontWeight: "normal"}}>battery %</p>

      </div>
    </div>
  );
};

export default BatteryDonutChart;