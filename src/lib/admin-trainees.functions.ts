import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type TraineesUpdate = Database["public"]["Tables"]["trainees"]["Update"];


const ADMIN_EMAIL = "admin@odk.local";
const TRAINEE_EMAIL_DOMAIN = "trainee.local";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(userId: string) {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized");
}


function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${TRAINEE_EMAIL_DOMAIN}`;
}

/**
 * Idempotent: create the admin Supabase user + admin role if missing.
 * Verifies the same hardcoded password used by the admin login form
 * so anonymous callers can't just create an admin.
 */
export const ensureAdminUserExists = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(6).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ODK_ADMIN_PASSWORD || "rahul-ranger";
    if (data.password !== expected) {
      throw new Error("Invalid admin password");
    }
    const supabaseAdmin = await getAdmin();


    // Find existing admin user by email
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);

    let admin = list.users.find((u) => u.email === ADMIN_EMAIL);
    if (!admin) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: data.password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      admin = created.user!;
    } else {
      // Make sure the password matches (in case it was rotated server-side)
      await supabaseAdmin.auth.admin.updateUserById(admin.id, {
        password: data.password,
      });
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: admin.id, role: "admin" }, { onConflict: "user_id,role" });

    return { ok: true };
  });

export const createTraineeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        phone: z.string().max(40).optional().default(""),
        joinDate: z.string().min(8).max(20),
        manager: z.string().max(120).optional().default(""),
        notes: z.string().max(2000).optional().default(""),
        username: z.string().max(80).optional(),
        password: z.string().min(6).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabaseAdmin = await getAdmin();

    let authUserId: string | null = null;
    const username = data.username?.trim() || "";
    if (username && data.password) {
      const email = usernameToEmail(username);
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });
      if (error) {
        // If user already exists, look it up and reset password so login works.
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listErr) throw new Error(error.message);
        const existing = list.users.find((u) => u.email === email);
        if (!existing) throw new Error(error.message);
        authUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: data.password,
        });
      } else {
        authUserId = created.user!.id;
      }
      await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: authUserId, role: "trainee" },
          { onConflict: "user_id,role" },
        );
    }

    const { data: row, error: insertErr } = await supabaseAdmin
      .from("trainees")
      .insert({
        name: data.name.trim(),
        phone: data.phone,
        join_date: data.joinDate,
        level_since_date: data.joinDate,
        current_level: 0,
        manager: data.manager,
        status: "Active",
        notes: data.notes,
        username: username || null,
        auth_user_id: authUserId,
        history: [{ level: 0, date: data.joinDate }],
      })
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    return { id: row.id };
  });

export const updateTraineeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z.object({
          name: z.string().min(1).max(120).optional(),
          phone: z.string().max(40).optional(),
          joinDate: z.string().optional(),
          levelSinceDate: z.string().optional(),
          currentLevel: z.number().int().min(0).max(3).optional(),
          manager: z.string().max(120).optional(),
          status: z.enum(["Active", "On Hold", "Exited"]).optional(),
          notes: z.string().max(2000).optional(),
          username: z.string().max(80).optional(),
          password: z.string().min(6).max(200).optional(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabaseAdmin = await getAdmin();
    const { id, patch } = data;
    const dbPatch: TraineesUpdate = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.joinDate !== undefined) dbPatch.join_date = patch.joinDate;
    if (patch.levelSinceDate !== undefined) dbPatch.level_since_date = patch.levelSinceDate;
    if (patch.currentLevel !== undefined) dbPatch.current_level = patch.currentLevel;
    if (patch.manager !== undefined) dbPatch.manager = patch.manager;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.username !== undefined) dbPatch.username = patch.username || null;
    if (patch.status !== undefined) {
      dbPatch.status = patch.status;
      if (patch.status === "Exited") {
        dbPatch.exit_date = new Date().toISOString().slice(0, 10);
      } else {
        dbPatch.exit_date = null;
      }
    }

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabaseAdmin
        .from("trainees")
        .update(dbPatch)
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

    if (patch.password || patch.username !== undefined) {
      const { data: t, error: tErr } = await supabaseAdmin
        .from("trainees")
        .select("auth_user_id")
        .eq("id", id)
        .single();
      if (tErr) throw new Error(tErr.message);

      if (t.auth_user_id) {
        const upd: { password?: string; email?: string } = {};
        if (patch.password) upd.password = patch.password;
        if (patch.username && patch.username.trim()) {
          upd.email = usernameToEmail(patch.username);
        }
        if (Object.keys(upd).length > 0) {
          const { error: e2 } = await supabaseAdmin.auth.admin.updateUserById(
            t.auth_user_id,
            upd,
          );
          if (e2) throw new Error(e2.message);
        }
      } else if (patch.username && patch.password) {
        const email = usernameToEmail(patch.username);
        const { data: created, error: ce } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: patch.password,
            email_confirm: true,
          });
        if (ce) throw new Error(ce.message);
        await supabaseAdmin
          .from("trainees")
          .update({ auth_user_id: created.user!.id })
          .eq("id", id);
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: created.user!.id, role: "trainee" },
            { onConflict: "user_id,role" },
          );
      }
    }

    return { ok: true };
  });

export const deleteTraineeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabaseAdmin = await getAdmin();
    const { data: t } = await supabaseAdmin
      .from("trainees")
      .select("auth_user_id")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("trainees")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (t?.auth_user_id) {
      await supabaseAdmin.auth.admin.deleteUser(t.auth_user_id);
    }
    return { ok: true };
  });

export const promoteTraineeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabaseAdmin = await getAdmin();
    const { data: t, error } = await supabaseAdmin
      .from("trainees")
      .select("current_level, history")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (t.current_level >= 3) return { ok: true };
    const nl = t.current_level + 1;
    const date = new Date().toISOString().slice(0, 10);
    const history = [
      ...((t.history as Array<{ level: number; date: string }>) ?? []),
      { level: nl, date },
    ];
    const { error: ue } = await supabaseAdmin
      .from("trainees")
      .update({
        current_level: nl,
        level_since_date: date,
        history,
      })
      .eq("id", data.id);
    if (ue) throw new Error(ue.message);
    return { ok: true };
  });
