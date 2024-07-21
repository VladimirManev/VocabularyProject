import { useContext, useEffect, useState } from "react";
import { Context } from "../../../context/Context";
import { themenData } from "./themenData";

export function Themen(props) {
  const { contextData, setContextData } = useContext(Context);
  const [currentTheme, setCurrentTheme] = useState(
    contextData.currentThemenData ? contextData.currentThemenData.name : "piano"
  );

  useEffect(() => {
    setContextData((prevData) => ({
      ...prevData,
      currentThemenData: themenData[currentTheme],
    }));
  }, [currentTheme]);

  function themeChangeHandler(e) {
    setCurrentTheme(e.target.value);
  }

  return (
    <div className="themen-container">
      <h3>Theme</h3>
      <select onChange={themeChangeHandler} value={currentTheme} name="" id="">
        <option value="piano">Piano</option>
        <option value="moon">Moon</option>
        <option value="fruits">Fruits</option>
        <option value="crazy">Crazy</option>
      </select>
    </div>
  );
}
