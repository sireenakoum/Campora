import { supabase } from "./lib/supabaseClient";

export default async function Home() {
  const { data, error } = await supabase
    .from("test")
    .select("*");

  return (
    <main>
      <h1>Campora</h1>

      {error ? (
        <p>Connection error: {error.message}</p>
      ) : (
        <p>Supabase connected successfully!</p>
      )}

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}