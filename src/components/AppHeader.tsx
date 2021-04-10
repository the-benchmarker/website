import { Link } from "react-router-dom";

function NavBar() {
  return (
    <div>
      <div className="text-center">
        <h1>Web Frameworks Benchmark</h1>

        <ul className="nav-links">
          <li>
            Data from{" "}
            <a
              href="https://github.com/the-benchmarker/web-frameworks"
              target="_blank"
              rel="noreferrer"
            >
              the-benchmarker/web-frameworks
            </a>
          </li>
          <li>
            <a
              href="https://github.com/SuspiciousLookingOwl/web-frameworks-benchmark"
              target="_blank"
              rel="noreferrer"
            >
              Source Code
            </a>
          </li>
        </ul>

        <ul className="nav-links pt-md">
          <li>
            <Link to="/result">Frameworks Benchmark</Link>
          </li>
          <li>
            <Link to="/compare">Compare Frameworks</Link>
          </li>
        </ul>
      </div>
      <hr />
    </div>
  );
}

export default NavBar;
