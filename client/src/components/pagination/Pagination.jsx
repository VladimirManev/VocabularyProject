import { PrimaryButton } from "../buttons/PrimaryButton";
import "./Pagination.css";

export function Pagination({ pageData, pageUp, pageDown }) {
  const minusBtnHide = pageData.page === 1 ? "inactiv" : "";
  const plusBtnHide = pageData.page === pageData.count ? "inactiv" : "";

  return (
    <div className="pagination-container">
      <PrimaryButton
        onClick={pageDown}
        className={`btn ${minusBtnHide}`}
        text={"-"}
      ></PrimaryButton>

      <p className="pageNum">
        {pageData.page} / {pageData.count}
      </p>
      <PrimaryButton
        onClick={pageUp}
        className={`btn ${plusBtnHide}`}
        text={"+"}
      ></PrimaryButton>
    </div>
  );
}
