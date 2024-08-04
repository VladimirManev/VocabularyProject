import "./AllTraining.css";
import { useContext, useEffect, useState } from "react";
import { getAllTraining, getAllTrainingCount } from "../../services/units";
import { Training } from "./training/Training";
import { AuthContext } from "../../context/Context";
import { LanguageContext } from "../../context/LanguageContext";
import { Pagination } from "../pagination/Pagination";
import { NotificationContext } from "../../context/NotificationContext";

export function AllTraining(props) {
  const { STR } = useContext(LanguageContext);
  const [allTrainigData, setAllTrainingdata] = useState([]);
  const { showNotification } = useContext(NotificationContext);
  const [pageData, setPageData] = useState({ page: 1, count: 2 });

  useEffect(() => {
    async function fetchFunction() {
      try {
        props.loading(true);
        const fetchedData = await getAllTrainingCount();
        if (fetchedData > 0) {
          setPageData((oldData) => ({
            ...oldData,
            count: Math.ceil(fetchedData / 5),
          }));
        }
      } catch (error) {
        showNotification("Error", error.message);
      }
    }
    fetchFunction();
  }, []);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchedData = await getAllTraining(5 * (pageData.page - 1), 5);
        if (fetchedData) {
          setAllTrainingdata(fetchedData);
        }
      } catch (error) {
        showNotification("Error", error.message);
      }
      props.loading(false);
    };
    if (pageData.count) {
      fetchFunction();
    }
  }, [pageData.page]);

  function pageUp() {
    if (pageData.page < pageData.count) {
      setPageData((oldData) => ({ ...oldData, page: oldData.page + 1 }));
    }
  }

  function pageDown() {
    if (pageData.page > 1) {
      setPageData((oldData) => ({ ...oldData, page: oldData.page - 1 }));
    }
  }

  return (
    <div className="allTraining-container">
      <h1>{STR.str19}</h1>
      {allTrainigData.length === 0 && (
        <p className="no-training">{STR.str20}</p>
      )}{" "}
      <div className="list-page-container">
        {allTrainigData.length !== 0 && (
          <>
            <ul className="list">
              {allTrainigData.map((x) => (
                <li className="list-item" key={x._id}>
                  <Training data={x} loading={props.loading} />
                </li>
              ))}
            </ul>
            <Pagination
              pageDown={pageDown}
              pageUp={pageUp}
              pageData={pageData}
            />
          </>
        )}
      </div>
    </div>
  );
}
