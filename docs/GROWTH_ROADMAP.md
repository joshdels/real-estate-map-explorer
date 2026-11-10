# Growth Roadmap

## Objective

Reach 100 registered users by December 31, 2026 while establishing a trustworthy supply base in one province. The goal is not 100 simultaneous users.

The desired first cohort is:

| Group | Target |
| --- | ---: |
| Property owners | 20 |
| Licensed brokers or accredited salespersons | 10 |
| Buyers and renters | 60 |
| Local or institutional partners | 10 |
| **Total** | **100** |

The year-end operating target is 40 monthly active users, 40 to 50 current real listings, and 25 qualified buyer inquiries.

## Phase 0: commercial readiness

**Timing:** before real inventory is publicly promoted

### Business work

- Choose one province and one to three neighboring municipalities.
- Name a single person accountable for listing approval and complaints.
- Complete owner, professional, and buyer interview scripts.
- Prepare advertiser terms, privacy notice, listing authorization, correction process, and verification explanations with legal review.
- Define the supported field-service area and travel rules.

### Product work

- Separate fictional demonstration data from production inventory.
- Implement production authentication and roles.
- Require server-side authorization and validation for mutations.
- Add listing ownership, advertiser relationship, verification facts, review dates, and availability dates.
- Add public location-precision controls.
- Add inquiry consent, abuse reporting, audit history, and listing expiration.
- Establish approved media storage, backup, monitoring, and recovery procedures.

### Exit gate

- Real data cannot be confused with fictional samples.
- Every public listing has an accountable advertiser.
- Unauthorized users cannot approve or mutate shared production data.
- Complaints and removal requests have an owner and response process.

## Phase 1: first 20 users and 15 listings

**Target timing:** November 10–23, 2026

### Acquisition

- Interview 10 owners, five professionals, and 10 prospective buyers.
- Recruit three founding professionals.
- Manually onboard 15 listings from authorized sources.
- Use direct outreach, local referrals, and municipality-specific Facebook groups.
- Offer assisted onboarding rather than requiring every owner to complete a complex form.

### Product learning

- Record missing information for every attempted listing.
- Observe buyers completing one property search on a phone.
- Track why users abandon a listing or inquiry.
- Test whether road access, boundaries, price, or nearby destinations most strongly affect contact intent.

### Exit gate

- 20 registered users
- 15 current listings
- Three supply partners
- Five qualified inquiries
- No listing without a responsible contact

## Phase 2: controlled public launch

**Target timing:** November 24–December 9, 2026

### Acquisition

- Publish province and municipality landing pages only for adequately supplied areas.
- Grow to at least 30 current listings.
- Invite 30 prospective buyers through partner and local networks.
- Publish a weekly affordable-property map post.
- Contact every new inquiry manually and measure the advertiser response.
- Begin selling Assisted Listing and Field Listing services.

### Product work

- Add high-value search filters: municipality, sale or rent, price, property type, and lot or floor area.
- Add listing comparison and saved searches.
- Display the last availability confirmation prominently.
- Add clear empty, no-results, loading, partial-data, offline, and provider-error states.
- Verify keyboard and mobile operation for the entire search-to-inquiry path.

### Exit gate

- 50 registered users
- 30 current listings
- 10 cumulative qualified inquiries
- Five viewing requests or confirmed advertiser conversations
- At least one paid listing service

## Phase 3: first 100 users

**Target timing:** December 10–31, 2026

### Acquisition

- Introduce the controlled referral program.
- Add 10 to 20 current listings.
- Hold one local property discovery session or live online map walkthrough.
- Publish a weekly inventory and availability summary.
- Recruit one local institutional or high-volume inventory partner.
- Give founding professionals free Pro access through February 2027.

### Product work

- Add professional profiles and inquiry status tracking.
- Add basic listing-performance analytics.
- Add duplicate and stale-listing review queues.
- Provide a fast listing reconfirmation workflow.
- Instrument the full acquisition and inquiry funnel.

### December 31 scorecard

| Metric | Minimum | Target |
| --- | ---: | ---: |
| Registered users | 75 | 100 |
| Monthly active users | 30 | 40 |
| Current listings | 35 | 40–50 |
| Verified supply partners | 5 | 8–10 |
| Qualified inquiries | 15 | 25 |
| Viewing requests or advertiser conversations | 5 | 10 |
| Paid assisted or field listings | 2 | 3–5 |
| Service revenue | PHP 3,000 | PHP 5,000–20,000 |

Missing 100 registrations is not failure if current inventory and qualified actions are strong. Reaching 100 through giveaways or inactive accounts is not success.

## 2027 scale stages

### Stage A: prove one local market

- Maintain at least 40 current listings for two consecutive months.
- Reach 10 qualified buyer actions per month.
- Keep median advertiser response below 24 hours.
- Achieve at least 70% monthly availability reconfirmation.
- Convert at least three professionals or agencies to paid plans.

### Stage B: deepen the province

- Expand into adjacent municipalities.
- Add bulk imports and team workflows.
- Build province-level inventory summaries without presenting asking prices as transaction data.
- Recruit local photographers and onboarding partners under documented quality standards.

### Stage C: enter a second province

- Use the expansion gate in `BUSINESS_PLAN.md`.
- Appoint an accountable local supply partner.
- Repeat interviews instead of assuming that the first province's behavior transfers.
- Seed supply before announcing the market publicly.

### Stage D: scalable marketplace

- Normalize production property, advertiser, inquiry, and verification data.
- Introduce reliable billing, entitlements, customer support, and fraud operations.
- Establish service-level expectations for institutional accounts.
- Test integrations only when manual workflows demonstrate repeat demand.

## Product priorities by stage

| Priority | 1–20 users | 21–100 users | 101–1,000 users |
| --- | --- | --- | --- |
| Trust | Manual review | Structured verification and expiry | Fraud operations and audit tooling |
| Supply | Assisted onboarding | Partner and referral acquisition | Bulk imports and partner APIs |
| Demand | Direct invitations | Local content and saved searches | SEO, partnerships, and paid acquisition tests |
| Revenue | Listing services | Listing services plus pilot subscriptions | Repeatable subscriptions and institutional plans |
| Data | Complete core fields | Funnel and availability analytics | Market-level quality reporting |

## Features explicitly deferred

Until repeat demand exists, do not prioritize:

- automated valuations;
- nationwide launch pages with no inventory;
- complex agent CRM functionality;
- transaction deposits or escrow;
- in-app mortgage approval;
- paid buyer access;
- auctions; or
- AI-generated property facts not supported by source data.

