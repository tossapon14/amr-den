import { axiosGet } from "../api/axiosFetch";
import { useEffect, useRef, useState } from 'react';
import { FcChargeBattery } from "react-icons/fc";
import BatteryAreaChart from "./chart/BatteryAreaChart";
import { IoMdDownload } from "react-icons/io";
import { RiBatteryChargeLine } from "react-icons/ri";
import BatteryDonutChart2 from "./chart/batteryDonus2.tsx";
import BatteryAreaChart2 from "./chart/BatteryAreaChart2.tsx";
import NetworkError from './networkError';
import DatePicker from "react-datepicker";
import { useTranslation } from 'react-i18next';
import './css/battery.css';
import NotAuthenticated from "./option/notAuthenticated.tsx";
import StatusOnline from "./option/statusOnline.tsx";

interface IBattery {
  [key: string]: number[][]
}
export interface IDataSeries {
  series: { name: string; data: { x: number, y: number }[] }[]
} const getBattery = async (url: string): Promise<IBattery> => {
  const res: IBattery = await axiosGet(url);
  return res;
};
const downloadCSV = async (vehicle:string, start_date: string, end_date: string) => {
  const fetchData: string = await axiosGet(
    `/vehicle/export_battery_report?vehicle_name=${vehicle}&start_date=${start_date}&end_date=${end_date}`);
  const blob = new Blob([fetchData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `battery_vehicle_${vehicle}_date_${start_date}_${end_date}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

const colorLine = ['#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800']
const Battery = () => {
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [vehicle, setVehicle] = useState<string>("ALL"); // Default to "desc"
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [battery, setBattery] = useState<IDataSeries>({ series: [] });
  const [checkNetwork, setCheckNetwork] = useState(true);
  const saveUrl = useRef<string>("");
  const [btnAGV, setBtnAGVName] = useState<string[]>([]);
  const saveVehicle = useRef<string>("ALL");
  const saveDateStart = useRef<string>("");
  const saveDateEnd = useRef<string>("");
  const timerInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notauthenticated, setNotAuthenticated] = useState(false);
  const [onlineBar, setOnlineBar] = useState<null | boolean>(null);
  const onlineRef = useRef<boolean | null>(null);
  const [loadingWhenClick, setLoadingWhenClick] = useState<boolean>(false);

  const { t } = useTranslation("mission");


  const reloadDataByDate =async (data: { v?: string, d?: Date, de?: Date, }) => {
    if (data.v) {
      saveVehicle.current = data.v;
      setVehicle(data.v);
    }
    else if (data.d) {
      if (data.d > new Date(saveDateEnd.current)) {
        return;
      }
      const bangkokOffsetMs = 7 * 60 * 60 * 1000;
      const localTime = data.d!.getTime() + bangkokOffsetMs;
      const _date: string = new Date(localTime).toISOString().substring(0, 10);
      saveDateStart.current = _date;
      setStartDate(_date);
    }
    else if (data.de) {
      if (data.de < new Date(saveDateStart.current)) {
        return;
      }
      const bangkokOffsetMs = 7 * 60 * 60 * 1000;
      const localTime = data.de!.getTime() + bangkokOffsetMs;
      const _date: string = new Date(localTime).toISOString().substring(0, 10);
      saveDateEnd.current = _date
      setEndDate(_date);
    }
    saveUrl.current = `/vehicle/battery_level?vehicle_name=${saveVehicle.current}&start_date=${saveDateStart.current}&end_date=${saveDateEnd.current}`;
    setLoadingWhenClick(true);
    batterySetPage(saveUrl.current);
  };

  const batterySetPage = async (url: string) => {
    try {
      const res = await getBattery(url);
      if (onlineRef.current == false) {
        setOnlineBar(true);
        onlineRef.current = true;
      }
      const _series: { name: string; data: { x: number, y: number }[] }[] = [];
      for (var agv in res) {
        const dataBattery: { x: number, y: number }[] = [];
        for (var i = 0; i < res[agv].length; i += 3) {
           dataBattery.push({ x:  (res[agv][i][2]+25200)*1000 , y: res[agv][i][1] });
        }
        _series.push({ name: agv, data: dataBattery });
      }

      setBattery({ series: _series });
    } catch (e: any) {
      console.error(e);
      if (e.message === "Network Error") {
        setOnlineBar(false);
        onlineRef.current = false;
      }
      else if (e.response?.status === 401 || e.response?.data?.detail === "Invalid token or Token has expired.") {
        setNotAuthenticated(true)
        if (timerInterval.current) {
          clearInterval(timerInterval.current as ReturnType<typeof setTimeout>);
        }
      }
    } finally {
      setLoadingWhenClick(false);
    }
  };
  useEffect(() => {


    const checkNetwork = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_API_URL, { method: "GET" });
        if (response.ok) {
          const _date = new Date().toISOString().substring(0, 10)
          saveUrl.current = `/vehicle/battery_level?vehicle_name=ALL&start_date=${_date}&end_date=${_date}`;
          saveDateStart.current = _date;
          saveDateEnd.current = _date;
          setBtnAGVName(JSON.parse(sessionStorage.getItem("vehicle")??'[]') as string[]);
          batterySetPage(saveUrl.current);
          timerInterval.current = setInterval(() => {
            batterySetPage(saveUrl.current);
          }, 10000);
        }
      } catch (e: any) {
        console.error(e);
        setCheckNetwork(false);
      } finally {
        setLoadSuccess(true);
      }
    };
    checkNetwork();
    return () => {
      if (timerInterval.current != null) {
        clearInterval(timerInterval.current! as ReturnType<typeof setTimeout>);
      }
    }
  }, []);
  return <div className="statistics-box">
    {!loadSuccess && <div className='loading-background'>
      <div id="loading"></div>
    </div>}
    {loadingWhenClick && <div className="fixed-top w-100 h-100 d-flex justify-content-center align-items-center z-2" style={{ background: "rgb(5,5,5,0.2)" }}>
      <div id="loading"></div>
    </div>}
    {onlineBar !== null && <StatusOnline online={onlineBar}></StatusOnline>}
    {notauthenticated && <NotAuthenticated />}
    <div className='mb-1 mb-md-3 d-flex align-items-center justify-content-between flex-wrap'>
      <div>
        <h1>{t("bt_title")}</h1>
        <p> <FcChargeBattery size={32} style={{ transform: ' rotate(45deg)' }} />
          <span className='ms-3 me-5'>{t("bt_subtitle")}</span>
        </p>
      </div>

      {checkNetwork && <div className='input-date-box m-0'>
        <div className="form-group">
          <label>{t("from")}</label>
          <div className='box-of-text-date'>
            <div className='ps-2'>{startDate}</div>
            <DatePicker selected={new Date(startDate)} onChange={(e) => reloadDataByDate({ d: e ?? undefined })} />
          </div>
        </div>

        <div className="form-group">
          <label >{t("to")}</label>
          <div className='box-of-text-date'>
            <div className='ps-2'>{endDate}</div>
            <DatePicker selected={new Date(endDate)} onChange={(e) => reloadDataByDate({ de: e ?? undefined })} />
          </div>
        </div>
        <button className="export-btn2" onClick={() => downloadCSV(saveVehicle.current, startDate, endDate)}><IoMdDownload /> <span className="d-none d-sm-inline">{t("downloadBtn")}</span> </button>
      </div>}
    </div>
    {!checkNetwork ? <NetworkError /> : <>
      <div className="selected-agv-box mb-2">
        {btnAGV.map((name) => <button key={name} onClick={() => reloadDataByDate({ v: name })} className={`${vehicle === name ? "active" : ""}`}>{name}</button>)}
      </div>
      {vehicle==="ALL" && <div className='chart-all-agv'>

        <h5>{t("bt_all_agv")}</h5>
        <p className='p-subtitle'>{t("bt_sub1")}</p>
        <div className='chart'>
          <BatteryAreaChart data={battery} />
        </div>

      </div>}

      {battery.series.map((agv, i) =>
        <div className="agv-one-box" key={agv.name}>
          <hr className="battery-label-center-hr" />
          <p className="battery-label-center">{agv.name}</p>
          <div className="battery-current">
            <h5><RiBatteryChargeLine size={32} color='red' /><span className="ms-2">{agv.name}</span></h5>
            <p className='p-subtitle'>{t("bt_sub2")}</p>
            <div className="d-flex w-100 h-100 justify-content-center align-items-center">
              <BatteryDonutChart2 level={agv.data[agv.data.length - 1].y}></BatteryDonutChart2>
            </div>
          </div>
          <div className='agv-one-chart'>
            <h5>{agv.name}</h5>
            <p className='p-subtitle'>{t("bt_sub3")}</p>
            <div className='chart'>
              <BatteryAreaChart2 data={agv} color={colorLine[i]} />
            </div>
          </div>

        </div>)}
    </>}

  </div>;
}
export default Battery;