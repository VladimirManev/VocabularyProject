import { useContext, useEffect } from "react";
import { Context } from "../../context/Context";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { clearUserData } from "../../services/util";

export function Logout(props) {
  const { clearContextUserData, showNotification } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFunction() {
      try {
        props.loading(true);
        logout();
      } catch (error) {
        showNotification("Error", error.message);
      } finally {
        clearContextUserData();
        clearUserData();
        navigate("/");
      }
      props.loading(false);
    }
    fetchFunction();
  }, []);
}
