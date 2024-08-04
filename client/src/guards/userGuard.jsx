import { useContext } from "react";
import { AuthContext } from "../context/Context";
import { Navigate, Outlet } from "react-router-dom";

export function UserGuard(props) {
  const { userData } = useContext(AuthContext);

  if (userData) {
    return <Navigate to={"/allTraining"} />;
  }
  return <Outlet />;
}
