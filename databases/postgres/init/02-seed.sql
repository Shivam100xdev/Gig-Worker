-- Seed data for local development. Safe to re-run (idempotent).

-- Demo user created in schema.sql; reuse it.
DO $$
DECLARE demo_id UUID;
BEGIN
  SELECT id INTO demo_id FROM users WHERE mobile = '+919820000000';

  IF demo_id IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM platforms WHERE user_id = demo_id LIMIT 1) THEN
    WITH p AS (
      INSERT INTO platforms (user_id, name, category, has_records)
      VALUES (demo_id, 'Upwork', 'freelance', TRUE),
             (demo_id, 'Swiggy', 'food-delivery', TRUE)
      RETURNING id, name
    )
    INSERT INTO income_records (user_id, platform_id, income_amount, corresponding_tax,
      tax_deduction_source, payment_status, receipt_confirmed,
      work_start_date, work_end_date, tax_pay_deadline, client_name, client_email, source)
    SELECT demo_id, p.id,
           CASE p.name WHEN 'Upwork' THEN 320000.00 ELSE 148500.00 END,
           CASE p.name WHEN 'Upwork' THEN 32000.00  ELSE 0.00 END,
           CASE p.name WHEN 'Upwork' THEN 'client_tds' ELSE 'none' END,
           'paid', CASE p.name WHEN 'Upwork' THEN TRUE ELSE FALSE END,
           DATE '2025-04-01', DATE '2025-09-30', DATE '2026-03-15',
           CASE p.name WHEN 'Upwork' THEN 'Acme Corp' ELSE 'Swiggy Payouts' END,
           CASE p.name WHEN 'Upwork' THEN 'accounts@acme.com' ELSE 'payouts@swiggy.in' END,
           'manual'
    FROM p;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM reviews WHERE display_name = 'Demo Gig Worker') THEN
    INSERT INTO reviews (user_id, display_name, platform_name, rating, headline, body) VALUES
      (demo_id, 'Demo Gig Worker', 'Upwork', 5, 'Cleanest way to track freelance TDS',
       'Earlier I dug through Upwork invoices every March. Now each gig is one entry with the TDS already split out — my CA got a tidy summary instead of a folder of screenshots.'),
      (demo_id, 'Demo Gig Worker', 'Swiggy', 4, 'Finally know what I actually owe',
       'The live tax number while I log income is the killer feature. No more spreadsheet guesswork at deadline time.');
  END IF;
END $$;

INSERT INTO faqs (question, answer, sort_order)
SELECT * FROM (VALUES
  ('Is my PAN and income data safe here?',
   'Yes. Data is encrypted in transit, stored against your account in PostgreSQL, and nothing is shared with platforms. OTP login means no password to leak — only someone holding your phone can get in.', 1),
  ('I work across five apps. Do I add each one separately?',
   'Yes — add each platform once, then log income under it. The dashboard totals every platform together so your tax estimate is always the combined picture.', 2),
  ('What if a platform deducted TDS but I never got the certificate?',
   'Log the TDS as "Platform TDS". The app blocks a clean filing until you confirm the amount against the actual receipt (Form 16A / platform statement), which keeps your claimed credit honest.', 3),
  ('Can I just upload my bank statement instead of typing entries?',
   'Yes. Upload a PDF or image statement on the Import page; OCR extracts credit lines and proposes them as income entries. You accept or reject each one before anything touches your ledger.', 4),
  ('Do I need GST registration as a gig worker?',
   'Generally not below ₹20 lakh aggregate turnover for services, though interstate supply and certain categories differ. The app nudges you when you cross the threshold — check with a professional for your specific case.', 5),
  ('Which ITR form applies to me?',
   'Most gig workers file ITR-4 (presumptive, Section 44ADA) or ITR-3 (books of account). The in-app estimate is slab-based; the final computation is prepared from your entries at filing time.', 6),
  ('What are the actual deadlines I should care about?',
   'Advance-tax quarters (Jun 15, Sep 15, Dec 15, Mar 15) and the July 31 ITR filing deadline for non-audit cases. Connect Google Calendar and the app drops reminders for each as events.', 7),
  ('Is the tax number shown the final figure?',
   'No — it is a live slab-based estimate for feedback while you type. It does not yet model Section 44ADA presumptive taxation or Chapter VI-A deductions; the filed computation is authoritative.', 8),
  ('Can I export my data?',
   'Yes. Download a JSON summary of your return any time, and hand it to your CA. Exports include the full per-platform income and TDS breakup.', 9),
  ('What does the AI assistant know?',
   'It sees only your current session context — totals, filing status, checklist state — and answers questions about deadlines, TDS, GST thresholds and how to use the app. It never sees your raw bank statement.', 10)
) AS seed(question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = seed.question);
