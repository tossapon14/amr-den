import { BsPersonFill } from "react-icons/bs";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
// import { RiLockPasswordFill } from "react-icons/ri";
import './css/login.css';
import { IoInformationCircleOutline } from "react-icons/io5";

import { useState, useEffect, type FormEvent } from "react";
import { axiosLogin, axiosPost, axiosGet } from "../api/axiosFetch";
import { useTranslation } from 'react-i18next';

interface ILogin {
  access_token: string
  message: string
  token_type: string
  user: IUser
  status?: number
  response?: any
}

interface IUser {
  employee_no: string
  name: string
  role: string
  status: boolean
  username: string
}

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [responses, setResponse] = useState<string>("")
  const [load, setLoad] = useState(false);
  const { t } = useTranslation("login");




  const postLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoad(true)
      const params = new URLSearchParams();
      params.append('username', name);
      params.append('password', password);
      const response: ILogin = await axiosLogin("/authentication/login", params);
      if (response.token_type) {
        sessionStorage.setItem("token", `${response.token_type} ${response.access_token}`);
        sessionStorage.setItem("user", `${response.user.employee_no},${response.user.name},${response.user.role},${response.user.status},${response.user.username}`);
        // console.log("Login Response:", response);
        window.location.reload();
      }
      else if (response.message) {
        setResponse(response.message)
      }
    } catch (error: any) {
      if (error.status == 401) {
        setResponse('username or password incorrect')
        return;
      }
      console.error(error);
      setResponse(error.message)
    } finally {
      setLoad(false);
    }
  };
  const onLogout = async () => {
    try {

      const body = { username: user?.username }
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("vehicle");
      sessionStorage.removeItem("token");
      setLoad(true);
      await axiosPost("/authentication/logout", body);


    } catch (e: any) {
      console.error(e);
    } finally {
      setLoad(false);
      window.location.reload();
    }

  };
  const getAGVButton = async function (role: string) {
    if (role === 'admin') {
      const res: any = await axiosGet(
        `/vehicle/vehicles?vehicle_name=ALL&state=ALL`,
      );
      if (res.payload) {
        const vehicleList = res.payload.map((item: any) => item.name);
        vehicleList.unshift("ALL");
        sessionStorage.setItem("vehicle", JSON.stringify(vehicleList));
      }
    } else {
      sessionStorage.setItem("vehicle", JSON.stringify([role]));
    }
  }
  useEffect(() => {
    if (sessionStorage.getItem("user")) {
      const [employee_no, name, role, status, username] = sessionStorage.getItem("user")!.split(",");
      const user: IUser = {
        employee_no: employee_no,
        name: name,
        role: role,
        status: status === "true" ? true : false,
        username: username
      };
      setUser(user);
       if (!sessionStorage.getItem("vehicle")) {
        getAGVButton(user.role);
      }
      
    }
  }, []);


  return (
    <section id="login-wrapper">
      {load  && <div className='loading-background'>
        <div id="loading"></div>
      </div>}
      <section id='login'>

        <div className="about-version"><IoInformationCircleOutline size={24} /><span> {import.meta.env.VITE_REACT_APP_LICENSE_KEY} {import.meta.env.VITE_REACT_APP_VERSION}</span>
        </div>
        {user ? <div className='profile'>
          <h1>{t("imfor")}</h1>
          <div className="subprofile-box">
            <div className='d-flex justify-content-between'>
              <div className='mb-4'>{t("name")}</div><h3 className='ms-4 d-inline'>{user.name}</h3>
            </div>
            <div className='d-flex justify-content-between'>
              <div className='mb-4'>{t("username")}</div><h3 className='ms-4 d-inline'>{user.username}</h3>
            </div>
            <div className='d-flex justify-content-between'>
              <div className='mb-4'>{t("employee_no")}</div><h3 className='ms-4 d-inline'>{user.employee_no}</h3>
            </div>
            <div className='d-flex justify-content-between'>
              <div className='mb-4'>{t("role")}</div><h3 className='ms-4 d-inline'>{user.role}</h3>
            </div>
            <div className='d-flex justify-content-between'>
              <div className='mb-4'>{t("status")}</div><h3 className='ms-4 d-inline fw-bold' style={{ color: 'rgb(82, 255, 8)' }}>{user.status ? t("online") : ("offline")}</h3>
            </div>

            <button type="button" className='btn btn-signout fw-bold' onClick={onLogout} >{t("logout")}</button>
            {user.role === "admin" && <p className="signup mt-3">
              {t("des")}&nbsp;
              <a href='/signup-admin'>{t("singup")}</a></p>}
          </div>
        </div> : <div className="formBx">
          <form onSubmit={postLogin}>
            <h1>{t("signin")}</h1>

            <div className="input-textbox">
              <span><BsPersonFill  ></BsPersonFill></span>
              <input autoFocus type="text" onChange={(e) => setName(e.target.value)} autoComplete="off" required />
              <label>Username</label>
            </div>
            <div className="input-textbox">
              <span onClick={() => setShowPass(prev => !prev)}>
                {showPass ? <FaRegEyeSlash ></FaRegEyeSlash> : <FaRegEye></FaRegEye>}</span>
              <input type={showPass ? "text" : "password"} onChange={(e) => setPassword(e.target.value)} autoComplete="off" required />
              <label>Password</label>
            </div>
            <button type="submit" className='btn btn-login fw-bold'>{t("login")}</button>
            {responses && <h5 className='text-error-login'>{responses}</h5>}

          </form>

        </div>}

      </section>
    </section>
  )
}