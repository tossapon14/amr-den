
import './css/mission.css'
import { IoMdSettings, IoMdClose, IoMdDownload } from "react-icons/io";
import { FaMapMarkerAlt } from "react-icons/fa";
import MissionImage from '../assets/images/mission.png';
import { useEffect, useState, useRef } from 'react';
import { axiosGet, axiosPut } from "../api/axiosFetch";
import { pairMissionStatus, colorAgv } from '../utils/centerFunction';
import NetworkError from './networkError';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ResponseAPI from './option/responseAPI';
import { TbCancel } from "react-icons/tb";

import { useTranslation } from 'react-i18next';
import NotAuthenticated from './option/notAuthenticated';
import StatusOnline from './option/statusOnline';

interface IMissionTables {
    id: number
    requester: string
    mission_type: number
    priority: number
    stations: string[]
    nodes: string[][]
    passed_nodes: string[]
    remaining_nodes: string[][]
    stations_idx: number[]
    current_node_idx: number
    status: number
    transport_state: number
    vehicle_name: string
    timestamp: string
    dispatch_time: any
    arriving_time: any
    duration: any
    str_status: { txt: string, color: string, bgcolor: string }
    drop: string
    pick: string
    tpick: string
    tstart: string
    tend: string
}
const downloadCSV = async (vehicle: string, status: string, start_date: string, end_date: string) => {
    const fetchData: string = await axiosGet(
        `/mission/export_mission_report?vehicle_name=${vehicle}&status=${status}&start_date=${start_date}&end_date=${end_date}`)
    const blob = new Blob([fetchData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `mission_vehicle_${vehicle}_status_${status}_date_${start_date}_${end_date}.csv`;
    link.click();

    URL.revokeObjectURL(url);
};
const getMissions = async (url: string): Promise<any> => {

    const res: any = await axiosGet(url);
    return res;
};

const isoDurationToMinSec = (duration: string | undefined | null): string => {
    if (!duration) return "";
    else {
        const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        const matches = duration!.match(regex);
        if (matches === null) return "00:00:00"
        else {
            const hours = parseInt(matches[1] ?? "0");
            const minutes = parseInt(matches[2] ?? '00');
            const seconds = parseInt(matches[3] ?? '00');

            // Format to m:ss (add leading zero to seconds if needed)
            const formatted = `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
            return formatted;
        }
    }

};

export default function Mission() {

    const [missionTable, setMissionTable] = useState<IMissionTables[]>([]);
    const [vehicle, setVehicle] = useState<string>(""); // Default to "desc"
    const [status, setStatus] = useState<string>("ALL"); // Default to "asc"
    const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10))
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10))
    const [pageSize, setPageSize] = useState('10');

    const [pagination, setPagination] = useState<React.ReactElement | null>(null);
    const [loadSuccess, setLoadSuccess] = useState(false);
    const [btnAGV, setBtnAGVName] = useState<string[]>([]);
    // const btnAGVSet = useRef(false);

    const [checkNetwork, setCheckNetwork] = useState(true);
    const [responseData, setResponseData] = useState<{ error: boolean | null, message?: string }>({ error: null });
    const cancelModalRef = useRef<HTMLDivElement>(null);
    const [dialogCancel, setDialogCancel] = useState<{ show: boolean, name?: string, id?: number }>({ show: false });
    const saveUrl = useRef<string>("");
    const savePage = useRef<number>(1);
    const savePageSize = useRef<string>('10');
    const saveDateStart = useRef<string>("");
    const saveDateEnd = useRef<string>("");
    const saveVehicle = useRef<string>("");
    const saveStatus = useRef<string>("ALL")
    const [notauthenticated, setNotAuthenticated] = useState(false);
    const timerInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [onlineBar, setOnlineBar] = useState<null | boolean>(null);
    const onlineRef = useRef<boolean | null>(null);
    const timerCloseCancel = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { t } = useTranslation("mission");
    const [loadingWhenClick, setLoadingWhenClick] = useState<boolean>(false);
    const closeDialogCancelMission = () => {
        setDialogCancel({ show: false });
        clearTimeout(timerCloseCancel.current!);
    };
    const btnCancelMission = async (id: number | undefined, name: string | undefined) => {
        if (!id || !name) return;
        closeDialogCancelMission();
        setResponseData({ error: null, message: "loading" });
        try {
            await axiosPut(`/mission/update/status?mission_id=${id}&vehicle_name=${name}&command=cancel`);
            setResponseData({ error: false, message: "Cancel success" })
            missionSetPage(saveUrl.current);
        } catch (e: any) {
            console.error(e);
            setResponseData({ error: true, message: e?.message })
        }

    };

    const showDialogCancel = (data: { show: boolean, name?: string, id?: number }) => {
        setDialogCancel(data);
        timerCloseCancel.current = setTimeout(() => {
            setDialogCancel({ show: false });
        }, 10000);
    };

    const reloadMission = async (data: { v?: string, s?: string, d?: Date | undefined, de?: Date | undefined, p?: number, ps?: string }) => {
        if (data.v) {
            savePage.current = 1;
            saveVehicle.current = data.v;
            setVehicle(data.v);
        }
        else if (data.s) {
            savePage.current = 1;
            saveStatus.current = data.s;
            setStatus(data.s);
        }
        else if (data.d) {

            if (data.d > new Date(saveDateEnd.current)) {
                return;
            }
            const bangkokOffsetMs = 7 * 60 * 60 * 1000;
            const localTime = data.d!.getTime() + bangkokOffsetMs;
            const _date: string = new Date(localTime).toISOString().substring(0, 10);
            saveDateStart.current = _date;
            savePage.current = 1;
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
            savePage.current = 1;
            setEndDate(_date);

        }
        else if (data.p) {
            savePage.current = data.p;
        } else if (data.ps) {
            savePageSize.current = data.ps;
            savePage.current = 1;
            setPageSize(data.ps);
        }
        saveUrl.current = `/mission/missions?vehicle_name=${saveVehicle.current}&status=${saveStatus.current}&start_date=${saveDateStart.current}&end_date=${saveDateEnd.current}&page=${savePage.current}&page_size=${savePageSize.current}`;
        setLoadingWhenClick(true);
        missionSetPage(saveUrl.current);
    };


    const missionSetPage = async (url: string) => {
        try {

            const res = await getMissions(url);
            if (onlineRef.current == false) {
                setOnlineBar(true);
                onlineRef.current = true;
            }
            const _mission: IMissionTables[] = []
            res.payload.forEach((ele: IMissionTables) => {
                _mission.push({
                    ...ele, str_status: pairMissionStatus(ele.status),
                    pick: ele.stations[0],
                    drop: ele.nodes.length > 1 ? ele.stations.slice(1).join("->") : ele.stations[1],
                    timestamp: ele.timestamp?.substring(0, 10),
                    tpick: ele.timestamp?.substring(11, 19),
                    tstart: ele.dispatch_time?.substring(11, 19),
                    tend: ele.arriving_time?.substring(11, 19),
                    duration: isoDurationToMinSec(ele.duration),
                })
            });

            setPagination(_pagination(res.structure?.total_pages, savePage.current));
            setMissionTable(_mission);

        } catch (e: any) {
            console.error(e);
            if (e.message === "Network Error") {
                setOnlineBar(false);
                onlineRef.current = false;
            }
            else if (e.status === 404) {
                setMissionTable([]);
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

    const _pagination = (ttp: number, page: number): React.ReactElement | null => {

        if (ttp <= 5) {
            return (<div className='pagination'>

                {[...Array(ttp)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                        <a
                            key={pageNumber}
                            onClick={() => reloadMission({ p: pageNumber })}
                            className={pageNumber === page ? "active" : ""}
                        >
                            {pageNumber}
                        </a>
                    );
                })}

            </div>);
        }
        else if (ttp > 5) {
            let intial: number;
            if (ttp - page < 5) {// last page
                intial = ttp - 4
            } else if (page > 2) {
                intial = page - 2
            } else if (page > 1) {
                intial = page - 1
            } else {
                intial = page
            }
            return (<div className="pagination">

                <a
                    onClick={() => reloadMission({ p: page > 1 ? page - 1 : 1 })}
                    className={page === 1 ? "disabled" : ""}
                >
                    &laquo;
                </a>

                {/* Page Numbers */}
                {

                    [...Array(5)].map((_, index) => {
                        const pageNumber = intial + index;
                        return (
                            <a
                                key={pageNumber}
                                onClick={() => reloadMission({ p: pageNumber })}
                                className={pageNumber === page ? "active" : ""}
                            >
                                {pageNumber}
                            </a>
                        );
                    })}

                {/* Next Button */}
                <a
                    onClick={() => reloadMission({ p: page + 1 })}
                    className={page === ttp ? "disabled" : ""}
                >
                    &raquo;
                </a>
            </div>);
        }
        else return null
    };

    useEffect(() => {
        const checkNetwork = async () => {
            try {
                const response = await fetch(import.meta.env.VITE_REACT_APP_API_URL, { method: "GET" });
                if (response.ok) {
                    const _vehicle = sessionStorage.getItem('user')?.split(",")[2] == "admin" ? 'ALL' : sessionStorage.getItem('user')?.split(",")[2] ?? "";
                    console.log(JSON.parse(sessionStorage.getItem("vehicle")!))
                    setBtnAGVName(JSON.parse(sessionStorage.getItem("vehicle") ?? '[]') as string[]);
                    setVehicle(_vehicle);
                    const _date = new Date().toISOString().substring(0, 10)
                    saveUrl.current = `/mission/missions?vehicle_name=${_vehicle}&status=ALL&start_date=${_date}&end_date=${_date}&page=1&page_size=10`
                    saveDateStart.current = _date;
                    saveDateEnd.current = _date;
                    saveVehicle.current = _vehicle;
                    missionSetPage(saveUrl.current);
                    timerInterval.current = setInterval(() => {
                        missionSetPage(saveUrl.current);
                    }, 20000);
                }
            } catch (e: any) {
                console.error(e);
                setCheckNetwork(false);
            } finally {
                setLoadSuccess(true);
            }
        };
        const handleClickOutsideCancel = (event: any) => {
            if (cancelModalRef.current === event.target) {
                closeDialogCancelMission();
            }
        };
        if (cancelModalRef.current) {
            cancelModalRef.current.addEventListener("mouseup", handleClickOutsideCancel)
        }

        checkNetwork();

        return () => {
            cancelModalRef.current?.removeEventListener("mouseup", handleClickOutsideCancel);
            if (timerInterval.current != null) {
                clearInterval(timerInterval.current);
            }
            if (timerCloseCancel.current) {
                clearTimeout(timerCloseCancel.current);
            }

        }
    }, []);
    return <section className='mission-box-page'>
        {!loadSuccess && <div className='loading-background'>
            <div id="loading"></div>
        </div>}
        {loadingWhenClick && <div className="fixed-top w-100 h-100 d-flex justify-content-center align-items-center z-2" style={{ background: "rgb(5,5,5,0.2)" }}>
            <div id="loading"></div>
        </div>}
        {onlineBar !== null && <StatusOnline online={onlineBar}></StatusOnline>}
        {notauthenticated && <NotAuthenticated />}
        <div className='mission-title-box'>
            <h1>{t("m_title")}</h1>
            <div className='box-title'>
                <p className="title1">
                    <img src={MissionImage} alt="Logo with a yellow circle and blue border" className="me-3" width="32" height="32" />
                    <span>{t("m_subtitle")}</span></p>
                <div className="selected-agv-box">
                    {btnAGV.map((name) => <button key={name} onClick={() => reloadMission({ v: name })} className={`${vehicle === name ? "active" : ""}`}>{name}</button>)}
                </div>
            </div>

        </div>
        {!checkNetwork ? <NetworkError /> : <div className='container-card'>
            <div className='mission-header'>
                <div className='selected-mission-btn'>
                    <button onClick={() => reloadMission({ s: "ALL" })} className={`${status === "ALL" ? "active" : ""}`}>{t("all")}</button>
                    <button onClick={() => reloadMission({ s: "2" })} className={`${status === "2" ? "active" : ""}`}>{t("run")}</button>
                    <button onClick={() => reloadMission({ s: "3" })} className={`${status === "3" ? "active" : ""}`}>{t("success")}</button>
                    <button onClick={() => reloadMission({ s: "6" })} className={`${status === "6" ? "active" : ""}`}>{t("fail")}</button>
                    <button onClick={() => reloadMission({ s: "5" })} className={`${status === "5" ? "active" : ""}`}>{t("cancel")}</button>
                    <button onClick={() => reloadMission({ s: "0" })} className={`${status === "0" ? "active" : ""}`}>{t("panding")}</button>
                </div>
                <div className='input-date-box'>
                    <div className="form-group">
                        <label >{t("from")}</label>
                        <div className='box-of-text-date'>
                            <div className='ps-2'>{startDate}</div>
                            <DatePicker selected={new Date(startDate)} onChange={(e) => reloadMission({ d: e ?? undefined })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label >{t("to")}</label>
                        <div className='box-of-text-date'>
                            <div className='ps-2'>{endDate}</div>
                            <DatePicker selected={new Date(endDate)} onChange={(e) => reloadMission({ de: e ?? undefined })} />
                        </div>
                    </div>
                    <button className="export-btn2" onClick={() => downloadCSV(vehicle, status, startDate, endDate)}><IoMdDownload /> <span className='d-none d-sm-inline'>{t("downloadBtn")}</span></button>
                </div>
            </div>
            <div className='table-container overflow-auto'>
                <table className="table table-hover" style={{ minWidth: "1150px" }}>
                    <thead className='text-center'>
                        <tr>
                            <th scope="col">{t("tb_jobid")}</th>
                            <th scope="col" >{t("tb_car")}</th>
                            <th scope="col">{t("tb_req")}</th>
                            <th scope="col"><div className='head-table-flex'>
                                <div className='pick-circle-icon'>
                                </div>{t("tb_pickup")}
                            </div>
                            </th>
                            <th scope="col">
                                <div className="head-table-flex">
                                    <div className='mission-circle-icon color-blue'>
                                        <FaMapMarkerAlt color='#003092' />
                                    </div>
                                    {t("tb_drop")}</div>
                            </th>
                            <th scope="col"><div className="head-table-flex">
                                <div className='mission-circle-icon'>
                                    <IoMdSettings color='#E9762B' />
                                </div>
                                {t("tb_status")}</div>
                            </th>

                            <th scope="col">{t("tb_date")}</th>
                            <th scope="col">{t("tb_reserve")}</th>
                            <th scope="col">{t("tb_start")}</th>
                            <th scope="col">{t("tb_finish")}</th>
                            <th scope="col">{t("tb_duration")}</th>
                            <th scope="col" style={{ width: "120px" }}>{t("tb_cancel")}</th>
                        </tr>
                    </thead>
                    <tbody className='text-center'>
                        {missionTable.map((miss, i) => <tr key={i}>
                            <td scope="row">#{miss.id}</td>
                            <td><div className='td-vehicle-name'><div className='circle-vehicle-icon' style={{ background: `${colorAgv[btnAGV.indexOf(miss.vehicle_name)]}` }}></div><span>{miss.vehicle_name}</span></div></td>
                            <td>{miss.requester}</td>
                            <td>{miss.pick}</td>
                            <td>{miss.drop}</td>
                            <td><div className='box-status' style={{ background: miss.str_status.bgcolor, color: miss.str_status.color }}>{t(`m_status_${miss.status}`)}</div></td>
                            <td>{miss.timestamp}</td>
                            <td>{miss.tpick}</td>
                            <td>{miss.tstart}</td>
                            <td>{miss.tend}</td>
                            <td>{miss.duration}</td>

                            <td>{miss.status == 0 && <button className='btn-cancel' onClick={() => showDialogCancel({ show: true, id: miss.id, name: miss.vehicle_name })}>cancel</button>}</td>
                        </tr>)}

                    </tbody>
                </table>


            </div>
            <div className='page-number-d-flex'>

                <div className="tooltip-container">
                    <button type="button" >{pageSize}</button>
                    <div className="box-tooltip">

                        <button className='btn-page-size' onClick={() => reloadMission({ ps: '10' })}>10</button>
                        <button className='btn-page-size' onClick={() => reloadMission({ ps: '50' })}>50</button>
                        <button className='btn-page-size' onClick={() => reloadMission({ ps: '100' })}>100</button>
                    </div>

                </div>
                <span className='ms-1 me-3'>{t("miss/page")}</span>
                {pagination}
            </div>
            <ResponseAPI response={responseData} />

        </div>}
        <div ref={cancelModalRef} className={`modal-cancel-mission ${!dialogCancel.show && 'd-none'}`}>
            <div className='card-summaryCommand'>
                <div className='card-summaryCommand-header'>
                    <div className="icon-name-agv">
                        <div className='bg-img' style={{ background: 'rgb(255, 244, 244)' }}>
                            <TbCancel size={32} color={'rgb(254, 0, 0)'} />
                        </div>
                        <h5>{t("md_cancel")} {dialogCancel.name}</h5>
                    </div>
                    <button className='btn-close-summary' onClick={closeDialogCancelMission}><IoMdClose size={16} /></button>
                </div>
                <div className='summary-command-pickup'>
                    <div className='h1 px-1' style={{ borderBottom: '4px solid red' }}>{dialogCancel.id}</div>
                </div>
                <p>job id</p>
                <p style={{ color: '#ccc' }}>{t("md_confirm_cancel")}</p>
                <button className='btn w-100 mt-3 py-3 btn-danger' onClick={() => btnCancelMission(dialogCancel.id!, dialogCancel.name!)}>{t("tb_cancel")}</button>
            </div>
        </div>
    </section>;
}
