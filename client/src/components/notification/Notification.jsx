import { useContext } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import "./Notification.css";
import { Context } from "../../context/Context";

export function Notification() {
  const { hideNotification, notification } = useContext(Context);
  function okBtnClickHandler() {
    hideNotification();
  }

  return (
    <>
      <div className="notification-container">
        <div className="text-container">
          <h3>{notification?.title}</h3>
          <p className="text">{notification?.text}</p>
        </div>
        <PrimaryButton onClick={okBtnClickHandler} text={"OK"} />
      </div>
    </>
  );
}
