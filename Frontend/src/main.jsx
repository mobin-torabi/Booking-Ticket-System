import React from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "./Pages/Home.jsx";
// import Tweets from "./pages/Tweets/Tweets.jsx";
// import Users from "./pages/Users/Users.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  // {
  //   path: "/tweets",
  //   element: <Tweets />,
  // },
  // {
  //   path: "/users",
  //   element: <Users />,
  // },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
