type HttpErrors = [number, number, number]; // 64, 256, 512

function HttpErrorsTooltip(errorsString: string) {
  if (!errorsString) return;

  const [level64, level256, level512] = JSON.parse(errorsString) as HttpErrors;

  return (
    <div>
      HTTP Errors:
      <ul className="pl-lg">
        {level64 && <li>64: {level64}</li>}
        {level256 && <li>256: {level256}</li>}
        {level512 && <li>512: {level512}</li>}
      </ul>
    </div>
  );
}

export default HttpErrorsTooltip;
