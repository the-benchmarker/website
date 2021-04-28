import { Link } from "react-router-dom";

interface Props {
  updateDate: string;
}

export default function Home({ updateDate }: Props) {
  return (
    <div className="dense-container">
      <p>
        This website shows frameworks benchmark data run by{" "}
        <a
          href="https://github.com/the-benchmarker"
          target="_blank"
          rel="noreferrer"
        >
          The Benchmarker
        </a>
        . You can check their source code on{" "}
        <a
          target="_blank"
          href="https://github.com/the-benchmarker/web-frameworks"
          rel="noreferrer"
        >
          their GitHub repository
        </a>
        . This website is open source, you can check the source code{" "}
        <a
          target="_blank"
          href="https://github.com/the-benchmarker/website"
          rel="noreferrer"
        >
          here
        </a>
        .
      </p>
      <h4>
        Last Update: <b>{updateDate}</b>
      </h4>
      <hr />
      <section>
        <h3>Motivation</h3>
        <p>
          There are many frameworks, each one comes with its own advantages and
          drawbacks. The purpose of this project is to identify them and attempt
          to measure their differences (performance is only one metric).
        </p>
        <h4>What is a framework?</h4>
        <p>
          A framework is a set of components working together. The main
          intention behind a framework is to facilitate (app or service)
          creation. The way a framework help any developer could vary from one
          to an other.
        </p>
        <div>
          A majority of frameworks could be split in 2 parts:
          <ul>
            <li>
              <b>full-stack</b>: meaning it provides all aspects (-stacks-) from
              data layer to sometimes deployment
            </li>
            <li>
              <b>micro</b>: meaning it provides only the routing part, and let
              the developer choose any other component for the others
            </li>
          </ul>
        </div>
      </section>
      <hr />
      <section>
        <h3>Technologies</h3>
        <ul>
          <li>
            <code>ruby</code>, all tools are made in <code>ruby</code>
          </li>
          <li>
            <code>wrk</code>, results are collected using <code>wrk</code>
          </li>
          <li>
            <code>postgresql</code>, results are stored in{" "}
            <code>postgresql</code>
          </li>
          <li>
            <code>docker</code>, each implementation is implemented in an
            isolated <strong>container</strong>
          </li>
          <li>
            <code>jq</code>, processing <code>docker</code> metadata
          </li>
          <li>
            <code>docker-machine</code> if you are on <code>macos</code>
          </li>
        </ul>
      </section>
      <hr />
      <section>
        <h3>Technical Details</h3>
        <p>
          All frameworks are benchmarked using{" "}
          <a href="https://github.com/wg/wrk" target="_blank" rel="noreferrer">
            wrk
          </a>{" "}
          (threads: 8, timeout: 8, duration: 15 seconds) with <b>64</b>,{" "}
          <b>256</b>, and <b>512</b> concurrency.
        </p>
        <div>
          Hardware used for the benchmark:
          <ul>
            <li>CPU: 8 Cores (AMD FX-8320E Eight-Core Processor)</li>
            <li>RAM: 16 Gb</li>
            <li>OS: Fedora</li>
            <li>Docker version 20.10.5, build 55c4c88</li>
          </ul>
        </div>
      </section>
      <Link to="/result" className=" text-center decoration-none">
        <h4>Check Out the Benchmark Results!</h4>
      </Link>
    </div>
  );
}
