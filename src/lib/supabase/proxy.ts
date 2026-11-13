import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Rotas acessíveis sem login. */
const PUBLIC_PATHS = ["/login", "/esqueci-a-senha", "/auth/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p,
  );
}

/**
 * Renova a sessão do Supabase a cada requisição e protege as rotas.
 * Checagem otimista: a autorização de verdade acontece no RLS e no
 * `requireUser()` das páginas e actions.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Não coloque código entre a criação do cliente e esta chamada:
  // é ela que renova o token quando ele está para expirar.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && !isPublic(pathname)) {
    const next =
      pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return redirectKeepingCookies(request, response, `/login${next}`);
  }

  if (isLoggedIn && pathname === "/login") {
    return redirectKeepingCookies(request, response, "/");
  }

  return response;
}

/** Redireciona sem perder os cookies de sessão que acabaram de ser renovados. */
function redirectKeepingCookies(
  request: NextRequest,
  response: NextResponse,
  to: string,
) {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(key);
    if (value) redirect.headers.set(key, value);
  }
  return redirect;
}
