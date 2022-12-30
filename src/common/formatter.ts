export const formatThousandSeparated = (value: number, separator = " ") => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const formatLatency = (value: number) => {
  return `${(value/1000).toFixed(2)} ms`;
};
