import ReactApexChart from 'react-apexcharts';
import type { IDataSeries } from '../battery';
interface IBatteryProps {
  data: IDataSeries
}
const BatteryAreaChart:React.FC<IBatteryProps> = ({data}) => {
      const series = data.series;
      const options:ApexCharts.ApexOptions ={
        chart: {
          type: 'area',
          stacked: false,
          zoom: {
            enabled: true
          },
        },
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
          // min: data.dateMin,
          // max: data.dateMax,
          // labels: {
          //     rotate: -15,
          //     rotateAlways: true,
          //     formatter: function(timestamp) {
          //       console.log(timestamp, new Date(timestamp!))
          //       return new Date(timestamp!).toLocaleDateString('en-GB')
          //   }
          // }
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
  export default BatteryAreaChart;