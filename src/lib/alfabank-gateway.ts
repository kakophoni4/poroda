/**
 * Два типа интеграции «Альфа» в проекте:
 * - `all2pay` — JSON на `api*.all2pay.net/v1/register.do` (callbackUrl в теле JSON).
 * - `rbs` — классический REST Альфы (`alfa.rbsuat.com/payment/rest/...`): register.do ожидает
 *   `application/x-www-form-urlencoded`, колбек — параметр `dynamicCallbackUrl`, не `callbackUrl`.
 */
export type AlfabankGatewayKind = "all2pay" | "rbs";

export function getAlfabankGateway(baseUrl: string): AlfabankGatewayKind {
  const u = (baseUrl || "").toLowerCase();
  if (u.includes("all2pay.net")) return "all2pay";
  return "rbs";
}
