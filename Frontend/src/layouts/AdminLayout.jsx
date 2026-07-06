import { Outlet } from "react-router";

import Sidebar from "../components/layout/Sidebar";

export default function AdminLayout() {

    return (

        <div>

            <Sidebar />

            <main>

                <Outlet />

            </main>

        </div>

    );

}