import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.onerror = (
  _msg,
  _source,
  _lineno,
  _colno,
  error
) => {
  console.error(
    "Global error caught:",
    error
  );
};

window.addEventListener(
  "unhandledrejection",
  (e) => {
    console.error(
      "Unhandled promise rejection:",
      e.reason
    );
  }
);

createRoot(
  document.getElementById(
    "root"
  )!
).render(<App />);
