# Production verification — P1 release (2026-08-20)

**Worker URL:** `https://open-finish-cloudflare.dgt-saunin.workers.dev`

**Worker version:** `d93c8216-e4df-4efe-890c-88c660e73494`

## Result

The P1 frontend release was published through the technical Cloudflare API channel with IPv4 preference. No Cloudflare Dashboard or CAPTCHA flow was used.

| Check | Result |
| --- | --- |
| Production root URL | Served the Open Finish private workspace password-gate. |
| Browser visual check | Confirmed the expected “Continue your line” login screen and workspace password input. |
| `GET /api/healthz` without session | Returned `401`, confirming the protected API is not publicly readable. |
| API response headers | `Cache-Control: no-store`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` were present. |
| Neon data | Not read, changed, or migrated during this verification. |

The production check deliberately stopped before entering the workspace password. It verifies the public security boundary only and does not create, modify, or delete any application data.
