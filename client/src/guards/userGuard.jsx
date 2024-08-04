import { useContext } from "react";
import { Context } from "../context/Context";
import { Navigate, Outlet } from "react-router-dom";

export function UserGuard(props) {
  const { userData } = useContext(Context);

  if (userData) {
    return <Navigate to={"/allTraining"} />;
  }
  return <Outlet />;
}
