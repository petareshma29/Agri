# Security Specification: AgriRaksha Firestore Security Rules

## 1. Data Invariants
- A crop cannot be registered without a valid farmer ID.
- A scan cannot be saved without an associated farmer ID and verified crop/condition details.
- Feedback must include a valid rating (1-5), topic, and non-empty message.
- Alerts and Market Rates can only be created or modified by administrators.
- Sensitive user information (e.g. Aadhaar) must be protected; unauthenticated blanket reads are strictly denied.
- All IDs must match alphanumeric format and length constraints.

## 2. Dirty Dozen Threat Payloads
1. **Ghost Field / Shadow Update:** Injected `isAdmin: true` into farmer profile document.
2. **Identity Spoofing:** Creating a crop record with `farmer_id` pointing to another user.
3. **Denial of Wallet:** Injecting a 2MB string into `message` or `title`.
4. **Invalid Rating:** Injecting `rating: 99` or `rating: -5` into feedback collection.
5. **ID Poisoning:** Injecting `../../root` or junk symbols into document ID.
6. **Unauthorized Alert Creation:** Non-admin attempting to publish system-wide emergency alerts.
7. **Market Rate Manipulation:** Non-admin altering market rates in `/marketRates`.
8. **Unverified Timestamp Spoofing:** Sending fabricated historical `created_at` values.
9. **Blanket Query Scraping:** Attempting unauthenticated collection list operations on farmers or scans.
10. **Crop Stage Escalation:** Bypassing state flow to force-modify crop stage arbitrarily.
11. **Negative Price Attack:** Setting commodity rate to negative value in marketRates.
12. **Admin Role Self-Assignment:** Unauthenticated actor writing to `/admins/{adminId}`.

## 3. Defense Verification
All threat payloads are checked against ABAC functions and rejected with PERMISSION_DENIED.
