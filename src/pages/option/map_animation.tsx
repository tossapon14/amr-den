import BgMap from '../assets/images/bg_map.png';
import AGV1 from '../assets/images/carmodel_purple.png';
import AGV2 from '../assets/images/carmodel.webp';
import AGV3 from '../assets/images/carmodel_yellow.png';
import AGV4 from '../assets/images/carmodel_green.png';
import Pin from '../assets/images/pin2.png';

import Location from "../assets/images/location.png";
import Switch from './switch';
import { useState, useRef, useMemo } from 'react'
import './css/map.css';

interface MapAnimateProps {
  position: { name: string, position: string }[]
  paths: { paths: number[][], drop: number[][] } | null
}
const AGV: { [key: string]: string } = { AGV1: AGV1, AGV2: AGV2, AGV3: AGV3, AGV4: AGV4 }
function MapAnimate({ position, paths }: MapAnimateProps) {
  const [stationshow, setStationshow] = useState(true);
  const [sw, setSwitch] = useState(true);
  const prev_deg = useRef<{ [key: string]: number }>({});


  const mapID = useRef<HTMLDivElement>(null);
  const setSwitchShow = () => {
    setSwitch(!sw);
    setStationshow(!stationshow);
  };
  const positionsPoint = (point: number[]): number[] => {
    const positionX = (((point[0] * -0.9966398834184859 - point[1] * 0.08190813622337459 + 52) / 1005) * mapID.current!.clientWidth) ;
    const positionY = ((1 - ((point[0] * 0.08190813622337459 + point[1] * -0.9966398834184859 + 280) / 586.10)) * mapID.current!.clientHeight) ;
    return [positionX, positionY];
  };

  const agvPosition = useMemo((): { name: string, x: string, y: string, rotate: string }[] => {
    if (mapID.current != null && position.length > 0) {
      return position.map((agv) => {
        const agvPosition = agv.position.split(",");
        const [positionX, positionY] = positionsPoint([Number(agvPosition[0]), Number(agvPosition[1])]);
        const x = -15 + positionX;
        const y = -12 + positionY;
        // Calculate rotation based on the position string
        const degree = ((Number(agvPosition[2]) - 0.082) * -180) / Math.PI;
        if (prev_deg.current[agv.name] === undefined) {
          prev_deg.current[agv.name] = 0.0;
        }
        let delta = degree - prev_deg.current[agv.name];

        delta = ((delta + 180) % 360 + 360) % 360 - 180;
        prev_deg.current[agv.name] = prev_deg.current[agv.name] + delta;
        if (Math.abs(prev_deg.current[agv.name]) > 1e6) {
          prev_deg.current[agv.name] %= 360;
        }
        return { name: agv.name, x: x.toString(), y: y.toString(), rotate: `rotate(${prev_deg.current[agv.name].toFixed(2)})` };
      });

    }
    return [];
  }, [position]);

  const calPathAgv = useMemo((): { paths: string, drop: { x: number, y: number }[] } => {
    if (mapID.current != null && paths !== null && paths?.paths.length != 0) {
      let d = "M";
      paths!.paths.forEach(point => {
        const [positionX, positionY] = positionsPoint(point);
        d = d + ' ' + positionX.toFixed(2) + ' ' + positionY.toFixed(2);
      });
      const drop: { x: number, y: number }[] = [];
      paths!.drop.forEach((point) => {
        const [positionX, positionY] = positionsPoint(point);
        drop.push({ x: positionX, y: positionY })
      });
      return { paths: d, drop: drop };
    } else {
      return { paths: "", drop: [] };
    }

  }, [paths]);


  return (
    <div id="map" ref={mapID}>
      <img src={BgMap} className="map-img" alt="map" loading="lazy" />
      {stationshow && <img src={Location} className="map-img" alt="location" loading="lazy" />}
      <svg className="svg">
        <path
          d={calPathAgv.paths}
          fill="none"
          stroke="red"           // Line color
          strokeWidth={4}        // Line thickness
          strokeLinejoin="round"
          strokeLinecap="round"  // Makes the line edges rounded
        />

        {calPathAgv.drop.map((drop, index) => (
          <g key={index}>
            <circle
              cx={drop.x}
              cy={drop.y}
              r="10"
              fill="white"
              stroke="black"
              strokeWidth="2"
            />
            <image
              x={drop.x - 20}  // Center the pin image if needed
              y={drop.y - 40}
              href={Pin}
              className="pin-animate"
            />
          </g>
        ))}
        {agvPosition.map((agv => <image
          key={agv.name}
          x={agv.x}
          y={agv.y}
          width={48}
          height={24}
          href={agv.name in AGV ? AGV[agv.name] : AGV1}
          className="carmodel-position"
          transform={agv.rotate}
          transform-origin={"30% 50%"}
        />))}
      </svg>
      <div className="switch-map-pick">
        <h6>{sw ? "show" : "hide"}</h6>
        <Switch isOn={sw} handleToggle={setSwitchShow} />
      </div>
    </div>
  );
}

export default MapAnimate;