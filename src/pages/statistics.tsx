import { useEffect, useRef, useState } from 'react';
import './css/statistics.css';
import { FcComboChart } from "react-icons/fc";
import { IoMdDownload } from "react-icons/io";
import { AiFillSetting } from "react-icons/ai";
import { IoCheckmarkCircle } from "react-icons/io5";
import { MdCancel } from "react-icons/md";
import { axiosGet } from "../api/axiosFetch";
import BGBarChart from './chart/barChart2';
import DatePicker from "react-datepicker";
import NetworkError from './networkError';
import { useTranslation } from 'react-i18next';
import NotAuthenticated from './option/notAuthenticated';
import StatusOnline from './option/statusOnline';



interface IStatistics {
  [key: string]: {
    [key: string]: number
    total_mission: number
    total_mission_complete: number
    total_mission_cancel: number
    total_mission_other: number
  }
}
export type IStatisticsData = {
  series?: ISeries
  barName?: string[]
}
type ISeries = { name: string, data: number[] }[]

const getData = async (url: string): Promise<IStatistics> => {

  const res: IStatistics = await axiosGet(url);
  return res;
};
const downloadCSV = async (start_date: string, end_date: string) => {
  const fetchData: string = await axiosGet(
    `/statistics/export_mission_report?start_date=${start_date}&end_date=${end_date}`);
  const blob = new Blob([fetchData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `statistics_date_${start_date}_${end_date}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};
export default function Statistics() {

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [dataDrop, setDataDrop] = useState<IStatisticsData>();
  const [dataPickup, setDataPickup] = useState<IStatisticsData>();
  const [dataMission, setDataMission] = useState<IStatisticsData>();
  const [totalMission, setTotalMission] = useState<{ mission: number, complete: number, cancel: number, other: number }>({ mission: 0, complete: 0, cancel: 0, other: 0 });
  const saveTotalMission = useRef<{ mission: number, complete: number, cancel: number, other: number } | null>(null);
  const optionIndex = useRef<number>(0);
  const [checkNetwork, setCheckNetwork] = useState(true);
  const saveUrl = useRef<string>("");
  const saveDateStart = useRef<string>("");
  const saveDateEnd = useRef<string>("");
  const timerInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notauthenticated, setNotAuthenticated] = useState(false);
  const [onlineBar, setOnlineBar] = useState<null | boolean>(null);
  const [loadingWhenClick, setLoadingWhenClick] = useState<boolean>(false);
  const onlineRef = useRef<boolean | null>(null);
  const [optionMissOrPall, setOptionMissOrPall] = useState<null | number>(null);
  const [optionsmodePickup, setOptionsModePickup] = useState<null | number>(null);
  const [optionsmodeALL, setOptionsModeALL] = useState<null | number>(null);
  const [optionsmodeDrop, setOptionsModeDrop] = useState<null | number>(null);
  const options = ["ALL", "Mission", "Pallet"];
  const optionsPickup = ["Mission", "Pallet"];
  const [textShowFooter, setTextShowFooter] = useState<any[]>([]);
  const [showTextPickup, setShowTextPickup] = useState<boolean>(true);
  const [showTextALL, setShowTextALL] = useState<boolean>(true);
  const [showTextDrop, setShowTextDrop] = useState<boolean>(true);
  const { t } = useTranslation("mission");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // Toggle: if the same is clicked again, uncheck it
    if (!e.currentTarget.checked) return;
    setOptionMissOrPall(optionMissOrPall === index ? null : index);
    setfooterData(index);
    optionIndex.current = index;
    if (index > 0) {
      setOptionsModePickup(index - 1);
      setOptionsModeDrop(index - 1);
      setOptionsModeALL(index - 1)
    }
  };
  const handleChangePickup = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.currentTarget.checked) return;
    setOptionsModePickup(optionsmodePickup === index ? null : index);
  }
  const handleChangeDrop = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.currentTarget.checked) return;
    setOptionsModeDrop(optionsmodeDrop === index ? null : index);
  }
  const handleChangeChartALL = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.currentTarget.checked) return;
    setOptionsModeALL(optionsmodeALL === index ? null : index);
  }
  const handleShowTextPickup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowTextPickup(e.currentTarget.checked);
  };
  const handleShowTextDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowTextDrop(e.currentTarget.checked);
  };
  const handleShowTextALL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowTextALL(e.currentTarget.checked);
  };
  const reloadDataByDate = async (data: { d?: Date, de?: Date, }) => {
    if (data.d) {
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
      saveDateEnd.current = _date;
      setEndDate(_date);

    }
    saveUrl.current = `/statistics/report?start_date=${saveDateStart.current}&end_date=${saveDateEnd.current}`;
    setLoadingWhenClick(true);

    statisticsSetPage(saveUrl.current);
  };
  const setfooterData = (index: number) => {
    var _textShowFooter: any[] = [];
    if (index === 0 || index === null) {
      _textShowFooter = [
        <p><span>{saveTotalMission.current!.mission}</span>  missions <span>{Number(saveTotalMission.current!.mission) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.complete}</span>  missions <span>{Number(saveTotalMission.current!.complete) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.cancel}</span>  missions <span>{Number(saveTotalMission.current!.cancel) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.other}</span>  missions <span>{Number(saveTotalMission.current!.other) * 8}</span> Pallet</p>
      ];
    } else if (index === 1) { // Mission
      _textShowFooter = [
        <p><span>{saveTotalMission.current!.mission}</span>  missions </p>,
        <p><span>{saveTotalMission.current!.complete}</span>  missions </p>,
        <p><span>{saveTotalMission.current!.cancel}</span>  missions </p>,
        <p><span>{saveTotalMission.current!.other}</span>  missions </p>
      ];
    } else if (index === 2) { // Pallet
      _textShowFooter = [
        <p><span>{Number(saveTotalMission.current!.mission) * 8}</span> Pallet</p>,
        <p><span>{Number(saveTotalMission.current!.complete) * 8}</span> Pallet</p>,
        <p><span>{Number(saveTotalMission.current!.cancel) * 8}</span> Pallet</p>,
        <p><span>{Number(saveTotalMission.current!.other) * 8}</span> Pallet</p>
      ];
    } else {
      _textShowFooter = [
        <p><span>{saveTotalMission.current!.mission}</span>  missions <span>{Number(saveTotalMission.current!.mission) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.complete}</span>  missions <span>{Number(saveTotalMission.current!.complete) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.cancel}</span>  missions <span>{Number(saveTotalMission.current!.cancel) * 8}</span> Pallet</p>,
        <p><span>{saveTotalMission.current!.other}</span>  missions <span>{Number(saveTotalMission.current!.other) * 8}</span> Pallet</p>
      ];
    }
    setTextShowFooter(_textShowFooter)
  }
  const statisticsSetPage = async (url: string) => {
    try {

      const res = await getData(url);
      if (onlineRef.current == false) {
        setOnlineBar(true);
        onlineRef.current = true;
      }
      const _drop: IStatisticsData = {};
      const _pickup: IStatisticsData = {};
      const _miss: IStatisticsData = {};
      const _missSeries: ISeries = [];
      const _dataSeries: ISeries = [];
      const _dataSeriesPick: ISeries = [];
      const _barNameDrop: string[] = [];
      const _barNamePick: string[] = [];
      for (var k in res) {
        if (k.includes('AGV')) {   // AGV
          for (var d in res[k]) {
            if (d.includes('D')) {  // D1,D2,D3,D4
              if (_barNameDrop.findIndex((item) => item === d) === -1) {
                _barNameDrop.push(d);
              }
            } else if (d.includes('P')) {  // P1,P2,P3,P4
              if (_barNamePick.findIndex((item) => item === d) === -1) {
                _barNamePick.push(d);
              }
            }
          }

        }
      }
      for (var k in res) {
        if (k.includes('AGV')) {   // AGV
          const _data: number[] = [];
          for (var dropName of _barNameDrop) {
            if (res[k][dropName]) {
              _data.push(res[k][dropName]);
            } else {
              _data.push(0);
            }
          }
          _dataSeries.push({ name: k, data: _data });
          const _dataPick: number[] = [];
          for (var pickName of _barNamePick) {
            if (res[k][pickName]) {
              _dataPick.push(res[k][pickName]);
            } else {
              _dataPick.push(0);
            }
          }
          _dataSeriesPick.push({ name: k, data: _dataPick });
          _missSeries.push({ name: k, data: [res[k]["total_mission_complete"], res[k]["total_mission_cancel"], res[k]["total_mission_other"]] });
        }
      }
      _drop["series"] = _dataSeries;
      _drop["barName"] = _barNameDrop;
      _pickup["series"] = _dataSeriesPick;
      _pickup["barName"] = _barNamePick;
      _miss["series"] = _missSeries;
      _miss["barName"] = ["Complete", "Cancel", "Other"];
      setDataMission(_miss);
      setDataDrop(_drop);
      setDataPickup(_pickup);
      setTotalMission({
        mission: res["ALL"]?.total_mission ?? 0,
        complete: res["ALL"]?.total_mission_complete ?? 0,
        cancel: res["ALL"]?.total_mission_cancel ?? 0,
        other: res["ALL"]?.total_mission_other ?? 0
      });
      saveTotalMission.current = {
        mission: res["ALL"]?.total_mission ?? 0,
        complete: res["ALL"]?.total_mission_complete ?? 0,
        cancel: res["ALL"]?.total_mission_cancel ?? 0,
        other: res["ALL"]?.total_mission_other ?? 0
      }
      setfooterData(optionIndex.current);
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
          saveUrl.current = `/statistics/report?start_date=${_date}&end_date=${_date}`;
          saveDateStart.current = _date;
          saveDateEnd.current = _date;
          statisticsSetPage(saveUrl.current);
          timerInterval.current = setInterval(() => {
            statisticsSetPage(saveUrl.current);
          }, 20000);
        }
      } catch (e: any) {
        console.error(e);
        setCheckNetwork(false);
      } finally {
        setLoadSuccess(true);
      }
    };
    checkNetwork();
    const defaultStatistics = parseInt(import.meta.env.VITE_REACT_APP_DEFAULT_STATISTICS);
    const showText = import.meta.env.VITE_REACT_APP_STATISTICS_SHOW_TEXT === "true";
    setOptionMissOrPall(defaultStatistics)
    setOptionsModePickup(defaultStatistics > 0 ? defaultStatistics - 1 : 0);
    setOptionsModeDrop(defaultStatistics > 0 ? defaultStatistics - 1 : 0);
    setOptionsModeALL(defaultStatistics > 0 ? defaultStatistics - 1 : 0);
    console.log(showText);
    setShowTextPickup(showText);
    setShowTextALL(showText);
    setShowTextDrop(showText);
    return () => {
      if (timerInterval.current != null) {
        clearInterval(timerInterval.current);
      }

    }
  }, []);
  return (
    <div className="statistics-box">
      {!loadSuccess && <div className='loading-background'>
        <div id="loading"></div>
      </div>}
      {loadingWhenClick && <div className="fixed-top w-100 h-100 d-flex justify-content-center align-items-center z-2" style={{ background: "rgb(5,5,5,0.2)" }}>
        <div id="loading"></div>
      </div>}
      {onlineBar !== null && <StatusOnline online={onlineBar}></StatusOnline>}
      {notauthenticated && <NotAuthenticated />}
      <div className='mb-2 mb-md-4 d-flex align-items-center justify-content-between flex-wrap'>
        <div>
          <h1>{t("st_title")}</h1>
          <p><FcComboChart size={32} />  <span className='ms-3 me-5'>{t("st_subtitle")}</span></p>
        </div>

        {checkNetwork && <div className='input-date-box m-0'>
          <div className="form-group">
            <label >{t("from")}</label>
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
          <button className="export-btn2" onClick={() => downloadCSV(startDate, endDate)}><IoMdDownload /> <span className='d-none d-sm-inline'>{t("downloadBtn")}</span> </button>
        </div>}
      </div>
      {!checkNetwork ? <NetworkError /> : <>
        <div className='option-miss-or-pall'>
          <h6 style={{ margin: "0"  }}>{t('display-information')}</h6>
          {options.map((label, index) => (
            <label key={index} style={{ marginRight: "10px" }}>
              <input
                type="checkbox"
                checked={optionMissOrPall === index}
                onChange={(e) => handleChange(e, index)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className='stat-card-box flex-wrap flex-md-nowrap'>
          <div className='stat-card'>
            <div className='d-flex align-items-center mt-3 ms-3'>
              <div className='stat-box-icon'>
                <AiFillSetting size={24} />
              </div>
              <p>{t("st_all")}</p>
            </div>
            <div className='stat-number'>{optionMissOrPall! < 2 ? totalMission!.mission : totalMission!.mission * 8}</div>
            <div className="label-footer">
              {textShowFooter[0] || ""}
            </div>
            <div className="bg-Circle-white" style={{ top: "100px", left: "-64px" }}></div>
            <div className="bg-Circle-white" style={{ top: "-50px", right: "-50px" }}></div>
          </div>
          <div className='stat-card'>
            <div className='d-flex align-items-center mt-3 ms-3'>
              <div className='stat-box-icon'>
                <IoCheckmarkCircle size={24} />
              </div>
              <p>{t("success")}</p>
            </div>
            <div className='stat-number'>{optionMissOrPall! < 2 ? totalMission!.complete : totalMission!.complete * 8}</div>
            <div className="label-footer" >
              {textShowFooter[1] || ""}
            </div>
            <div className="bg-Circle-white" style={{ top: "100px", left: "-64px" }}></div>
            <div className="bg-Circle-white" style={{ top: "-50px", right: "-50px" }}></div>
          </div>
          <div className='stat-card'>
            <div className='d-flex align-items-center mt-3 ms-3'>
              <div className='stat-box-icon' >
                <MdCancel   size={24} />
              </div>
              <p>{t("cancel")}</p>
            </div>
            <div className='stat-number'>{optionMissOrPall! < 2 ? totalMission!.cancel : totalMission!.cancel * 8}</div>
            <div className="label-footer" >
              {textShowFooter[2] || ""}
            </div>
            <div className="bg-Circle-white" style={{ top: "100px", left: "-64px" }}></div>
            <div className="bg-Circle-white" style={{ top: "-50px", right: "-50px" }}></div>
          </div>
          <div className='stat-card'>
            <div className='d-flex align-items-center mt-3 ms-3'>
              <div className='stat-box-icon' >
                <IoCheckmarkCircle   size={24} />
              </div>
              <p>{t("other")}</p>
            </div>
            <div className='stat-number'>{optionMissOrPall! < 2 ? totalMission!.other : totalMission!.other * 8}</div>
            <div className="label-footer" >
              {textShowFooter[3] || ""}
            </div>
            <div className="bg-Circle-white" style={{ top: "100px", left: "-64px" }}></div>
            <div className="bg-Circle-white" style={{ top: "-50px", right: "-50px" }}></div>
          </div>
        </div>

        <div className='stat-chart-pickup flex-lg-row flex-column-reverse'>
          <div className='col-12 col-lg-8'>
            <div className='pickup-chart'>
              <div className='option-miss-or-pall-in-graph'>
                <h5 className="me-2 me-xl-5">{t("st_title_pick")}</h5>
                {optionsPickup.map((label, index) => (
                  <label key={index} style={{ marginRight: "10px" }}>
                    <input
                      type="checkbox"
                      checked={optionsmodePickup === index}
                      onChange={(e) => handleChangePickup(e, index)}
                    />
                    {label}
                  </label>
                ))}
                <label style={{ marginLeft: "auto" }}>
                  <input
                    type="checkbox"
                    checked={showTextPickup}
                    onChange={handleShowTextPickup}
                  />
                  Text
                </label>
              </div>
              <p className='p-subtitle'>{t("st_subtitle_pick")}</p>
              <BGBarChart data={dataPickup} mode={optionsmodePickup == 1} showText={showTextPickup} /> {/* optionsmodePickup==1 means show Pallet */}
            </div>
          </div>
          <div className='col-12 col-lg-4'>
            <div className='chart-donus-box'>
              <div className='option-miss-or-pall-in-graph'>
                <h5 className="me-2 me-xl-5">{t("st_all")}</h5>
                {optionsPickup.map((label, index) => (
                  <label key={index} style={{ marginRight: "10px" }}>
                    <input
                      type="checkbox"
                      checked={optionsmodeALL === index}
                      onChange={(e) => handleChangeChartALL(e, index)}
                    />
                    {label}
                  </label>
                ))}
                <label className="chart-all-show-text">
                  <input
                    type="checkbox"
                    checked={showTextALL}
                    onChange={handleShowTextALL}
                  />
                  Text
                </label>
              </div>

              <p className='p-subtitle'>{t("st_subtitle_miss")}</p>
              <BGBarChart data={dataMission} mode={optionsmodeALL == 1} showText={showTextALL} />
            </div>
          </div>

        </div>
        <div className='stat-chart-drop'>
          <div className='option-miss-or-pall-in-graph'>
            <h5 className="me-2 me-xl-5">{t("st_title_drop")}</h5>
            {optionsPickup.map((label, index) => (
              <label key={index} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={optionsmodeDrop === index}
                  onChange={(e) => handleChangeDrop(e, index)}
                />
                {label}
              </label>
            ))}
            <label style={{ marginLeft: "auto" }}>
              <input
                type="checkbox"
                checked={showTextDrop}
                onChange={handleShowTextDrop}
              />
              Text
            </label>
          </div>
          <p className='p-subtitle'>{t("st_subtitle_drop")}</p>
          <BGBarChart data={dataDrop} mode={optionsmodeDrop === 1} showText={showTextDrop} />
        </div>

      </>}
    </div>
  );
}