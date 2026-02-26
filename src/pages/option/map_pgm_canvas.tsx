import { useEffect, useRef, useState } from "react";
import AGV3 from "../../assets/images/agv3.png";
// --- Types & Parsing Logic (Same as before) ---
interface PgmHeader {
    width: number;
    height: number;
    maxVal: number;
    dataOffset: number;
}

interface Pose {
    x: number;
    y: number;
    theta: number;
}

interface MapProps {
    robots: Map<string, Pose>;
}

export function parsePGM(buffer: ArrayBuffer): PgmHeader {
    const bytes = new Uint8Array(buffer);
    let idx = 0;

    const readToken = (): string => {
        while (idx < bytes.length && /\s/.test(String.fromCharCode(bytes[idx]))) idx++;
        if (bytes[idx] === 0x23) {
            while (idx < bytes.length && bytes[idx] !== 0x0a) idx++;
            return readToken();
        }
        let token = "";
        while (idx < bytes.length && !/\s/.test(String.fromCharCode(bytes[idx]))) {
            token += String.fromCharCode(bytes[idx++]);
        }
        return token;
    };

    const magic = readToken();
    if (magic !== "P5") throw new Error("Only P5 PGM supported");
    const width = parseInt(readToken(), 10);
    const height = parseInt(readToken(), 10);
    const maxVal = parseInt(readToken(), 10);
    if (idx < bytes.length && /\s/.test(String.fromCharCode(bytes[idx]))) idx++;
    return { width, height, maxVal, dataOffset: idx };
}

// --- Main Component ---
export default function MapPGMCanvas({ robots }: MapProps): React.ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapImageRef = useRef<ImageData | null>(null);
    const animationRef = useRef<number | null>(null);
    const currentPoseRef = useRef<Map<string, Pose>>(new Map());
    const targetPoseRef = useRef<Map<string, Pose>>(new Map());
    // Transform State: x/y (pan) and scale (zoom)
    const [transform, setTransform] = useState({ x: 0, y: 50, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const robotImgRef = useRef<HTMLImageElement | null>(null);
    const render = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const img = mapImageRef.current;
        // console.log("Rendering Frame - Robots:", robots);
        if (!img) return;
        // console.log("Map Image Ready - Rendering Map and Robots");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw map
        ctx.putImageData(img, 0, 0);

        // draw overlay

        robots.forEach((_, id) => {
            const current = currentPoseRef.current.get(id);
            // console.log("Current Pose:", currentPoseRef.current);
            const target = targetPoseRef.current.get(id);

            if (!current || !target) return;

            current.x += (target.x - current.x) * 0.05;
            current.y += (target.y - current.y) * 0.05;
            current.theta += (target.theta - current.theta) * 0.05;

            drawRobot(current, id);
        });

        // smooth factor (0.05 = smooth)
        drawAxis();
        // console.log("Rendering Frame");
        animationRef.current = requestAnimationFrame(render);
    };
    const mapMeta = useRef({
        width: 0,
        height: 0,
        resolution: import.meta.env.VITE_REACT_APP_RESOLUTION ? parseFloat(import.meta.env.VITE_REACT_APP_RESOLUTION) : 0.05,
        originX: import.meta.env.VITE_REACT_APP_ORIGIN ? parseFloat(import.meta.env.VITE_REACT_APP_ORIGIN.split(",")[0]) : -185,
        originY: import.meta.env.VITE_REACT_APP_ORIGIN ? parseFloat(import.meta.env.VITE_REACT_APP_ORIGIN.split(",")[1]) : -45
    });

    const drawRobot = (pose: { x: number; y: number; theta: number }, id: string) => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const img = robotImgRef.current;
        // console.log("Drawing Robot:", id, pose);
        if (!img) return;
        const { resolution, originX, originY, height } = mapMeta.current;

        // world → map pixel
        const px = (pose.x - originX) / resolution;
        const py = (pose.y - originY) / resolution;

        // flip Y (ROS → Canvas)
        const canvasY = height - py;
        ctx.save();
        ctx.translate(px, canvasY);
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText(id, -50, -50);
        ctx.restore();

        ctx.save();

        ctx.translate(px, canvasY);
        ctx.rotate(-pose.theta);
        // console.log(pose.theta)
        // robot body
         
        const sizeW = 50;
        const sizeH = 70;
        ctx.drawImage(
            img,
            -sizeW / 2,
            -sizeH / 2,
            sizeW,
            sizeH
        );
        ctx.restore();
        // console.log("drawRobot Frame");

    };
    const drawAxis = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const { resolution, originX, originY, height } = mapMeta.current;

        // world (0,0) → pixel
        const px = (0 - originX) / resolution;
        const py = (0 - originY) / resolution;
        const canvasY = height - py;

        const axisLength = 2; // meters
        const axisPixel = axisLength / resolution;

        ctx.save();
        ctx.lineWidth = 3;

        // ----- X Axis (Red) -----
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(px, canvasY);
        ctx.lineTo(px + axisPixel, canvasY);
        ctx.stroke();

        // arrow head
        ctx.beginPath();
        ctx.moveTo(px + axisPixel, canvasY);
        ctx.lineTo(px + axisPixel - 10, canvasY - 5);
        ctx.lineTo(px + axisPixel - 10, canvasY + 5);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();

        // ----- Y Axis (Green) -----
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo(px, canvasY);
        ctx.lineTo(px, canvasY - axisPixel); // minus because canvas Y inverted
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, canvasY - axisPixel);
        ctx.lineTo(px - 5, canvasY - axisPixel + 10);
        ctx.lineTo(px + 5, canvasY - axisPixel + 10);
        ctx.closePath();
        ctx.fillStyle = "green";
        ctx.fill();

        ctx.restore();

    };
    useEffect(() => {
        robots.forEach((pose, id) => {
            targetPoseRef.current.set(id, pose);

            if (!currentPoseRef.current.has(id)) {
                currentPoseRef.current.set(id, { ...pose });
            }
        });
        if (robots.size === 0|| animationRef.current) return;
        const imgAGV = new Image();
        imgAGV.src = AGV3;
        imgAGV.onload = () => {
            robotImgRef.current = imgAGV;
            animationRef.current = requestAnimationFrame(render);
        };
        // console.log("Robots Updated:", currentPoseRef.current, targetPoseRef.current);
    }, [robots]);

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
                mapMeta.current.width = header.width;
                mapMeta.current.height = header.height;

                const ctx = canvas.getContext("2d")!;
                const img = ctx.createImageData(header.width, header.height);

                for (let i = 0; i < pixels.length; i++) {
                    const v = pixels[i];
                    img.data[i * 4 + 0] = v;
                    img.data[i * 4 + 1] = v;
                    img.data[i * 4 + 2] = v;
                    img.data[i * 4 + 3] = 255;
                }
                mapImageRef.current = img;
                ctx.putImageData(img, 0, 0);

            } catch (e) {
                console.error(e);
            }
        };
        loadPGM();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // --- ZOOM HANDLER (Mouse Wheel) ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        // 1. Calculate new scale
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, transform.scale * (1 + scaleAmount)), 20);

        // 2. Calculate offset to zoom towards the mouse cursor
        // Get mouse position relative to the container
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Formula: Adjust (x,y) so the point under the mouse stays under the mouse
        const scaleRatio = newScale / transform.scale;
        const newX = mouseX - (mouseX - transform.x) * scaleRatio;
        const newY = mouseY - (mouseY - transform.y) * scaleRatio;

        setTransform({ x: newX, y: newY, scale: newScale });
    };

    // --- PAN HANDLERS (Drag) ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };

        setTransform(prev => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy
        }));
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div
            ref={containerRef}
            // Container with hidden overflow to act as the "Viewport"
            style={{
                width: '100%',
                maxWidth: '100vw',
                height: '100%', // Set a fixed height for the viewing area
                overflow: 'hidden',

                backgroundColor: '#ffffffff',
                cursor: isDragging ? 'grabbing' : 'grab',
                position: 'relative'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",       // Scale to fit container width
                    height: "auto",
                    transformOrigin: '0 0', // Crucial: Transform from top-left corner
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    imageRendering: "pixelated",
                    display: "block",
                }}
            />

            {/* Optional UI Controls */}
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '4px', fontSize: '12px' }}>
                Zoom: {(transform.scale * 100).toFixed(0)}%
                <br />
                <button className="btn btn-light" style={{ fontSize: '14px' }} onClick={() => setTransform({ x: 0, y: 50, scale: 1 })}>Reset</button>
            </div>
        </div>
    );
}