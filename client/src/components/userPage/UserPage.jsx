import "./UserPage.css";
import { useContext } from "react";
import { Context } from "../../context/Context";
import { User } from "../../icons/User";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { Link } from "react-router-dom";

export function UserPage(props) {
  const { userData } = useContext(Context);

  return (
    <div className="user-page-container">
      <div className="user-card">
        <User />
        <p className="email">{userData?.email}</p>
      </div>
      <div className="buttons">
        <Link to={"/allTraining"}>
          <PrimaryButton text={"My training"} />
        </Link>
        <Link to={"/"}>
          <PrimaryButton text={" Active training "} />
        </Link>
        <Link to={"/logout"}>
          <PrimaryButton text={"Logout"} />
        </Link>
      </div>
    </div>
  );
}
