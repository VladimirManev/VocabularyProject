import { Link } from "react-router-dom";
import "./Welcome.css";

export function Welcome(props) {
  return (
    <>
      <div className="welcome-container">
        <h1 className="title">Hi there!</h1>
        <h2 className="subtitle">
          Welcome to <span>Vocabulary</span>
        </h2>
        <Link to="/vocabulary" className="btn">
          Get started!
        </Link>
      </div>
    </>
  );
}
