import { useEffect, useRef, useState } from "react";

// --- Types & Parsing Logic (Same as before) ---
interface PgmHeader {
    width: number;
    height: number;
    maxVal: number;
    dataOffset: number;
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
export default function MapPGMCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Transform State: x/y (pan) and scale (zoom)
    const [transform, setTransform] = useState({ x: 0, y: 50, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMouse = useRef({ x: 0, y: 0 });

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
                <button className="btn btn-light" style={{fontSize:'14px'}} onClick={() => setTransform({ x: 0, y: 50, scale: 1 })}>Reset</button>
            </div>
        </div>
    );
}