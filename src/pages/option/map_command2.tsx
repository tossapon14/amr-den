import React, { use, useEffect, useRef, useState } from 'react';
import './css_map_command.css';
import { FaCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { axiosPost, axiosGet } from '../../api/axiosFetch';
import ResponseAPI from './responseAPI';
import { TbCubePlus } from "react-icons/tb";
import { BiSolidLayerPlus } from "react-icons/bi";
import { TbHomeShare } from "react-icons/tb";

export default function MapCommand({ funcClick, data }: { funcClick: () => void, data: { show: boolean, v_name: string, online: boolean } }): React.ReactElement {

    const [addStation, setAddStation] = useState<{ stationCode: string, zone: string }[]>([]);
    const controller = useRef<AbortController>(new AbortController());
    const [responseData, setResponseData] = useState<{ error: boolean | null, message?: string }>({ error: null });
    const [nodes, setNodes] = useState<any[]>([]);
    const [isUrgent, setIsUrgent] = useState(false);
    const [priority, setPriority] = useState("1");

    const clickStationBtn = (stationCode: string, zone: string) => {
        setAddStation(prev => [...prev, { stationCode, zone }]);
    }
    const deleteStationBtn = (indexToDelete: number) => {
        setAddStation(prev => prev.filter((_, index) => index !== indexToDelete));
    }
    const closeBtn = () => {
        funcClick();
        setAddStation([]);
        setIsUrgent(false);
        setPriority("1");
    }
    const createMission = async () => {
        var _data = {};
        if (sessionStorage.getItem("user")) {
            const [employee_no, name, role, status, username] = sessionStorage.getItem("user")!.split(",");
            _data = {
                "mission_type": isUrgent ? 1 : 0,
                "priority": priority,
                "requester": role,
                "stations": addStation.map(station => station.stationCode),
                "vehicle_name": data.v_name
            };
        }
        try {
            await axiosPost("/mission/create", _data, controller.current.signal);
            setResponseData({ error: false, message: "send command success" })
        } catch (e: any) {
            console.error(e?.message);
            setResponseData({ error: true, message: e?.message })
        }
    };





    useEffect(() => {
        const loadNodes = async () => {
            try {
                const res = await axiosGet("/node/nodes");
                const _nodes = res.payload.filter((node: any) => node.node_type === "station").map((node: any) => {
                    return node.name;

                });
                setNodes(_nodes);
            } catch (e) {
                console.error(e);
            }
        };

        loadNodes();

    }, []);


    return (
        <div>
            <ResponseAPI response={responseData} />
            <div className={`dialog-command ${data.show ? '' : 'd-none'}`}
                onClick={() => closeBtn()}   // คลิกพื้นหลัง → ปิด
            >
                <div
                    className="map-command-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="station-container">
                        <div className="d-flex flex-row justify-content-start align-items-center">
                            <TbCubePlus size={32} />
                            <h5 className="pt-3 ms-2">Stations</h5>
                        </div>
                        <div className="station-list">
                            {nodes.map((station, index) => (

                                <button key={index} className='station-btn-flex' onClick={() => clickStationBtn(station, "zone")}>
                                    <BiSolidLayerPlus size={32} />
                                    <p className='ps-2'>{station}</p></button>
                            ))}
                        </div>
                        <div className="d-flex flex-row justify-content-start align-items-center">
                            <TbHomeShare size={32} />
                            <h5 className="pt-3 ms-2">Home station</h5>
                        </div>
                        <div className="station-list">
                            <button className='station-btn-flex' onClick={() => clickStationBtn("HOME", "zone")}>
                                <BiSolidLayerPlus size={32} />
                                <p className='ps-2'>HOME</p></button>
                        </div>
                    </div>
                    <div className="robot-container">
                        <div className="header-robot-command">
                            <div className="flight-info">
                                <div className="robot-name">{data.v_name}</div>
                                {data.online && <div className="airline">
                                    <FaCircle color='#01ed01ff' style={{ marginTop: '2px' }} />
                                    <p> Online </p>
                                </div>}
                            </div>
                            <button className="close-btn" onClick={() => closeBtn()}>×</button>
                        </div>
                        <div className="station-line-process">
                            {addStation.map((station, index) => (
                                <div key={index} className="d-flex flex-row justify-content-between align-items-center add-animation" style={{ background: `${index === 0 ? "#ffffff3b" : ""}`, padding: `${index === 0 ? "12px 12px 12px 12px" : ""}` }}>
                                    <div>
                                        <div className="station-name">{station.stationCode}</div>
                                        <div className="station-sub">{station.zone}</div>
                                        <p>───●───{index === 0 ? " Start" : " Goal"}</p>
                                    </div>
                                    <button className='circle-delete-btn' onClick={() => deleteStationBtn(index)}><MdDelete /></button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="checkbox"
                            className="my-3"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                        />
                        <span className="urgent-text">Urgent Mission</span>
                        {isUrgent && <select
                            className="urgent-select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>}
                        <button className='add-station-btn' onClick={createMission}>+ Add Mission</button>
                    </div>

                </div>
            </div>
        </div>

    );
}