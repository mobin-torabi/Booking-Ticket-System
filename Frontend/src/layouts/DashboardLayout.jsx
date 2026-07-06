import { Outlet } from "react-router";

import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout() {

    return (

        <div>

            <Sidebar />

            <main>

                <Outlet />

            </main>

        </div>

    );

}