import { Link } from "react-router-dom";

function NavBar() {
  return (
    <div>
      <div className="text-center">
        <h1 className="my-none">Web Frameworks Benchmark</h1>

        <ul className="nav-links">
          <li>
            <Link to="/result">Frameworks Benchmark</Link>
          </li>
          <li>
            <Link to="/compare">Compare Frameworks</Link>
          </li>
          <li>
            <a
              href="https://github.com/SuspiciousLookingOwl/web-frameworks-benchmark"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>
          </li>
        </ul>
      </div>
      <hr />
    </div>
  );
}

export default NavBar;
