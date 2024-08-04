import "./Header.css";
import { Link, NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/Context";
import { User } from "../../icons/User";
import { LanguageContext } from "../../context/LanguageContext";

export function Header(props) {
  const { STR } = useContext(LanguageContext);
  const { userData } = useContext(AuthContext);

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
                  {STR.str21}
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
                  {STR.str22}
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
                {STR.str23}
              </NavLink>
            </li>

            {userData && (
              <>
                <li className="list-item">
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      isActive ? "active-link" : undefined
                    }
                  >
                    {STR.str24}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        {userData && (
          <Link to={"/userPage"}>
            <User />
          </Link>
        )}
      </header>
    </>
  );
}
