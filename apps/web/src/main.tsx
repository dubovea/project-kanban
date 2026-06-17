import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { queryClient, queryPersistOptions } from "@/lib/query-client";
import { router } from "@/router";
import { ToastContainer } from "react-toastify";
import "@/register-service-worker";
import "@/styles/app.css";
import { startOfflineSync } from "@/services/offline";

startOfflineSync();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistOptions}
    >
      <ToastContainer />
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </React.StrictMode>,
);
