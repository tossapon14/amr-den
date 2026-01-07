import "./App.css";
import Header from "./header";
import Home from "./pages/home";
import Vehicle from "./pages/vehicle";
import Login from "./pages/login";
import NotFound from "./pages/option/NotFound";
import Mission from "./pages/mission";
import Alarm from "./pages/alarm";
import { BiHomeAlt, BiError, BiFile } from "react-icons/bi";
import { PiBatteryCharging, PiFireTruckLight } from "react-icons/pi";
import { BsBarChartLine } from "react-icons/bs";

import { IoIosLogIn } from "react-icons/io";
import { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, } from "react-router-dom";
import Statistics from "./pages/statistics";

import Battery from "./pages/battery";
import User from "./pages/user";
import CreateUser from "./pages/createUser";
import ChangePassword from "./pages/changePassword";
import EditUser from "./pages/editUser";
import { useTranslation } from 'react-i18next';

// Helper function to protect routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return sessionStorage.getItem("token") ? children : <Navigate to="/login" replace />;
};

function App() {
  const [linkFocused, setLinkFocused] = useState<string[]>(Array(7).fill(""));
  const [iconNavOpen, setIconNavOpen] = useState<boolean>(false);
  const isAdmin = useRef<boolean>(false);
  const { t } = useTranslation("drawer");

  const drawerFunction = (t:boolean) => {
    setIconNavOpen(t);
  };
  useEffect(() => {
    const path = window.location.pathname;
    var index = 6; // Default to "login"
    isAdmin.current = sessionStorage.getItem("user")?.split(",")[2] === "admin";
    switch (path) {
      case "/home":
        index = 0;
        break;
      case "/mission":
        index = 1;
        break;
      case "/vehicle":
        index = 2;
        break;
      case "/statistics":
        index = 3;
        break;
      case "/battery":
        index = 4;
        break;
      case "/alarms":
        index = 5;
        break;
      case "/login":
        index = 6;
        break;
      default:
        index = 6; // Redirect unknown paths to login
        break;
    }
    const _linkFocused = Array(7).fill("");
    _linkFocused[index] = "link-focused";
    setLinkFocused(_linkFocused);
  }, []);

  return (
    <Router>
      <div className="container-fluid px-0">
        <Header drawerFunction={drawerFunction} />
        <section className="content">
          <div className='drawer'>
            <ul>
              <li>
                <a href="/home" className={linkFocused[0]}>
                  <BiHomeAlt size="28" />
                  {t("home")}
                </a>
              </li>
              <li>
                <a href="/mission" className={linkFocused[1]}>
                  <BiFile size="28" />
                  {t("mission")}
                </a>
              </li>
              <li>
                <a href="/vehicle" className={linkFocused[2]}>
                  <PiFireTruckLight size="28" />
                  {t("vehicle")}
                </a>
              </li>
              {isAdmin.current && <>
                <li>
                  <a href="/statistics" className={linkFocused[3]}>
                    <BsBarChartLine size="28" />
                    {t("statistics")}
                  </a>
                </li>
                <li>
                  <a href="/battery" className={linkFocused[4]}>
                    <PiBatteryCharging size="28" />
                    {t("battery")}
                  </a>
                </li> </>}
                <li>
                  <a href="/alarms" className={linkFocused[5]}>
                    <BiError size="28" />
                    {t("alarm")}
                  </a>
                </li>
             
              <li>
                <a href="/login" className={linkFocused[6]}>
                  <IoIosLogIn size="28" />
                  {t("login")}
                </a>
              </li>
            </ul>
          </div>
          <nav  className="drawer-mobile" style={{height:`${iconNavOpen ?"100%" : "0px"}`}}>
            <ul>
              <li>
                <a href="/home" className={linkFocused[0]}>
                  <BiHomeAlt size="28" />
                  {t("home")}
                </a>
              </li>
              <li>
                <a href="/mission" className={linkFocused[1]}>
                  <BiFile size="28" />
                  {t("mission")}
                </a>
              </li>
              <li>
                <a href="/vehicle" className={linkFocused[2]}>
                  <PiFireTruckLight size="28" />
                  {t("vehicle")}
                </a>
              </li>
              {isAdmin.current && <>
                <li>
                  <a href="/statistics" className={linkFocused[3]}>
                    <BsBarChartLine size="28" />
                    {t("statistics")}
                  </a>
                </li>
                <li>
                  <a href="/battery" className={linkFocused[4]}>
                    <PiBatteryCharging size="28" />
                    {t("battery")}
                  </a>
                </li></>}
                <li>
                  <a href="/alarms" className={linkFocused[5]}>
                    <BiError size="28" />
                    {t("alarm")}
                  </a>
                </li>
              <li>
                <a href="/login" className={linkFocused[6]}>
                  <IoIosLogIn size="28" />
                  {t("login")}
                </a>
              </li>
            </ul>
          </nav>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/mission" element={<PrivateRoute><Mission /></PrivateRoute>} />
            <Route path="/vehicle" element={<PrivateRoute><Vehicle /></PrivateRoute>} />
            <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
            <Route path="/battery" element={<PrivateRoute><Battery /></PrivateRoute>} />
            <Route path="/alarms" element={<PrivateRoute><Alarm /></PrivateRoute>} />
            <Route path="/signup-admin" element={<PrivateRoute><User /></PrivateRoute>} />
            <Route path="/create-User" element={<PrivateRoute><CreateUser /></PrivateRoute>} />
            <Route path="/edit-user" element={<PrivateRoute><EditUser /></PrivateRoute>} />
            <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </section>
      </div>
    </Router>
  );
}

export default App;
