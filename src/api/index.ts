export interface Benchmark {
  id: number;
  language: string;
  framework: {
    name: string;
    link: string;
    version: string;
  };
  speed64: number;
  speed256: number;
  speed512: number;
}

export const getBenchmarkData = async (): Promise<Benchmark[]> => {
  // Fetch markdown data from https://github.com/the-benchmarker/web-frameworks
  const response = await fetch(
    "https://raw.githubusercontent.com/the-benchmarker/web-frameworks/master/README.md"
  );
  let md = await response.text();
  // find table
  md = md.slice(md.indexOf("|"), md.lastIndexOf("|"));

  const rows = md.split(/\r?\n/g);
  // remove table header
  rows.splice(0, 2);

  return rows
    .map((r) => {
      // remove first and last character ( | ) and split to cells
      const cells = r.slice(1, -1).split("|");

      // trim all content and destruct array
      const [
        id,
        language,
        framework,
        speed64,
        speed256,
        speed512,
      ] = cells.map((c) => c.trim());

      // extract framework name, link, and version
      const [, name, link, version] = framework.match(
        /\[(.*?)\]\((.*?)\) \((.*?)\)/
      )!;

      const toNumber = (s: string) => +s.replace(/[^0-9.]/g, "");

      return {
        id: +id,
        language,
        framework: {
          name,
          link,
          version,
        },
        speed64: toNumber(speed64),
        speed256: toNumber(speed256),
        speed512: toNumber(speed512),
      };
    })
    .sort((a, b) => a.language.localeCompare(b.language));
};
