import "./UserPage.css";
import { useContext } from "react";
import { AuthContext } from "../../context/Context";
import { User } from "../../icons/User";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";

export function UserPage(props) {
  const { STR } = useContext(LanguageContext);
  const { userData } = useContext(AuthContext);

  return (
    <div className="user-page-container">
      <div className="user-card">
        <User />
        <p className="email">{userData?.email}</p>
      </div>
      <div className="buttons">
        <Link to={"/createTraining"}>
          <PrimaryButton text={STR.str42} />
        </Link>
        <Link to={"/myTraining"}>
          <PrimaryButton text={STR.str43} />
        </Link>
        <Link to={"/activeTraining"}>
          <PrimaryButton text={STR.str44} />
        </Link>
        <Link to={"/logout"}>
          <PrimaryButton text={STR.str45} />
        </Link>
      </div>
    </div>
  );
}
