import { renderToReadableStream } from "react-dom/server";
import type { ReactElement } from "react";

import type { AppError } from "./error";

async function htmlResponse(fragment: ReactElement): Promise<Response> {
  const stream = await renderToReadableStream(fragment);

  return new Response(stream, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function appErrorResponse(error: AppError): Response {
  switch (error.kind) {
    case "not_found":
      return new Response(error.message, { status: 404 });
    case "validation":
      return new Response(error.message, { status: 400 });
    case "internal":
      return new Response(error.message, { status: 500 });
  }

  const exhaustiveCheck: never = error;
  throw new Error(`Unhandled app error: ${JSON.stringify(exhaustiveCheck)}`);
}

export { htmlResponse, appErrorResponse };