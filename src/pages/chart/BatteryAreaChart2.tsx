import ReactApexChart from 'react-apexcharts';
interface IBatteryProps {
  data: {
    name: string;
    data: {
        x: number;
        y: number;
    }[];
}
color:string
}
 const BatteryAreaChart2:React.FC<IBatteryProps> = ({data,color}) => {
      const battery_low_alert = Number(import.meta.env.VITE_REACT_APP_BATTERY_LOW_ALERT) || 30;
      const series = [data];
      const options:ApexCharts.ApexOptions ={
        chart: {
          height: 350,
          type: 'area'
        },
        annotations: {
          yaxis: [{
            y: battery_low_alert,
            borderColor: '#ff1100',
            label: {
              text: 'battery low',
              style: {
                color: "#fff",
                background: '#ff1100'
              }
            }
          }]},
        colors: [color],
        dataLabels: {
          enabled: false
        },
        markers: {
          size: 0,
        },
        fill: {
          type: 'gradient',
          gradient: {
              shadeIntensity: 1,
              inverseColors: false,
              opacityFrom: 0.45,
              opacityTo: 0.05,
              stops: [20, 100, 100, 100]
            },
        },
       
        yaxis: {
          min: 0,
          max: 100,
          title: {
            text: 'percent %',
          },
          labels: {
            style: {
              colors: '#8e8da4',
            },
            offsetX: 0,
            formatter: function (val) {
              return val.toString();
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          }
        }
        ,
        xaxis: {
          type: 'datetime',
          tickAmount: 8,
        },
        tooltip: {
          shared: true,
          x: {
            format: 'dd/MM/yy HH:mm'
          },
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
        }
      };
    

    return (
            <ReactApexChart options={options} series={series} type="area" height={'100%'} />
    );
  }
  export default BatteryAreaChart2;