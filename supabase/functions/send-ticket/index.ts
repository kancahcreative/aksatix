// Supabase Edge Function: kirim e-tiket via email (Resend) dan WhatsApp (Fonnte / Meta Cloud API).
// Dipicu Database Webhook pada INSERT tabel public.aksatix_outbox. Juga bisa dipanggil {"retry":true}
// untuk memproses ulang pesan pending/failed (mis. dari pg_cron).
import { createClient } from "npm:@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";

const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const SITE = env("SITE_URL", "https://aksatix.kancah.com");
const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const verifyUrl = (code: string) => `${SITE}/cek-keaslian-tiket?kode=${encodeURIComponent(code)}`;

function normPhone(raw: string): string {
  let d = raw.replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}

const fmtDate = (d?: string, t?: string) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  const s = isNaN(+dt) ? d : dt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return t ? `${s}, ${t} WIB` : s;
};

async function loadOrder(orderId: string) {
  const { data: o } = await sb.from("aksatix_records").select("payload").eq("kind", "orders").eq("record_id", orderId).single();
  if (!o) throw new Error("Order tidak ditemukan");
  const order = o.payload;
  const { data: att } = await sb.from("aksatix_records").select("payload").eq("kind", "attendees")
    .filter("payload->>orderId", "eq", orderId).order("record_id");
  const tickets = (att ?? []).map((r) => r.payload).filter((t) => t.status !== "Void");
  if (!tickets.length) throw new Error("Belum ada tiket untuk order ini");
  const { data: ev } = await sb.from("aksatix_records").select("payload").eq("kind", "events").eq("record_id", order.eventId).maybeSingle();
  return { order, tickets, event: ev?.payload ?? {} };
}

async function sendEmail(to: string, ctx: Awaited<ReturnType<typeof loadOrder>>) {
  const { order, tickets, event } = ctx;
  const attachments: Record<string, string>[] = [];
  const cards: string[] = [];
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const png = (await QRCode.toDataURL(verifyUrl(t.code), { margin: 1, width: 320 })).split(",")[1];
    attachments.push({ filename: `qr-${t.code}.png`, content: png, content_id: `qr${i}` });
    cards.push(`
      <table role="presentation" width="100%" style="border:1px solid #E2EBE7;border-radius:14px;margin:14px 0"><tr>
        <td style="padding:16px">
          <div style="font-size:12px;color:#5E6F68;letter-spacing:.08em;text-transform:uppercase">${esc(t.ticketName)} · Tiket ${i + 1}/${tickets.length}</div>
          <div style="font:700 22px/1.3 monospace;letter-spacing:.04em;margin:6px 0">${esc(t.code)}</div>
          <div style="font-size:13px;color:#5E6F68">Atas nama ${esc(t.name)}</div>
        </td>
        <td width="130" style="padding:10px;text-align:center"><img src="cid:qr${i}" width="110" height="110" alt="QR ${esc(t.code)}"></td>
      </tr></table>`);
  }
  const html = `<!doctype html><html><body style="margin:0;background:#F5F9F7;font:15px/1.6 Arial,sans-serif;color:#16211D">
  <table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px">
   <table role="presentation" width="560" style="max-width:100%;background:#fff;border-radius:18px;padding:28px">
    <tr><td>
      <div style="font-weight:800;font-size:22px">Aksatix</div>
      <h1 style="font-size:22px;margin:18px 0 6px">E-tiket kamu sudah terbit 🎉</h1>
      <p style="margin:0 0 4px"><b>${esc(event.name ?? "Event")}</b></p>
      <p style="margin:0;color:#5E6F68">${esc(fmtDate(event.date, event.time))}<br>${esc([event.venue, event.city].filter(Boolean).join(", "))}</p>
      ${cards.join("")}
      <p style="font-size:13px;color:#5E6F68">Tunjukkan QR atau kode di atas saat masuk. Jangan bagikan kode ke publik.
      Pesanan: ${esc(order.orderNumber)}.</p>
      <p><a href="${esc(SITE)}/cek-keaslian-tiket" style="display:inline-block;background:#00FF96;color:#16211D;font-weight:700;padding:11px 18px;border-radius:99px;text-decoration:none">Cek keaslian tiket</a></p>
    </td></tr></table>
  </td></tr></table></body></html>`;
  const text = `E-tiket Aksatix — ${event.name ?? ""}\n${tickets.map((t) => `${t.ticketName}: ${t.code}`).join("\n")}\nCek keaslian: ${SITE}/cek-keaslian-tiket`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("MAIL_FROM", "Aksatix <tiket@aksatix.kancah.com>"),
      to: [to],
      subject: `E-tiket ${event.name ?? "Aksatix"} (${order.orderNumber})`,
      html, text, attachments,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

async function sendWhatsApp(rawPhone: string, ctx: Awaited<ReturnType<typeof loadOrder>>) {
  const { order, tickets, event } = ctx;
  const to = normPhone(rawPhone);
  if (to.length < 9) throw new Error("Nomor WhatsApp tidak valid");
  const provider = env("WA_PROVIDER", "fonnte");
  const codes = tickets.map((t) => t.code).join(", ");

  if (provider === "meta") {
    // Wajib template yang sudah disetujui Meta. Body template: {{1}} nama, {{2}} event, {{3}} kode tiket, {{4}} link cek.
    const r = await fetch(`https://graph.facebook.com/v21.0/${env("WA_PHONE_NUMBER_ID")}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("WA_ACCESS_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to, type: "template",
        template: {
          name: env("WA_TEMPLATE", "aksatix_e_tiket"), language: { code: "id" },
          components: [{ type: "body", parameters: [
            order.buyerName ?? "Kak", event.name ?? "Event", codes, `${SITE}/cek-keaslian-tiket`,
          ].map((text) => ({ type: "text", text: String(text).replace(/[\n\t]+/g, " ") })) }],
        },
      }),
    });
    if (!r.ok) throw new Error(`Meta WA ${r.status}: ${await r.text()}`);
    return;
  }

  // Fonnte (gateway tidak resmi, berbasis WhatsApp Web — cocok untuk tahap awal)
  const message =
    `Halo ${order.buyerName ?? ""}! E-tiket kamu sudah terbit ✅\n\n` +
    `*${event.name ?? "Event"}*\n${fmtDate(event.date, event.time)}\n${[event.venue, event.city].filter(Boolean).join(", ")}\n\n` +
    tickets.map((t, i) => `Tiket ${i + 1} (${t.ticketName}): *${t.code}*`).join("\n") +
    `\n\nCek keaslian: ${SITE}/cek-keaslian-tiket\nJangan bagikan kode ke publik. — Aksatix`;
  const r = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: env("FONNTE_TOKEN") },
    body: new URLSearchParams({ target: to, message, countryCode: "62" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === false) throw new Error(`Fonnte: ${JSON.stringify(j)}`);
}

async function processRow(row: { id: number; order_id: string; channel: string; recipient: string; attempts: number }) {
  try {
    const ctx = await loadOrder(row.order_id);
    if (row.channel === "email") await sendEmail(row.recipient, ctx);
    else await sendWhatsApp(row.recipient, ctx);
    await sb.from("aksatix_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: row.attempts + 1, last_error: null }).eq("id", row.id);
    return { id: row.id, ok: true };
  } catch (e) {
    await sb.from("aksatix_outbox").update({ status: "failed", attempts: row.attempts + 1, last_error: String((e as Error).message).slice(0, 500) }).eq("id", row.id);
    return { id: row.id, ok: false, error: String((e as Error).message) };
  }
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== env("WEBHOOK_SECRET") || !env("WEBHOOK_SECRET")) {
    return new Response("unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  let rows: any[] = [];
  if (body.retry) {
    const { data } = await sb.from("aksatix_outbox").select("*").in("status", ["pending", "failed"]).lt("attempts", 5).order("id").limit(25);
    rows = data ?? [];
  } else if (body.record?.id) {
    rows = [body.record];
  }
  const results = [];
  for (const r of rows) results.push(await processRow(r));
  return Response.json({ processed: results });
});
