import API from "../api/axiosInstance";
import APILogin from "./axiosLogin";
const axiosGet = async (endpoint: string,signal?:AbortSignal) => {
    const response = await API.get(endpoint,{signal});
    return response.data;
};
const axiosPost = async (endpoint: string,body: { [key: string]: any; }|string[],signal?:AbortSignal) => {
   
      const response = await API.post(endpoint,body,{signal});
      return response.data;
  };
  const axiosPut = async (endpoint: string,body: { [key: string]: any; }={},signal?:AbortSignal) => {

      const response = await API.put(endpoint,body,{signal});
      return response.data;
    
  };
  const axiosDelete = async (endpoint: string,data?: { [key: string]: any; },signal?:AbortSignal) => {
    const response = await API.delete(endpoint,{data,signal});
    return response.data;
  
};
  const axiosLogin = async (endpoint: string,body: { [key: string]: any; }) => {
      const response = await APILogin.post(endpoint,body);
      return response.data;
  };
export { axiosGet, axiosPost,axiosLogin,axiosPut,axiosDelete};