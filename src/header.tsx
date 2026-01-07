import DensoLogo from './assets/images/densoLogo.png';
import "./pages/css/header.css";
import { useEffect, useState, useRef, useCallback } from "react";
import TH_language_img from './assets/images/thailand.png';
import EN_language_img from './assets/images/united.png';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiXMark } from "react-icons/hi2";


export default function Headers({ drawerFunction }: { drawerFunction: (t: boolean) => void }) {
    const { i18n } = useTranslation();
    const user = (sessionStorage.getItem("user")?.split(",")[4] || "");
    const [lang, setLang] = useState<string>(localStorage.getItem('Language') ?? "en");
    const [open, setOpen] = useState<boolean>(false);
    const [iconNav, setIconNav] = useState<boolean>(true);
    const languageBlockRef = useRef<HTMLDivElement>(null)
    const [dateState, setDateState] = useState(new Date());

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setLang(lng);
    };
    const handleDrawer = () => {
        setIconNav(prev => !prev);
        drawerFunction(iconNav);
    }
    const handleResize = useCallback(() => {
        if (window.innerWidth >= 1530 && iconNav) {
            setIconNav(true);
            drawerFunction(false);
        }
    }, [iconNav]);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateState(new Date());
        }, 1000);
        const handleClickOutside = (e: any) => {
            if (!languageBlockRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(intervalId)
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <nav className="headder-nav-bar">
            <div className='d-flex align-items-center gap-3 ps-3'>
                <div className="iconNav" onClick={handleDrawer}>
                    {iconNav || true ? <HiOutlineBars3 color='red' size={32} ></HiOutlineBars3> :
                        <HiXMark color='red' size={32} ></HiXMark>}
                </div>

                <img src={DensoLogo} className='img-logo' alt='logo'></img>
            </div>

            <div className='nav-end'>
                <div ref={languageBlockRef} className='language-box me-1 me-md-2' onClick={() => setOpen(prev => !prev)}>
                    <button className='btn-language'>
                        {lang == 'th' ? <>
                            <img src={TH_language_img} alt='th' width={20} height={20}></img>
                            <h6 className='ms-2'>Thai</h6>
                        </> : <>
                            <img src={EN_language_img} alt='en' width={20} height={20}></img>
                            <h6 className='ms-2'>English</h6>
                        </>}
                    </button>
                    <div className={`select-language-box ${!open ? 'd-none' : ''}`}>
                        <button className='btn-language mb-2' onClick={() => changeLanguage('th')}>
                            <img src={TH_language_img} alt='th' width={20} height={20}></img>
                            <h6 className='ms-2'>Thai</h6>
                        </button>
                        <button className='btn-language' onClick={() => changeLanguage('en')}>
                            <img src={EN_language_img} alt='en' width={20} height={20}></img>
                            <h6 className='ms-2'>English</h6>
                        </button>
                    </div>
                </div>
                <div className='timer-clock'>
                    <div className="d-flex align-items-center icon-user" >
                        {user && <div className="rounded-circle d-flex align-items-center  justify-content-center me-2 " style={{ fontWeight: 'bold', width: "32px", height: "32px", background:"#dd0031" , color: 'white' }}>{user[0].toUpperCase()}</div>}
                        <span className='m-0 pe-1 pe-md-3'>{user} </span> <span className='d-none d-md-inline'>{dateState.toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

        </nav>


    )
}