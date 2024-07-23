import { useContext } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import "./Message.css";
import { Context } from "../../context/Context";

export function Message() {
  const { hideMessage, message } = useContext(Context);
  function okBtnClickHandler() {
    hideMessage();
  }

  return (
    <>
      <div className="message-container">
        <div className="text-container">
          <h3>{message?.title}</h3>
          <p className="text">{message?.text}</p>
        </div>
        <PrimaryButton onClick={okBtnClickHandler} text={"OK"} />
      </div>
    </>
  );
}
