type HttpErrors = [number, number, number]; // 64, 256, 512

interface Props {
  errorsString: string;
}

function HttpErrorsTooltip({ errorsString }: Props) {
  const errors = JSON.parse(errorsString) as HttpErrors;

  return (
    <div>
      <strong>HTTP errors recorded</strong>
      <ul className="http-error-list">
        {errors.map((count, index) =>
          count > 0 ? (
            <li key={index}>
              {[64, 256, 512][index]} concurrent connections: {count}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

export default HttpErrorsTooltip;
