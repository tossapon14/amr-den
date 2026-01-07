const pairMissionStatus = (state: number): { txt: string, color: string, bgcolor: string }=> {
    switch (state) {
        case 0: return { txt: "รออนุมัติ", color: "#444444", bgcolor: "#eeeeee" };
        case 1: return { txt: "อนุมัติ", color: '#3d85c6', bgcolor: "#ebf6ff" };
        case 2: return { txt: "เริ่มงาน", color: "#ffc000", bgcolor: "#fff9e6" };
        case 3: return { txt: "สำเร็จ", color: "#58dd1e", bgcolor: "#e7ffe0" };
        case 4: return { txt: "ปฏิเสธ", color: '#a64d79', bgcolor: "#ffeef8" };
        case 5: return { txt: "ยกเลิก", color: "#cc0000", bgcolor: "#ffeeee" };
        case 6: return { txt: "ไม่สำเร็จ", color: '#cc0000', bgcolor: "#ffeeee" };
        default: return { txt: "รออนุมัติ", color: "#444444", bgcolor: "#fff" };
    }
}
// const colorAgv: { [key: string]: string } = { "AGV1": "#001494", "AGV2": "#cc0000", "AGV3": "#006a33", "AGV4": "#d7be00", "AGV5": "#94008d", "AGV6": "#0097a8" };
const colorAgv: { [key: string]: string } = { 1: "#9400d7", 2: "#cc0000", 3: "#d7be00", 4: "#006a33", 5: "#001494", 6: "#0097a8" };

export {pairMissionStatus,colorAgv};
export default pairMissionStatus;