import { useContext } from "react";
import "./PrimaryButton.css";
import { Context } from "../../context/Context";

export function PrimaryButton(props) {
  const { contextData } = useContext(Context);

  let btnClass = "primaryButton";

  if (props.className) {
    btnClass += ` ${props.className}`;
  }

  return (
    <>
      <button
        className={btnClass}
        onClick={props.onClick}
        style={{
          backgroundColor: contextData.currentThemenData?.color2,
          color: contextData.currentThemenData?.color3,
        }}
      >
        {props.text}
      </button>
    </>
  );
}
