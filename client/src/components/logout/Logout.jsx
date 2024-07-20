import { useContext, useEffect } from "react";
import { Context } from "../../context/Context";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { clearUserData } from "../../services/util";

export function Logout(props) {
  const { contextData, setContextData } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFunction() {
      try {
        props.loading(true);
        await logout();
        setContextData((prevData) => ({
          ...prevData,
          userData: undefined,
        }));
        clearUserData();
        navigate("/");
      } catch (error) {
        alert(error.message);
      }
      props.loading(false);
    }
    fetchFunction();
  }, []);
}
