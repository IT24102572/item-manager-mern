import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">Item Manager</div>
      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/add-item">Add Item</NavLink>
        <NavLink to="/pong">Pong</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;