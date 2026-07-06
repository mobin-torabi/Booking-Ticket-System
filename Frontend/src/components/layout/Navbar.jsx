import { Link } from "react-router";

export default function Navbar() {
  return (
    <nav>
      <Link to="/">Ticki</Link>

      <Link to="/">Home</Link>

      <Link to="/tickets">Tickets</Link>

      <Link to="/login">Login</Link>

      <Link to="/register">Register</Link>
    </nav>
  );
}
