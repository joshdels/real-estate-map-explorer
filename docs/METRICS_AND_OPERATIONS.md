# Metrics and Operations

## Metric definitions

### Registered user

A unique account with a confirmed contact method. Duplicate, test, staff, and obvious spam accounts are excluded from growth reporting.

### Monthly active user

A registered user who performs at least one meaningful action during the month: runs a search, opens a property detail, saves or compares a property, updates a listing, or submits or responds to an inquiry.

### Current listing

A published listing that:

- passed the applicable review;
- has an accountable advertiser;
- includes the minimum required fields;
- has not expired; and
- had availability reconfirmed within the previous 30 days.

### Sufficiently documented listing

A current listing with purpose, property type, full asking price and currency, municipality, safe public location, lot or floor area where applicable, representative media, advertiser relationship, and verification status. Optional facts must not be presented as required facts.

### Qualified buyer action

A non-spam action showing meaningful property intent: a complete inquiry, a viewing request, a saved property accompanied by contact intent, or a confirmed conversation with the advertiser.

### Supply partner

An owner, professional, agency, or institution responsible for at least one current listing and capable of responding to inquiries.

## Weekly scorecard

Review the following every Monday:

| Area | Metric |
| --- | --- |
| Supply | New, published, suspended, expired, and reconfirmed listings |
| Quality | Listings missing core fields; duplicate reports; correction requests |
| Demand | New users; active users; searches; property-detail views |
| Intent | Saves; comparisons; complete inquiries; viewing requests |
| Responsiveness | Median first-response time; unanswered inquiries after 24 hours |
| Revenue | Assisted services sold; field services sold; recurring revenue |
| Safety | Abuse reports; privacy requests; unauthorized-listing complaints |
| Reliability | Application errors; failed writes; provider fallbacks; unavailable media |

Do not publish public market statistics until sample size, methodology, and limitations are documented.

## Initial funnel

Measure this sequence by acquisition channel:

1. Visitor arrives.
2. Visitor searches or moves the map.
3. Visitor opens a property.
4. Visitor saves, compares, or begins an inquiry.
5. Visitor submits a complete inquiry.
6. Advertiser responds.
7. A viewing or substantive conversation occurs.
8. Listing outcome is reported.

The first optimization target is the weakest trustworthy transition, not the largest page-view number.

## Service standards

### Listing review

- Acknowledge a complete submission within one business day.
- Identify missing information rather than silently rejecting it.
- Do not publish until identity and authority requirements are satisfied.
- Record the reviewer, decision, reason, and date.

### Inquiries

- Notify the advertiser immediately when possible.
- Remind the advertiser when an inquiry has no response after 12 hours.
- Escalate or suspend chronic non-response.
- Never sell the same inquiry to unrelated advertisers without explicit buyer consent.

### Availability

- Request reconfirmation before the 30-day deadline.
- Mark an overdue listing as “availability not recently confirmed.”
- Suspend it after the defined grace period.
- Preserve the record for audit and potential reactivation.

### Corrections and complaints

- Provide a visible reporting mechanism.
- Prioritize privacy, impersonation, unauthorized listing, and payment-fraud reports.
- Preserve evidence while limiting unnecessary access to personal data.
- Record the outcome and notify affected parties when appropriate.

## Minimum listing data

Required for publication:

- stable listing ID;
- sale or rent purpose;
- listing status;
- title and property type;
- full asking price and currency;
- safe public coordinates and human-readable location;
- applicable floor or lot area and unit;
- representative images;
- advertiser relationship to the property;
- availability-confirmation date; and
- created and updated timestamps.

Conditionally required:

- bedrooms and bathrooms for residential homes;
- rental period and major restrictions for rentals;
- development and project information for project inventory;
- authority documentation when the advertiser is not the owner.

Optional information includes description, amenities, approximate boundary, panorama, aerial video, and walkthrough video. Remote media must use permitted HTTP(S) URLs and privacy-conscious embedding.

## Data and privacy rules

- Collect only information required for the defined workflow.
- Do not expose submitted identity documents publicly.
- Do not publish private seller contact information without explicit consent.
- Do not publish an exact residential location when authorization or safety is uncertain.
- Maintain retention and deletion rules for rejected listings and identity evidence.
- Restrict staff access according to operational need.
- Keep production credentials out of the repository and client-visible configuration.

## Experiment register

Every growth experiment should record:

- hypothesis;
- target user group;
- start and end dates;
- acquisition channel;
- cost and staff time;
- primary success metric;
- safety or quality constraint;
- outcome; and
- decision to stop, revise, or scale.

Recommended initial experiments:

1. Assisted onboarding versus self-service onboarding completion.
2. Municipality-specific inventory post versus a generic province post.
3. Boundary and road-access presentation versus standard photo-only presentation.
4. Thirty-day availability confirmation versus an undated availability label.
5. Owner referral reward versus professional referral placement credit.

## Expansion dashboard

Expansion requires two consecutive months meeting all of these thresholds:

| Measure | Threshold |
| --- | ---: |
| Current listings | 40 |
| Qualified buyer actions per month | 10 |
| Median advertiser response | Under 24 hours |
| Monthly availability reconfirmation | At least 70% |
| Accountable local supply partners | At least 1 |
| Unresolved high-priority safety reports | 0 |

