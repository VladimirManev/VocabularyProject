import { useContext } from "react";
import { AuthContext } from "../context/Context";
import { Navigate, Outlet } from "react-router-dom";

export function AuthGuard(props) {
  const { userData } = useContext(AuthContext);

  if (!userData) {
    return <Navigate to={"/login"} />;
  }
  return <Outlet />;
}
