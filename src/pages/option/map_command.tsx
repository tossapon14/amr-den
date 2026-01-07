import React, { use, useEffect, useRef, useState } from 'react';
import { parsePGM } from './map_pgm_canvas';
import './css_map_command.css';
import { FaCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { axiosPost } from '../../api/axiosFetch';
import ResponseAPI from './responseAPI';

export default function MapCommand({ funcClick, data }: { funcClick: () => void, data: { show: boolean, v_name: string, online: boolean } }): React.ReactElement {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [addStation, setAddStation] = useState<{ stationCode: string, zone: string }[]>([]);
    const useUrgentCheck = useRef<HTMLInputElement>(null);
    const controller = useRef<AbortController>(new AbortController());
    const [responseData, setResponseData] = useState<{ error: boolean | null, message?: string }>({ error: null });





    const clickStationBtn = (stationCode: string, zone: string) => {
        setAddStation(prev => [...prev, { stationCode, zone }]);
    }
    const deleteStationBtn = (indexToDelete: number) => {
        setAddStation(prev => prev.filter((_, index) => index !== indexToDelete));
    }
    const closeBtn = () => {
        funcClick();
        setAddStation([]);
        useUrgentCheck.current!.checked = false;
    }
    const createMission = async () => {
        const _data = {
            "mission_type": useUrgentCheck.current?.checked ? 1 : 0,
            "priority": 0,
            "requester": "admin",
            "stations": addStation.map(station => station.stationCode),
            "vehicle_name": data.v_name
        };
        try {
            await axiosPost("/mission/create", _data, controller.current.signal);
            setResponseData({ error: false, message: "send command success" })
        } catch (e: any) {
            console.error(e?.message);
            setResponseData({ error: true, message: e?.message })
        }
    };





    useEffect(() => {
        const loadPGM = async () => {
            try {
                const res = await fetch("/map/denso_99.pgm");
                const buffer = await res.arrayBuffer();
                const header = parsePGM(buffer);
                const pixels = new Uint8Array(buffer, header.dataOffset);

                const canvas = canvasRef.current!;
                canvas.width = header.width;
                canvas.height = header.height;

                const ctx = canvas.getContext("2d")!;
                const img = ctx.createImageData(header.width, header.height);

                for (let i = 0; i < pixels.length; i++) {
                    const v = pixels[i];
                    img.data[i * 4 + 0] = v;
                    img.data[i * 4 + 1] = v;
                    img.data[i * 4 + 2] = v;
                    img.data[i * 4 + 3] = 255;
                }
                ctx.putImageData(img, 0, 0);
            } catch (e) {
                console.error(e);
            }
        };
        loadPGM();
        return ()=>{
            controller.current.abort();
        }
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
                    <div className="map-canvas-container">
                        <canvas ref={canvasRef} className='map-canvas'></canvas>
                        <button className='station-btn' style={{ top: "10px", left: "10px" }} onClick={() => clickStationBtn("B1", "zone 1")}>B1</button>
                        <button className='station-btn' style={{ top: "100px", left: "300px" }} onClick={() => clickStationBtn("B2", "zone 2")}>B2</button>
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
                        <button className='btnGoHome'>Gohome</button>
                        <div className="station-line-process">
                            {addStation.map((station, index) => (
                                <div key={index} className="d-flex flex-row justify-content-between align-items-center add-animation">
                                    <div>
                                        <div className="station-name">{station.stationCode}</div>
                                        <div className="station-sub">{station.zone}</div>
                                        <p>───●───{index === 0 ? " Start" : " Goal"}</p>
                                    </div>
                                    <button className='circle-delete-btn' onClick={() => deleteStationBtn(index)}><MdDelete /></button>
                                </div>
                            ))}
                        </div>
                        <input ref={useUrgentCheck} type="checkbox" className='my-3' />
                        <span className='urgent-text'>Urgent Mission</span>
                        <button className='add-station-btn' onClick={createMission}>+ Add Mission</button>
                    </div>

                </div>
            </div>
        </div>

    );
}