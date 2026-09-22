import { decidePurchase, JevError } from "../../../lib/jev.server";
import { type PurchaseDecision, validatePurchaseContext } from "../../../lib/purchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecidePurchase = (context: Parameters<typeof decidePurchase>[0]) => Promise<PurchaseDecision>;

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function mapJevError(error: JevError): Response {
  switch (error.code) {
    case "configuration":
      return errorResponse(503, "SERVICE_UNAVAILABLE", "판단 서비스를 아직 설정할 수 없습니다.");
    case "timeout":
      return errorResponse(504, "UPSTREAM_TIMEOUT", "판단 서비스 응답이 지연되고 있습니다. 다시 시도해 주세요.");
    case "provider_auth":
      return errorResponse(503, "SERVICE_UNAVAILABLE", "판단 서비스를 현재 사용할 수 없습니다.");
    case "provider_rate_limit":
      return errorResponse(503, "SERVICE_BUSY", "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    case "invalid_response":
      return errorResponse(502, "INVALID_UPSTREAM_RESPONSE", "판단 서비스 응답을 처리할 수 없습니다.");
    case "provider_failure":
      return errorResponse(502, "UPSTREAM_FAILURE", "판단 서비스를 일시적으로 사용할 수 없습니다.");
  }
}

export function createDecisionPost(decide: DecidePurchase = decidePurchase) {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다.");
    }

    const input = validatePurchaseContext(body);
    if (!input.success) {
      return errorResponse(400, "INVALID_INPUT", "입력값을 확인해 주세요.");
    }

    try {
      const decision = await decide(input.data);
      return Response.json(decision, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof JevError) return mapJevError(error);
      return errorResponse(502, "UPSTREAM_FAILURE", "판단 서비스를 일시적으로 사용할 수 없습니다.");
    }
  };
}

export const POST = createDecisionPost();
