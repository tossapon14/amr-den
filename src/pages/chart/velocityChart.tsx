import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface VelocityChartProps {
  level: number; // Battery percentage (0 - 50)
}

const VelocityChart: React.FC<VelocityChartProps> = ({ level }) => {
  const data = [
    { name: "velocity", value: level }, // Filled part
    { name: "velocity2", value: 20 - level }, // Empty part
  ];

  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart> 
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="30%"
            innerRadius={50}
            outerRadius={60}
            startAngle={90}
            endAngle={-270} // Rotates the chart correctly
          >
            <Cell key="filled" fill="#EB5B00" />
            <Cell key="empty" fill="#E0E0E0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "26px",
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {level.toFixed(1)}
        <p style={{fontSize:"12px",fontWeight:"normal"}}>km/h</p>
        
      </div>
      <p style={{
        position:"absolute",
        fontSize: "14px",
        fontWeight: "normal",
        textAlign: "center",
        color: "#999999",
        transform: "translate(-50%, -50%)",
        top: "65%",
        left: "50%",
        }}>max 20 km/h</p>
    </div>
  );
};

export default VelocityChart;