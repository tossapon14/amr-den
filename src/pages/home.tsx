import { useEffect, useState, useRef } from 'react';
import './css/home.css';
import MapPGMCanvas from './option/map_pgm_canvas';
import { FaCircle } from "react-icons/fa";
import MapCommand from './option/map_command2';
import { BiSolidError, BiError } from "react-icons/bi";
import { IoCloseOutline, IoChevronDownSharp } from "react-icons/io5";
import { axiosGet } from '../api/axiosFetch';
import { useTranslation } from 'react-i18next';
import StatusOnline from './option/statusOnline';
import HomeAlarmError from './option/homeAlarmError';
import NotAuthenticated from './option/notAuthenticated';
import LowBatt from '../assets/images/low-battery.png';
import { PiBatteryWarningVerticalFill } from "react-icons/pi";

interface AppProps {
  title: string;
}
interface IagvDataModel {
  agv: string
  id?: number
  agvCode: string
  state: number
  mode: string
  pickup?: string
  drop?: string[]
}
export interface IVehicles {
  message: string
  payload: IPayload[]
}
export interface IPayload {
  model: string
  safety_state: boolean
  current_node: any[]
  name: string
  pause_state: boolean
  home: string
  ip_address: string
  alarm_state: boolean
  port: string
  emergency_state: boolean
  mission_id?: number | null
  battery: number
  connected: boolean
  coordinate: number[]
  state: number
  map: string
  mode: string
  velocity: number
  mission: any | null
  processMission?: { percents?: number, dropList: string[], numProcess?: number, dropNumber?: number };
  timestamp?: string
  showInfo: boolean
  windowData?: number
}

interface IMission {
  id: number
  requester: string
  type: number
  nodes: string
  nodes_idx: string
  paths: string
  paths_coordinate: number[][][]
  status: number
  transport_state: number
  vehicle_name: string
  timestamp: string
  dispatch_time: any
  arriving_time: string | null
  duration: any
  nodes_coordinate: number[][]
}

interface IMissionCreate {
  nodes: string
  requester: string
  type: number
  vehicle_name: string
}
interface IMissionDrop {
  id: number
  nodes: string
  status: number
  transport_state: number
  vehicle_name: string
}

export interface IPayloadMission {
  arriving_time: string
  dispatch_time: string
  duration: string
  id: number
  nodes: string
  paths: string
  requester: string
  status: number
  str_status: { txt: string, color: string, bgcolor: string }
  timestamp: string
  transport_state: number
  vehicle_name: string
  drop: string
  pick: string
}


interface IdialogConfirm {
  show: boolean
  name?: string
  id?: number
  agvCode?: string
  dropOne?: string
  dropAll?: string[]
  pickupName?: string
}
interface IGetCanDrop {
  pickup: string | null
  selected_dropoffs: string[]
  blocked_dropoffs: string[]
  available_dropoffs: string[]
}

// Use React.FC (FunctionComponent) type for the component
const Home = () => {
  const [showDialog, setShowDialog] = useState<{ show: boolean, v_name: string, online: boolean }>({ show: false, v_name: "", online: false });
  const myPosition = useRef<string>("");
  const myUser = useRef<string>("")
  const selectAgv = useRef<string>('');
  const battery_low_alert = useRef<number>(30)
  const timerInterval = useRef<number>(0);
  const missionLoop = useRef<number>(0);
  const controller = useRef<AbortController>(new AbortController());
  const onlineRef = useRef<boolean>(true);
  const audioRingTone = useRef<HTMLAudioElement | null>(null);
  const mapHavePath = useRef<boolean>(false);
  const [onlineBar, setOnlineBar] = useState<null | boolean>(null);
  const loadSave = useRef(false);
  const [agvPath, setAgvPath] = useState<{ paths: number[][], drop: number[][] } | null>(null);
  const [agvAll, setAgvAll] = useState<IPayload[]>([]);
  const [agvHaveAlarm, setAgvHaveAlarm] = useState<string | null>(null);
  const [batteryLow, setBatteryLow] = useState<{ name: string, battery: number } | null>(null);
  const [notauthenticated, setNotAuthenticated] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const { t } = useTranslation("home");
  const showInfoRobot = useRef<{ [key: string]: boolean }>({});
  const [robotPose, setRobotPose] = useState<Map<string, { x: number; y: number; theta: number }>>(new Map());
  const robotPoseRef = useRef<Map<string, { x: number; y: number; theta: number }>>(new Map());

  const playRingtone = () => {
    if (import.meta.env.VITE_REACT_APP_USE_AUDIO === "true") {
      audioRingTone.current?.play();
    }
  };
  const stopRingtone = () => {
    if (import.meta.env.VITE_REACT_APP_USE_AUDIO === "true") {
      audioRingTone.current?.pause();
      audioRingTone.current!.currentTime = 0;
    }
  };
  const onclickCommand = (v_name: string, online: boolean) => {
    setShowDialog(({ show: !showDialog.show, v_name: v_name, online: online }));
  }
  const onclickRobotCloseBtn = (name: string) => {
    showInfoRobot.current[name] = !showInfoRobot.current[name];
    setAgvAll(prev => prev.map(agv => agv.name === name ? { ...agv, showInfo: showInfoRobot.current[name] } : agv));
  }
  const calProcessMission = (agvCurrent_index: number | null, missionNodes_index: string | undefined, nodes: string): { percents?: number, dropList: string[], numProcess?: number, dropNumber?: number } | null => {
    if (missionNodes_index == undefined || missionNodes_index == "") {
      return null;
    }
    else if (!agvCurrent_index) return { dropList: nodes.split(',') };
    const mission_index_list = JSON.parse(missionNodes_index!); //[4,11,13,21]
    var numProcess = 0;
    var dropNumber = 0;
    var percents = 0;
    for (let i = 0; i < mission_index_list.length; i++) {
      if (mission_index_list[i] <= agvCurrent_index) {
        numProcess = i;
        if (i < mission_index_list.length - 1) {
          percents = Math.round((((agvCurrent_index - mission_index_list[i]) / (mission_index_list[i + 1] - mission_index_list[i])) + i) * 100 / (mission_index_list.length - 1))
        }
      } if (mission_index_list[i] < agvCurrent_index) {
        dropNumber = i
      }
    }

    return { percents: percents, dropList: nodes.split(','), numProcess, dropNumber };
  };
  const getAGVAPI = async () => {
    try {
      const res: IVehicles = await axiosGet(
        `/vehicle/vehicles?vehicle_name=${selectAgv.current}&state=ALL`, controller.current.signal
      );
      if (onlineRef.current == false) {
        setOnlineBar(true);
        onlineRef.current = true;
      }
      const _agvPosition2: { name: string, position: number[] }[] = [];
      const _agv: IPayload[] = [];
      const _currentMissionId: number[] = [];
      var haveAlarm: boolean = false;
      // console.log(res.payload)
      res.payload.forEach((data: IPayload) => {
        var _agvData: IPayload;
        if (showInfoRobot.current[data.name] === undefined) {
          if (data.connected) {
            showInfoRobot.current[data.name] = true;
          } else {
            showInfoRobot.current[data.name] = false;
          }
        }
        const showInfo = showInfoRobot.current[data.name];
        data.showInfo = showInfo;
        robotPoseRef.current.set(
          data.name,
          {
            x: data.coordinate[0],
            y: data.coordinate[1],
            theta: data.coordinate[2]
          }
        );
        if (data.state > 0) {
          _agvPosition2.push({ name: data.name, position: data.coordinate });
          if (data.mission) {

          } else {  // this condition for all AGV



          }

          _agvData = {
            ...data
          }
          _currentMissionId.push(data.mission.id);
        } else {  // no mission
          _agvData = data;
          if (mapHavePath.current) {
            setAgvPath(null);
            mapHavePath.current = false;
          }
          if (!audioRingTone.current?.paused) {
            stopRingtone();
          }
        }
        if (data.alarm_state) {
          haveAlarm = true;
        }
        else {  // agv state =0 
          _agvData = data;
          if (mapHavePath.current) {
            setAgvPath(null);
            mapHavePath.current = false;
          }
          if (!audioRingTone.current?.paused) {
            stopRingtone();
          }
        }
        _agv.push(_agvData);
      });
       setRobotPose(new Map(robotPoseRef.current));
      setAgvAll(_agv);
      if (haveAlarm) {
        setAgvHaveAlarm(selectAgv.current);
      }
      else {
        setAgvHaveAlarm(null);
      }
      if (selectAgv.current !== 'ALL' && _agv[0].battery <= battery_low_alert.current && _agv[0].state != 0) {
        setBatteryLow({ name: _agv[0].name, battery: _agv[0].battery })
      } else {
        setBatteryLow(null);
      }
    } catch (e: any) {
      if (e.message === "Network Error") {
        setOnlineBar(false);
        onlineRef.current = false;
      } else if (e.response?.status === 401 || e.response?.data?.detail === "Invalid token or Token has expired.") {
        setNotAuthenticated(true)
        if (timerInterval.current) {
          clearInterval(timerInterval.current as number);
        }
      }
      else if (e.response?.data?.detail) {
        console.error('getAGV', e.response.data.detail);
      }
      else {
        console.error(e.message)
      }
    } finally {
      if (!loadSave.current) {
        loadSave.current = true;
        setLoadSuccess(true);
      }
    }
  }



  useEffect(() => {
    const getStore = sessionStorage.getItem("user")?.split(",")

    if (!getStore) return;
    myUser.current = getStore[4] ?? "";
    myPosition.current = getStore[2] ?? "";
    selectAgv.current = myPosition.current === "admin" ? "ALL" : myPosition.current;
    battery_low_alert.current = Number(import.meta.env.VITE_REACT_APP_BATTERY_LOW_ALERT) || 30
    getAGVAPI();
    timerInterval.current = setInterval(() => {
      missionLoop.current++;
      getAGVAPI();
    }, 3000);
    return () => {
      // controller.current.abort();
      if (timerInterval.current) {
        clearInterval(timerInterval.current as number);
      }
    }
  }, []);

  return (
    <div className="home">
      <MapPGMCanvas robots={robotPose} />
      <div className="robot-info-panel">
        {agvAll.map(agv => <div key={agv.name} className="tracker-card">
          <div className="plane-image">
            <div className={`header-home-robots ${agv.connected ? "" : "bg-gray"}`}>
              <div className="flight-info" >
                <div className="robot-name">{agv.name}</div>
                {agv.connected ? <div className="airline">
                  <FaCircle color='#01ed01ff' style={{ marginTop: '2px' }} />
                  <p> Online </p>
                  {agv.mission_id ? <p>mision {agv.mission_id} &#187; {t(`t_state_${agv.mission?.transport_state}`)}</p> : <p> No Mission</p>}
                </div> : <div className="airline">
                  <FaCircle color='#ff0000ff' style={{ marginTop: '2px' }} />
                  <p> Offline </p>
                </div>}
              </div>
              <button className="close-btn" onClick={() => onclickRobotCloseBtn(agv.name)}>{agv.showInfo == true ? <IoCloseOutline /> : <IoChevronDownSharp />}</button>
            </div>
            <button className=" force-robot-btn" style={{
              bottom: "10px",
              left: "10px"
            }}>cancel</button>
            <button className=" force-robot-btn" style={{
              bottom: "10px",
              right: "10px"
            }}>pause</button>
            <div className="AlarmBar">
              {agv.emergency_state && <div className='EmergencyBar'><BiSolidError color="yellow" size={20} /> Emergency is press</div>}
              {agv.alarm_state && <div className='EmergencyBar'><BiSolidError color="red" size={20} /> Alarm is active</div>}
              {agv.pause_state && <div className='EmergencyBar'><BiSolidError color="orange" size={20} /> Pause is active</div>}
              {agv.battery <= battery_low_alert.current && <div className='EmergencyBar'><PiBatteryWarningVerticalFill color="red" size={20} /> Battery low {agv.battery} %</div>}
            </div>
          </div>
          <div className="info-panel" style={{ height: agv.showInfo == true ? '454px' : '0px', overflow: 'hidden' }}>
            <div className="route-section">
              {(agv.mission_id && agv.connected) ? <div>
                <div className="robot-station-route">
                  <div className="station">
                    <div className="station-code">P05</div>
                    <div className="station-title">Start</div>
                  </div>
                  <div className="plane-icon"> 🔜
                    {agv.mission.type === 1 && <p>URGENT</p>}
                  </div>
                  <div className="station">
                    <div className="station-code">D12</div>
                    <div className="station-title">Destination</div>
                  </div>
                </div>

                <div className="robot-path">
                  <div className="progress-bar"></div>
                </div>

                <div className="distance-time">
                  <span>{agv.mission?.requester} 13.02</span>
                  <span>882 km • 59m</span>
                </div>
              </div> : <div>
                <div className="robot-station-route">
                  <div className="station">
                    <div className="station-code">--</div>
                    <div className="station-title">Start</div>
                  </div>
                  <div className="plane-icon"></div>
                  <div className="station">
                    <div className="station-code">--</div>
                    <div className="station-title">Destination</div>
                  </div>
                </div>

                <div className="robot-path">
                  <div className="progress-bar" style={{ width: "100%" }}></div>
                </div>

                <div className="distance-time">
                  <span>-----</span>
                  <span>-----</span>
                </div>
              </div>}

            </div>

            <div className="details-section">
              <div className="section-title">Information</div>

              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Mode</div>
                  <div className="detail-value">{agv.mode}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{t(`state_${agv.state}`)}</div>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric">
                  <div className="metric-label">Speed</div>
                  <div className="metric-value">{agv.velocity.toFixed(2)} km/h</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Battery</div>

                  <div className="metric-value position-relative" >{agv.battery} %
                    {agv.battery <= battery_low_alert.current && <img className='position-absolute' src={LowBatt} alt="Low Battery" style={{ width: '24px', height: '24px', marginLeft: "8px" }} />}
                  </div>

                </div>
              </div>
            </div>

            <div className="actions">
              <div className="action-btn">
                <div className="action-icon">misstion</div>
                <div className="action-text">{agv.mission_id}</div>
              </div>
              <div className="action-btn">
                <div className="action-icon">action</div>
                <div className="action-text">{t(`m_status_${agv.mission?.status}`)}</div>
              </div>
              <div className="action-btn">
                <div className="action-icon">trans</div>
                <div className="action-text">{t(`t_state_${agv.mission?.transport_state}`)}</div>
              </div>


              <button className="command-btn" onClick={() => onclickCommand(agv.name, agv.connected)} >
                Command
              </button>
            </div>
          </div>

        </div>)}
      </div>
      <MapCommand funcClick={() => onclickCommand("", false)} data={showDialog} />
      {!loadSuccess && <div className={`loading-background`}>
        <div id="loading"></div>
      </div>}
      {onlineBar !== null && <StatusOnline online={onlineBar}></StatusOnline>}
      {batteryLow && <div className='battery-low-alert'>
        <div className='w-100 p-4 text-center h5'><BiError size={32} color={'red'} /><span className='ps-2'>{batteryLow?.name} {t('batteryLow')}</span>
        </div>
        <div className="w-100 text-center">
          <div className='d-inline font-weight-bold h3' style={{ color: 'red' }}>{batteryLow?.battery ?? 0} %<span style={{ paddingLeft: '16px', fontSize: "16px", color: 'rgb(229, 229, 229)' }}>{t('battery1')}</span></div>
          <p className='pt-3'>{t('battery2')}</p>
          <button className="battery-low-btn mt-3" onClick={() => setBatteryLow(null)}>OK</button>
        </div>
      </div>}
      {agvHaveAlarm && <HomeAlarmError agvName={agvHaveAlarm}></HomeAlarmError>}
      {notauthenticated && <NotAuthenticated />}
    </div>
  );
};

export default Home;