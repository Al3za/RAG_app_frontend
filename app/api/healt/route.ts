export async function GET() {
  // per evitare cold start
  return Response.json({ status: "uptimeRobot MVP app ok" });
}
