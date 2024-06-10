import { Link } from "react-router-dom";
import "./Header.css";

export function Header(props) {
  return (
    <>
      <header className="header">
        <nav className="nav">
          <ul className="list">
            <li className="list-item">
              <Link to="/">Welcome</Link>
            </li>
            <li className="list-item">
              <Link to="/vocabulary">Vocabulary</Link>
            </li>
            <li className="list-item">
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
