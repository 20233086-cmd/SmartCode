import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SessionProvider } from "./api";
import "./styles.css";
createRoot(document.getElementById("root")).render(
  <SessionProvider>
    <App />
  </SessionProvider>,
);

import "./reference.css";
import "./logout.css";

import "./payments.css";
