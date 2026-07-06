import { NavLink } from "react-router";

export default function Sidebar() {
  return (
    <aside>
      <NavLink to="/dashboard">Dashboard</NavLink>

      <NavLink to="/dashboard/profile">Profile</NavLink>

      <NavLink to="/dashboard/bookings">Bookings</NavLink>

      <NavLink to="/dashboard/notifications">Notifications</NavLink>

      <NavLink to="/dashboard/addresses">Addresses</NavLink>
    </aside>
  );
}
