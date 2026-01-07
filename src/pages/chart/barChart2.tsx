import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type{ IStatisticsData } from '../statistics';

interface BGBarChartProps {
  data: IStatisticsData | undefined;
  mode?: boolean;
  showText?: boolean;
}

const BGBarChart: React.FC<BGBarChartProps> = ({ data, mode, showText }) => {
  const series = useMemo(() => {
    if (!data?.series) return [];
    return mode
      ? data.series.map(item => ({
        ...item,
        data: item.data.map(d => d * 8),
      }))
      : data.series;
  }, [data, mode,showText]); // 👈 recompute whenever mode OR data changes

  const options: ApexCharts.ApexOptions = {
    colors: ["#dc0606ff", "#ffb066ff"],
    chart: { type: 'bar', height: 350 },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 2,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: 'top', // Labels above the columns
          orientation: 'vertical',
        },
      },
    },
    dataLabels: {
      enabled: showText,
      formatter: function (val) {
        return Number(val) + (mode ? " pallet" : " mission");
      },
      offsetY: 10, // Move label upward
      style: {
        fontSize: '12px',
        colors: ["#909090ff"]
      }
    },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: data?.barName || [] },
    yaxis: { title: { text: mode ? 'pallet' : 'mission' } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val: number) => `${val} ${mode ? 'pallet' : 'mission'}` } },
  };

  return <ReactApexChart key={mode ? "pallet-mode" : "mission-mode"} options={options} series={series} type="bar" height="80%" />;
};

export default BGBarChart;
