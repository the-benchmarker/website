import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav>
      <Link to="/table">Table</Link> | <Link to="/chart">Chart</Link>
    </nav>
  );
}

export default NavBar;
