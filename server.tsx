import { renderToReadableStream } from "react-dom/server";
import homepage from "./index.html";

function Component(props: { message: string }) {
  return (
    <section>
      <h2>{props.message}</h2>
      <p>This fragment was rendered on the server and swapped into #output.</p>
    </section>
  );
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