import { useContext } from "react";
import { Context } from "../context/Context";
import { Navigate, Outlet } from "react-router-dom";

export function AuthGuard(props) {
  const { userData } = useContext(Context);

  if (!userData) {
    return <Navigate to={"/login"} />;
  }
  return <Outlet />;
}
