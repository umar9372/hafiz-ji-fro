import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import WebWrapper from "./src/Wrapper/WebWrapper";
import LandingPage from "./src/Pages/LandingPage";
import Dashboard from "./src/Pages/Dashboard";
import MappingSettings from "./src/Pages/MappingSettings";
import InventoryPage from "./src/Pages/InventoryPage";
import Sales from "./src/Pages/Sales";
import Purchase from "./src/Pages/Purchase";
import Accounts from "./src/Pages/Accounts";
import MaterialsManagement from "./src/Pages/MaterialsManagement";
import History from "./src/Pages/History";
import BillDetails from "./src/Pages/BillDetails";
import Production from "./src/Pages/Production";

export default function AppRouter() {
  const routes = createBrowserRouter([
    {
      element: <WebWrapper />,
      children: [
        {
          path: "/",
          element: <Dashboard />,
        },
        {
          path: "/inventory",
          element: <InventoryPage />,
        },
        {
          path: "/sales",
          element: <Sales />,
        },
        {
            path: "/purchase",
            element: <Purchase />,
        },
        {
            path: "/production",
            element: <Production />,
        },
        {
            path: "/settings",
            element: <MappingSettings />,
        },
        {
            path: "/accounts",
            element: <Accounts />,
        },
        {
            path: "/materials",
            element: <MaterialsManagement />,
        },
        {
            path: "/history",
            element: <History />,
        },
        {
            path: "/bill-details/:type/:id/:month",
            element: <BillDetails />,
        },
      ],
    },
  ]);
  return <RouterProvider router={routes} />;
}
