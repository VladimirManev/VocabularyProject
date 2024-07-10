import { useContext, useEffect } from "react";
import { Context } from "../context/Context";
import { useNavigate } from "react-router-dom";



export function Logout(props) {
  const { contextData, setContextData } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setContextData(prevData => ({
        ...prevData,
        userData: undefined
      }))
      navigate("/")
    } catch (error) {
      alert(error);
    }
  }, [])




} 