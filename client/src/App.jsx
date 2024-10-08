import "./App.css";
import { useContext, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/header/Header";
import { Welcome } from "./components/welcome/Welcome";
import { Vocabulary } from "./components/vocabulary/Vocabulary";
import { Settings } from "./components/settings/Settings";
import { Spinner } from "./components/spinner/Spinner";
import { Login } from "./components/login/Login";
import { Register } from "./components/register/Register";
import { AllTraining } from "./components/allTrainig/AllTraining";
import { AuthContext } from "./context/Context";
import { Logout } from "./components/logout/Logout";
import { TrainingDetails } from "./components/allTrainig/trainingDetails/TrainingDetails";
import { CreateTraining } from "./components/allTrainig/createTraining/CreateTraining";
import { getUserData } from "./services/util";
import { EditTraining } from "./components/allTrainig/editTraining/EditTraining";
import { UserPage } from "./components/userPage/UserPage";
import { Notification } from "./components/notification/Notification";
import { MyTraining } from "./components/myTraining/MyTraining";
import { ActiveTraining } from "./components/activeTraining/ActiveTraining";
import { AuthGuard } from "./guards/authGuard";
import { DeleteTraining } from "./components/deleteTraining/DeleteTraining";
import { UserGuard } from "./guards/userGuard";
import { ThemenContext } from "./context/ThemenContext";
import { NotificationContext } from "./context/NotificationContext";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const { setContextUserData } = useContext(AuthContext);
  const { notification } = useContext(NotificationContext);

  const { themeData } = useContext(ThemenContext);

  useEffect(() => {
    const sessionStorageUserData = getUserData();
    if (sessionStorageUserData) {
      setContextUserData(sessionStorageUserData);
    }
  }, []);

  function loading(status) {
    setIsLoading(status);
  }

  return (
    <div
      className="global-div"
      style={{
        backgroundColor: themeData?.color1,
        color: themeData?.color2,
      }}
    >
      {isLoading && <Spinner />}

      {notification && <Notification />}

      <Header />

      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route path="/settings" element={<Settings />} />

        <Route
          path="/allTraining"
          element={<AllTraining loading={loading} />}
        />

        <Route
          path="/trainingDetails/:currentTrainingId"
          element={<TrainingDetails loading={loading} />}
        />

        <Route element={<UserGuard />}>
          <Route path="/login" element={<Login loading={loading} />} />

          <Route path="/register" element={<Register loading={loading} />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route
            path="/myTraining"
            element={<MyTraining loading={loading} />}
          />
          <Route
            path="/deleteTraining/:currentTrainingId"
            element={<DeleteTraining loading={loading} />}
          />
          <Route
            path="/vocabulary"
            element={<Vocabulary loading={loading} />}
          />
          <Route
            path="/activeTraining"
            element={<ActiveTraining loading={loading} />}
          />
          <Route path="/logout" element={<Logout loading={loading} />} />
          <Route
            path="/createTraining"
            element={<CreateTraining loading={loading} />}
          />
          <Route
            path="/editTraining"
            element={<EditTraining loading={loading} />}
          />
          <Route path="/userPage" element={<UserPage loading={loading} />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
