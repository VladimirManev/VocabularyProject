import "./PrimaryButton.css";

export function PrimaryButton(props) {
  let btnClass = "primaryButton";

  if (props.className) {
    btnClass += ` ${props.className}`;
  }

  return (
    <>
      <button className={btnClass} onClick={props.onClick}>
        {props.text}
      </button>
    </>
  );
}
