import { useContext } from "react";
import "./PrimaryButton.css";
import { ThemenContext } from "../../context/ThemenContext";

export function PrimaryButton(props) {
  const { themeData } = useContext(ThemenContext);

  let btnClass = "primaryButton";

  if (props.className) {
    btnClass += ` ${props.className} `;
  }

  return (
    <>
      <button
        className={btnClass}
        onClick={props.onClick}
        style={{
          backgroundColor: themeData?.color2,
          color: themeData?.color3,
        }}
      >
        {props.text}
      </button>
    </>
  );
}
