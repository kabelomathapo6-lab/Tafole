import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { decideRoute, isStaffRole, type StaffRole } from "@/lib/roles";

/**
 * Runs before staff pages and the login page: keeps the Supabase session cookie fresh and sends
 * people to the right screen for their role. Data access is still enforced by RLS.
 */
export async function proxy(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() checks the token with Supabase, unlike reading the cookie alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: StaffRole | null = null;
  if (user) {
    const { data } = await supabase
      .from("staff_profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    role = isStaffRole(data?.role) ? data.role : null;
  }

  const target = decideRoute({
    pathname: request.nextUrl.pathname,
    signedIn: !!user,
    role,
  });
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/login", "/waiter/:path*", "/kitchen/:path*", "/manager/:path*"],
};
