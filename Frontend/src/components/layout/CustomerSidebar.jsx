import { NavLink } from "react-router";

import customerMenu from "../../config/customerMenu";

export default function CustomerSidebar() {
  return (
    <aside>
      <h2>Customer Panel</h2>

      <nav>
        <ul>
          {customerMenu.map((item) => (
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
