import React, { useState } from 'react';
import NetworkError from './networkError';
import { useTranslation } from 'react-i18next';
import { ImUser } from "react-icons/im";
import { axiosPut } from "../api/axiosFetch";
import { useSearchParams, useNavigate } from "react-router-dom";
import ResponseAPI from './option/responseAPI';

// Define an interface for the component's props for type safety
interface FormData {
  fullname: string;
  username: string;
  password: string;
  conPassword: string;
  role: string;
  employee: string;
  email: string;
}
interface ICreateUser {
  message: string;
  payload: {
    email: string;
    employee_no: string;
    name: string;
    role: string;
    status: boolean;
    username: string;
  }
}

// Use React.FC (FunctionComponent) type for the component
const EditUser = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(false);
  const [nameRequired, setNameRequired] = useState(false);
  const [userNameRequired, setuserNameRequired] = useState(false);
  const [errorRole, setErrorRole] = useState(false);
  const [errorEmployee, setErrorEmployee] = useState(false);
  const [errorEmail, setErrorEmail] = useState(false);
  const [checkNetwork, setCheckNetwork] = useState(true);
  const [response, setResponse] = useState<{ show: boolean, error: boolean | null, message: string }>({ show: false, error: false, message: '' });
  const [load, setLoad] = useState(false);
  const { t } = useTranslation("user");
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
      fullname: "",
      conPassword: "",
      username: "",
      password: "",
      role: "",
      employee: "",
      email: "",
    });
  const [userInfo, setUserInfo] = useState({
        employee_no: searchParams.get("employee_no") || "",
        username: searchParams.get("username") || "",
        name: searchParams.get("name") || "",
        position: searchParams.get("position") || "0",
    });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData)
    setErrorMessage(false); // Reset error 
    setNameRequired(false);
    setuserNameRequired(false);
    setErrorRole(false);
    setErrorEmail(false);
    let haveError = false;
    if (formData.fullname === "") {
      setNameRequired(true);
      haveError = true;
    }
    if (formData.username === "") {
      setuserNameRequired(true);
      haveError = true;
    }
    if (formData.email === "") {
      setErrorEmail(true);
      haveError = true;
    }
    if (formData.password !== formData.conPassword || formData.password === "" || formData.conPassword === "") {
      setErrorMessage(true);
      haveError = true;

    } if (formData.role === '0' || formData.role === '') {
      setErrorRole(true);
      haveError = true;
    } if (formData.employee === "") {
      setErrorEmployee(true);
      haveError = true;
    }
    if (haveError) {
      return; // Stop submission if there are validation errors
    }
    else {
      try {
        setLoad(true);
        const formDataToSubmit = {
          "email": formData.email,
          "employee_no": formData.employee,
          "name": formData.fullname,
          "password": formData.password,
          "role": formData.role,
          "username": formData.username
        }
        const res: ICreateUser = await axiosPut(
          '/user/create_user', formDataToSubmit
        );
        if (res.message) {
          setResponse({ show: true, error: false, message: res.message });
          setTimeout(() => {
            navigate(-1);
          }, 3000);
        }
      } catch (e: any) {
        console.error(e);
        if (e.response?.data?.detail) {
          setResponse({ show: true, error: true, message: e.response.data.detail });
        } else {
          setResponse({ show: true, error: true, message: e.message });
        }
      } finally {
        setLoad(false);

      }
    }

  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };


  return (<>
    {!checkNetwork ?
      <div className='w-100 mt-5'><NetworkError /></div> : <div className='user-box-page'>
        {load && <div className='loading-background top-position-0'>
          <div id="loading"></div>
        </div>}
        {response.show && <ResponseAPI response={{ error: response.error, message: response.message }} />}
        <div className="container">
          <div className="user-header">
            <div className="profile-info">
              <div className="avatar"><ImUser size={32} /></div>
              <div className="user-details">
                <h1>Create User</h1>
                <p>user for control AMR</p>
              </div>
            </div> <button className="save-btn" onClick={handleSubmit}>Save</button>
          </div>

          <form>
            <div className="form-grid">
              <div className="form-group-user">
                <label htmlFor="fullname">Full Name</label>
                <input type="text" id="fullname" onChange={handleChange} placeholder="Your First Name" required />
                {nameRequired && <p className="text-danger">Full Name is required</p>}
              </div>

              <div className="form-group-user">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" onChange={handleChange} placeholder="Your Username" required />
                {userNameRequired && <p className="text-danger">Username is required</p>}
              </div>

              <div className="form-group-user">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" onChange={handleChange} placeholder="Your Password" required />
                {errorMessage && <p className="text-danger">Passwords do not match</p>}
              </div>
              <div className="form-group-user">
                <label htmlFor="conPassword">Confirm Password</label>
                <input type="password" id="conPassword" onChange={handleChange} placeholder="Confirm Your Password" required />
                {errorMessage && <p className="text-danger">Passwords do not match</p>}
              </div>


              <div className="form-group-user">
                <label htmlFor="role">Role</label>
                <select id="role" onChange={handleChange}>
                  <option value="0">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
                {errorRole && <p className="text-danger">Role is required</p>}
              </div>

              <div className="form-group-user">
                <label htmlFor="employee">Employee No.</label>
                <input type="text" id="employee" onChange={handleChange} placeholder="Your Employee No." />
                {errorEmployee && <p className="text-danger">Employee No. is required</p>}
              </div>
            </div>

            <div className="email-section">
              <h2>My email Address</h2>
              <div className="email-item">
                <div className="email-icon">✉️</div>
                <input type="email" id="email" onChange={handleChange} placeholder="Your Email Address" />
                {errorEmail && <p className="text-danger">Email is required</p>}
              </div>
            </div>
          </form>
        </div>
      </div>
    }
  </>
  );
};

export default EditUser;