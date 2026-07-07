import { NavLink } from "react-router";

import adminMenu from "../../config/adminMenu";

export default function AdminSidebar() {
  return (
    <aside>
      <h2>Admin Panel</h2>

      <nav>
        <ul>
          {adminMenu.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  fontWeight: isActive ? "bold" : "normal",
                  display: "block",
                  padding: "10px 0",
                })}
              >
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
