import { useContext } from "react";
import { Context } from "../context/Context";
import {  useNavigate } from "react-router-dom";



export function Logout(props) {
  const {contextData, setContextData} = useContext(Context);
  const navigate = useNavigate();

  if (confirm("Are you sure?")) {
    try {
      prevData => ({
        ...prevData,
        userData:undefined
      });
    } catch (error) {
      
    }

  }

} 