import { NavLink } from "react-router-dom";
import "./Header.css";

export function Header(props) {
  return (
    <>
      <header className="header">
        <nav className="nav">
          <ul className="list">
            <li className="list-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "active-link" : undefined
                }
              >
                Welcome
              </NavLink>
            </li>
            <li className="list-item">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "active-link" : undefined
                }
              >
                Login
              </NavLink>
            </li>
            <li className="list-item">
              <NavLink
                to="/vocabulary"
                className={({ isActive }) =>
                  isActive ? "active-link" : undefined
                }
              >
                Vocabulary
              </NavLink>
            </li>
            <li className="list-item">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive ? "active-link" : undefined
                }
              >
                Settings
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
