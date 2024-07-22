import { NavLink } from "react-router-dom";
import "./Header.css";
import { useContext } from "react";
import { Context } from "../../context/Context";

export function Header(props) {
  const { userData } = useContext(Context);

  return (
    <>
      <header className="header">
        <nav className="nav">
          <ul className="list">
            {!userData && (
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
            )}
            {!userData && (
              <li className="list-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? "active-link" : undefined
                  }
                >
                  Register
                </NavLink>
              </li>
            )}
            <li className="list-item">
              <NavLink
                to="/allTraining"
                className={({ isActive }) =>
                  isActive ? "active-link" : undefined
                }
              >
                Training
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
            {userData && (
              <li className="list-item">
                <NavLink
                  to="/logout"
                  className={({ isActive }) =>
                    isActive ? "active-link" : undefined
                  }
                >
                  Logout
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </>
  );
}
