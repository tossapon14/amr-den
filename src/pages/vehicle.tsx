import React, { useState, useRef, useEffect } from 'react';
import '../pages/css/vehicle.css';
import { useTranslation } from 'react-i18next';
import StatusOnline from './option/statusOnline';
import NotAuthenticated from './option/notAuthenticated';
import type { IPayload } from './home';
import axiosGet from '../api/axiosInstance';
import BatteryDonutChart from './chart/batteryDonut';
import NetworkError from './option/networkError';
import RobotImg from '../assets/images/robot.png';
import { FaCircle } from "react-icons/fa";
 
// Define an interface for the component's props for type safety



// Use React.FC (FunctionComponent) type for the component
const Vehicle = () => {
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [agvAll, setAgvAll] = useState<IPayload[]>([]);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [onlineBar, setOnlineBar] = useState<null | boolean>(null);
  const onlineRef = useRef<boolean | null>(null);
  const [checkNetwork, setCheckNetwork] = useState(true);
  const [notauthenticated, setNotAuthenticated] = useState(false);
  const myPosition = useRef<string>("");
  const myUser = useRef<string>("");
  const { t } = useTranslation("vehicle");
  const lastBackup = import.meta.env.VITE_REACT_APP_LAST_BACKUP
  const windowOfData = (name: string, index: number) => {
  setAgvAll(prev =>
    prev.map(agv => {
      if (agv.name !== name) return agv;
      if (agv.windowData === index) return agv;
      return { ...agv, windowData: index };
    })
  );
};

  useEffect(() => {
    const getStore = sessionStorage.getItem("user")?.split(",")
    if (!getStore) return;
    myUser.current = getStore[4] ?? "";
    myPosition.current = getStore[2] ?? "";
    const vehicle = myPosition.current === "admin" ? "ALL" : myPosition.current;

    const getAgv = async () => {
      try {
        const res: any = await axiosGet(
          `/vehicle/vehicles?vehicle_name=${vehicle}&state=ALL`,
        );
        if (onlineRef.current == false) {
          setOnlineBar(true);
          onlineRef.current = true;
        }
        const agv = res.data.payload as IPayload[];
        console.log("AGV Data:", agv);

        const _agv = agv.map(a => ({ ...a, windowData: 0 }));
        setAgvAll(_agv);
      } catch (e: any) {
        console.error(e);
        if (e.message === "Network Error") {
          setOnlineBar(false);
          onlineRef.current = false;
        }
        else if (e.response?.status === 401 || e.response?.data?.detail === "Invalid token or Token has expired.") {
          setNotAuthenticated(true)
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
          }
        }
      }

    }
    const checkNetwork = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_API_URL, { method: "GET" });
        if (response.ok) {
          getAgv();
          timerInterval.current = setInterval(() => {
            getAgv();
          }, 4000);
        }
      } catch (e: any) {
        console.error(e);
        setCheckNetwork(false);
      } finally {
        if (!loadSuccess) {
          setLoadSuccess(true);
        }
      }
    };
    checkNetwork();
     return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);
  return (
    <div className='vehicle-box-page'>
      {!loadSuccess && <div className='loading-background'>
        <div id="loading"></div>
      </div>}
      {onlineBar !== null && <StatusOnline online={onlineBar}></StatusOnline>}
      {notauthenticated && <NotAuthenticated />}
      {!checkNetwork ? <NetworkError /> :
        <div className="vehicle-content-box">
          {agvAll.map((agv, index) =>
            <div className="card-vehicle" key={index}>
              <div className="header">
                <div className="title-section">
                  <div className="title">{agv.name}</div>
                  {agv.connected ? <div className="vehicle-header">
                    <FaCircle color='#01ed01ff' style={{ marginTop: '2px' }} />
                    <p> Online </p>
                    {agv.mission_id ? <p>mission {agv.mission_id} &#187; requester {agv.mission?.requester}</p> : <p> No Mission</p>}
                  </div> : <div className="vehicle-header">
                    <FaCircle color='#ff0000ff' style={{ marginTop: '2px' }} />
                    <p> Offline</p>
                  </div>}
                </div>
                <div className="settings-icon">⚙️</div>
              </div>

              <div className="vehicle-content">
                <div className="d-flex flex-column align-items-center">
                  <div className="robot-img">
                    <img src={RobotImg} alt='robot' style={{ width: "100px", height: "100px" }} />
                  </div>
                  {agv.alarm_state&&<div className="alarm-block">
                    <div className="alarm-icon">⚠️</div>
                    <div className="alarm-content">
                      <div className="alarm-title">AGV have alert</div>
                      <a href="/alarms" className="alarm-detail">See detail</a>
                    </div>
                  </div>}
                </div>

                <div className="info">
                  <div className="info-row">
                    <span className="label">Customer</span>
                    <span className="value">Denso Group</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Robot type</span>
                    <span className="value">{agv.model}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Home</span>
                    <span className="value">{agv.home}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Software</span>
                    <span className="value">v2.4.1</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Map</span>
                    <span className="value">{agv.map}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Alerts</span>
                    {agv.alarm_state&&<span className="badge badge-red">⚠️ alarm</span>}
                  </div>
                  <div className="info-row">
                    <span className="label">Emergency</span>
                     {agv.emergency_state&&<span className="badge badge-yellow">⚠️ alarm</span>}
                  </div>
                  <div className="info-row">
                    <span className="label">Safety</span>
                    {agv.pause_state&&<span className="badge badge-yellow">⚠️ active</span>}
                  </div>

                  <div className="info-row" style={{ borderBottom: "1px solid #949494ff" }}>
                    <span className="label">Last backup</span>
                    <span className="value">{lastBackup}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">IP address</span>
                    <span className="value">192.268.2.2</span>
                  </div>
                  <div className="info-row" style={{ borderBottom: "1px solid #949494ff" }}>
                    <span className="label">Port</span>
                    <span className="value">4000</span>
                  </div>
                </div>

              </div>

              {/* <div className="alert-box">
                <span className="alert-icon">⚠️</span>
                <span><strong>Robot stopped</strong> due to overheat. Time: 14h 30m</span>
              </div> */}

              <div className="footer">
                <div className="btn-group">
                  <button className={`${agv.windowData === 0 ? "active" : ''}`} onClick={() => windowOfData(agv.name, 0)}>Status</button>
                  <button className={`${agv.windowData === 1 ? "active" : ''}`} onClick={() => windowOfData(agv.name, 1)}>Mission</button>
                  <button className={`${agv.windowData === 2 ? "active" : ''}`} onClick={() => windowOfData(agv.name, 2)}>Path</button>
                </div>
              </div>
              {agv.windowData === 0 && <div className="d-flex py-3">
                <BatteryDonutChart level={agv.connected ? agv.battery : 0}></BatteryDonutChart>

                <div className="info2">
                  <div className="info-row">
                    <span className="label">State</span>
                    <span className="value">{t(`m_status_${agv.state}`)}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Speed</span>
                    <span className="value">{agv.velocity.toFixed(2)} KM/h</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Node</span>
                    <span className="value">{agv.current_node}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Mode</span>
                    <span className="value">{agv.mode}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Coordinate</span>
                    <span className="value">{agv.coordinate.map(ele => ele.toFixed(4)).join()}</span>
                  </div>

                </div>
              </div>}
              {agv.windowData === 1 && <div className="d-flex flex-wrap pt-3 px-0">
                <div className="info2 mx-1">
                  <div className="info-row">
                    <span className="label">Mission</span>
                    <span className="value">{agv.mission?.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status</span>
                    {agv.mission && <span className="value">{t(`m_status_${agv.mission?.status}`)}</span>}
                  </div>
                  <div className="info-row">
                    <span className="label">transport</span>
                    {agv.mission && <span className="value">{t(`t_state_${agv.mission?.transport_state}`)}</span>}
                  </div>
                  <div className="info-row">
                    <span className="label">Requester</span>
                    <span className="value">{agv.mission?.requester}</span>
                  </div>

                </div>
                <div className="info2 mx-1 col-6">
                  <div className="info-row">
                    <span className="label">mission type</span>
                    <span className="value">{agv.mission?.mission_type}</span>
                  </div>


                  <div className="info-row">
                    <span className="label">priority</span>
                    <span className="value">{agv.mission?.priority}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">timestamp</span>
                    {agv.mission && <span className="value">{agv.mission?.timestamp.substring(0, 19)}</span>}
                  </div>
                  {/* <div className="info-row">
                    <span className="label">requester</span>
                    {agv.mission && <span className="value">{agv.mission?.requester}</span>}
                  </div> */}
                </div>

              </div>}
              {agv.windowData === 2 && <div className="d-flex flex-wrap pt-3 px-0">
                <div className="info-path mx-1">
                  <div className="info-row">
                    <span className="label">Pass node</span>
                    <span className="value">{agv.mission?.passed_nodes.join()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Station</span>
                    <span className="value">{agv.mission?.stations.join()}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Nodes</span>
                    <span className="value">{agv.mission?.nodes.join()}</span>
                  </div>

                </div>

              </div>
              }


            </div>)}

        </div>}

    </div >
  );
};

export default Vehicle;