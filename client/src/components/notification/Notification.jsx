import { useContext } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import "./Notification.css";
import { Context } from "../../context/Context";
import { LanguageContext } from "../../context/LanguageContext";

export function Notification() {
  const { STR } = useContext(LanguageContext);
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
        <PrimaryButton onClick={okBtnClickHandler} text={STR.str32} />
      </div>
    </>
  );
}
