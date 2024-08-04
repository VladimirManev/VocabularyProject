import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/Context";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { clearUserData } from "../../services/util";
import { NotificationContext } from "../../context/NotificationContext";

export function Logout(props) {
  const { clearContextUserData, userData } = useContext(AuthContext);

  const { showNotification } = useContext(NotificationContext);

  const navigate = useNavigate();
  if (!userData) {
    return;
  }

  useEffect(() => {
    async function fetchFunction() {
      try {
        props.loading(true);
        await logout();
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
