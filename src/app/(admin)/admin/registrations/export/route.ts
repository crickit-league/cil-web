import { auth } from "@/lib/auth";
import { ForbiddenError } from "@/lib/auth/permissions";
import { exportRegistrationsToExcel } from "@/lib/services/registrations";

// Route handlers don't pass through the admin layout's gate, so the check
// happens here (and again inside the service).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const workbook = await exportRegistrationsToExcel(session.user);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(workbook, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cil-registrations-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
}
