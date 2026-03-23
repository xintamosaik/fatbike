import { renderToReadableStream } from "react-dom/server";
import homepage from "./index.html";

function Component(props: { message: string }) {
  return <div><h1>{props.message}</h1></div>;
}

Bun.serve({
  routes: {
    "/": homepage,
    "/hello": async () => {
      const stream = await renderToReadableStream(
        <Component message="Hello from server!" />,
      );

      return new Response(stream, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    },
  },
});