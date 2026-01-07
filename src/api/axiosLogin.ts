import axios from "axios";

const APILogin = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL, // Read from .env file
  timeout: 20000, // 20 seconds timeout
  headers: { 
    'content-type': 'application/x-www-form-urlencoded',
    'Authorization': sessionStorage.getItem('token'), 
    "ngrok-skip-browser-warning": "true"},
});

export default APILogin;