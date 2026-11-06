# Privacy Policy (draft)

> Draft for the one product. Written in house, not reviewed by a lawyer. Not published: the live
> `/privacy` describes today's product until the switch-over. Blanks read `[[LIKE THIS]]`
> (`README.md`).

Effective [[EFFECTIVE DATE]]

This is written in plain English on purpose. If anything here is unclear, email
[[CONTACT EMAIL]] and a person will answer.

## Who we are, and whose data it is

Occupella is operated by [[LEGAL NAME]] ("Occupella", "we"). It is property management software
used by companies that manage rentals: their staff keep the books, and their owners, tenants,
applicants and vendors use the portals and pages those companies give them.

That makes two kinds of data:

- **The property management company's records** (its books, its people's details, their files
  and messages) belong to that company. We process them only to run Occupella for it, under our
  [Data Processing Agreement](/dpa). If you are a tenant, owner, applicant or vendor, your
  property manager decides what is kept about you; ask them first, and we will help them answer.
- **What we collect as ourselves:** the accounts of the companies that use Occupella and the
  people who sign in, this website's visitors, and our own billing. This policy is mostly about
  that, and about how we protect both.

## What we collect

- **Accounts:** names, email addresses and, for portal users, a phone number. Passwords are kept
  only as a one-way hash.
- **The books, for each company:** properties, units, leases, rent and charges, payments, owners'
  and vendors' details, bills, work orders, documents they upload, and the messages between them.
  Some of it is sensitive, and treated so:
  - bank account numbers for paying owners and vendors, and tax IDs (EIN or SSN), are sealed
    (encrypted) under a key only our servers hold; only their last four digits are ever shown,
    and only a company's admin can reveal a tax ID whole, each time logged;
  - tenants who pay online pay on Stripe's page, and we never see their bank account number;
  - applicants give what the company's application asks (contact details, current address,
    previous landlord and employer, an emergency contact, proof of income). The application never
    asks for a Social Security number or a date of birth, nor anything fair housing law protects.
- **Signatures:** when someone signs a lease on Occupella's signing page, we keep their typed name,
  any drawn signature, the time, their internet address and browser, and a fingerprint (SHA-256)
  of the document they signed, so the signature can be shown to be theirs.
- **Text consent:** when a tenant or owner agrees to receive texts, the exact words they agreed to
  and when. A phone number on file is not consent. Our [SMS Program & Consent](/sms) page has the
  rest.
- **Connected accounts (optional):** if your team connects Gmail, Google Calendar or Google
  Drive, access is granted through Google's consent screen via our sign-in provider (Composio),
  with the scopes the feature needs. We never see your Google password.
- **Usage and diagnostics:** product analytics and error reports that help us fix problems, kept
  apart for each company.
- **This website, before you have an account:** page views and clicks on the sign-up link. We
  don't record your session or capture what you type. If your browser sends a Do Not Track or
  Global Privacy Control signal, we collect nothing. We use Apollo to work out which business a
  visitor is from; your internet address is shared with them for that and they may set a cookie.
  It is not needed to use the site, and the **Do not track my visit** link in every page's footer
  turns it off.

## How the AI uses it

Occupella's AI reads a company's books and connected accounts to answer its team and to draft
work: an email, a notice, a work order, a note. What it drafts waits for a person on the team to
approve it. It can't move money: in the books, the database role it uses can read and propose
drafts, and nothing else. In the books it never reads people's contact details, notes,
applications, screenings, files or portal messages, nor logins, passwords or keys. In an account
a team connects, such as Gmail, it reads what the team asks it to work on.

We do not use any company's data to train AI models.

## How data is protected

- Each company's records are kept apart; every page and report is answered for the signed-in
  person's own company.
- Data travels encrypted (HTTPS), and our database provider encrypts it where it is stored.
- Trust records are never edited or deleted: corrections are new entries, and every change is in
  an audit log naming who made it.
- Sign-in sessions expire, repeated failed sign-ins are refused, and every request runs with only
  the rights its user holds.
- Backups: [[BACKUPS]].
- Data is stored and processed in [[DATA LOCATION]].

## Who else processes it

These service providers process data for Occupella, each only what it needs to do its job. The
list is kept current on this page and on [Security](/security), and a company is told
[[NOTICE DAYS]] days before a new one is added (the [Data Processing Agreement](/dpa)).

*(At publication: the shared list from `src/legal/subprocessors.tsx`, updated for the books.)*

## What we never do

- We never sell personal data.
- We never share mobile numbers or text consent with anyone for marketing.
- We never use a company's data for anything but running Occupella for it.

## How long we keep it

- **A company's books** are kept while its account is open. They are trust records, which the
  law requires the company to keep for years after; before leaving, a company can export all of
  them. After an account closes: [[RETENTION]].
- **Account and billing records** are kept as long as our own tax and legal duties require.
- **Website analytics** are kept for no longer than we need them to understand the site.

## Your rights

- **If you use Occupella through a property manager** (a tenant, owner, applicant or vendor), ask
  them to see, correct or delete what they keep about you. We will help them do it. Some records
  can't be deleted while the law requires them to be kept, such as the record of money held in
  trust for you.
- **For what we hold as ourselves**, you can ask to know what we have, to correct it or to delete
  it, and you won't be treated differently for asking. Email [[CONTACT EMAIL]]. Depending on where
  you live (California, for example), you may have further rights under your state's law, and you
  can use them the same way.
- You can switch off website tracking from the footer of any page, and stop texts at any time by
  replying STOP.

## Children

Occupella is for businesses and the adults they rent to. It is not meant for children under 13,
and we don't knowingly collect their data.

## Changes

If this policy changes materially, we'll say so here and email the admins of every company using
Occupella before it takes effect.

## Contact

[[LEGAL NAME]], [[MAILING ADDRESS]] · [[CONTACT EMAIL]]
