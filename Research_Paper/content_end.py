# -*- coding: utf-8 -*-
"""References and Appendices A-C of the AEHMS research paper.

REFERENCES are stored as a dict: citation key -> (ieee_entry, short_label).
The builder numbers them by first {{key}} appearance in the body text and
warns if any entry is never cited or cited out of order of availability.
"""

REFERENCES = [
    ('army',
     'Indian Army, “Compendium of Future Core Technologies,” Army Design Bureau, '
     'Indian Army, New Delhi, India, 2022.',
     'Indian Army Compendium'),
    ('iso17359',
     'ISO 17359:2018, “Condition monitoring and diagnostics of machines — General '
     'guidelines,” International Organization for Standardization, Geneva, '
     'Switzerland, 2018.',
     'ISO 17359:2018'),
    ('iso13374',
     'ISO 13374:2006, “Condition monitoring and diagnostics of machines — Data '
     'processing, communication and presentation,” International Organization for '
     'Standardization, Geneva, Switzerland, 2006.',
     'ISO 13374:2006'),
    ('cbmplus',
     'U.S. Department of Defense, “Condition Based Maintenance Plus (CBM+) '
     'Implementation Guide,” Office of the Under Secretary of Defense for '
     'Acquisition and Sustainment, Washington, DC, USA, 2017.',
     'DoD CBM+ Guide'),
    ('jardine',
     'A. K. S. Jardine, D. Lin, and D. Banjevic, “A review on machinery diagnostics '
     'and prognostics implementing condition-based maintenance,” Mech. Syst. Signal '
     'Process., vol. 20, no. 7, pp. 1483–1510, 2006.',
     'Jardine et al.'),
    ('gubbi',
     'J. Gubbi, R. Buyya, S. Marusic, and M. Palaniswami, “Internet of Things (IoT): '
     'A vision, architectural elements, and future directions,” Future Gener. Comput. '
     'Syst., vol. 29, no. 7, pp. 1645–1660, 2013.',
     'Gubbi et al.'),
    ('shi',
     'W. Shi, J. Cao, Q. Zhang, Y. Li, and L. Xu, “Edge computing: Vision and '
     'challenges,” IEEE Internet Things J., vol. 3, no. 5, pp. 637–646, 2016.',
     'Shi et al.'),
    ('randall',
     'R. B. Randall and J. Antoni, “Rolling element bearing diagnostics—A tutorial,” '
     'Mech. Syst. Signal Process., vol. 25, no. 2, pp. 485–520, 2011.',
     'Randall and Antoni'),
    ('lei',
     'Y. Lei, B. Yang, X. Jiang, F. Jia, N. Li, and A. K. Nandi, “Applications of '
     'machine learning to machine fault diagnosis: A review and roadmap,” Mech. Syst. '
     'Signal Process., vol. 115, pp. 251–271, 2019.',
     'Lei et al.'),
    ('si',
     'X. Si, W. Wang, C. Hu, and D. Zhou, “Remaining useful life estimation – A review '
     'on the statistical data driven approaches,” Eur. J. Oper. Res., vol. 206, no. 1, '
     'pp. 1–14, 2011.',
     'Si et al.'),
    ('mqtt',
     'OASIS, “MQTT Version 3.1.1,” OASIS Standard, 29 October 2014. [Online]. '
     'Available: http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html',
     'MQTT 3.1.1'),
    ('smote',
     'N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, “SMOTE: Synthetic '
     'minority over-sampling technique,” J. Artif. Intell. Res., vol. 16, pp. 321–357, '
     '2002.',
     'SMOTE'),
    ('rf',
     'L. Breiman, “Random forests,” Mach. Learn., vol. 45, no. 1, pp. 5–32, 2001.',
     'Random Forests'),
    ('sklearn',
     'F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” J. Mach. Learn. '
     'Res., vol. 12, pp. 2825–2830, 2011.',
     'scikit-learn'),
]

# Ordered so that first appearance in the text matches list order:
# Ch1 cites: army, iso17359, cbmplus, jardine (via methodology overview)
# Ch2 adds: iso13374, gubbi, shi, mqtt, randall, lei, si
# Ch4 adds: smote, rf, sklearn

BODY = [
    # ============================== APPENDIX A ==============================
    ('h1', 'APPENDIX-A', 'PSEUDOCODE'),
    ('p',
     'This appendix consolidates the complete pseudocode of the system beyond the three core '
     'algorithms of Chapter 6: edge sensing, cloud ingestion, the preprocessing pipeline, the '
     'dashboard query path, report generation, and the preventive maintenance scheduler. Notation '
     'follows the conventions of Chapter 6.'),
    ('h2', 'A.1 Sensor Acquisition Procedure'),
    ('p',
     'Procedure read_sensors(S)\n'
     'Input: sensor registry S = {(name, gpio_pin, type)}\n'
     '1  readings ← empty map\n'
     '2  for each (name, pin, type) in S:\n'
     '3      if type = dht:  (t, rh) ← dht_read(pin); on checksum failure retry twice, then skip\n'
     '4      if type = vibration: v ← digital_read(pin)          // comparator threshold output\n'
     '5      if type = pressure: p ← i2c_read(bmp280_addr, PRES_REG) / 256.0\n'
     '6      if type = level: lv ← adc_read(pin) / 4095.0        // normalised to [0,1]\n'
     '7      readings[name] ← {value, unit, quality: ok|retry|dropped}\n'
     '8  return readings with acquisition timestamp'),
    ('h2', 'A.2 Cloud Ingestion Procedure (FastAPI)'),
    ('p',
     'Procedure ingest(payload)   // POST /api/v1/ingest, FastAPI dependency-injected store\n'
     '1  schema-validate payload against TelemetryModel; reject 422 on violation\n'
     '2  require TLS client certificate and device token; reject 401 otherwise\n'
     '3  for each reading r in payload.readings:\n'
     '4      if r.quality = dropped: write to dead-letter series; continue\n'
     '5      if abs(r.value) > channel_bounds[r.name]: flag suspect, retain (capping happens downstream)\n'
     '6      write point (measurement=channel, tags={asset, node}, fields={value}, time=payload.ts)\n'
     '7  update asset last-seen index\n'
     '8  return 202 Accepted with accepted_count'),
    ('h2', 'A.3 Preprocessing and Window Assembly'),
    ('p',
     'Procedure build_windows(series, label_intervals, W = 10 min, stride)\n'
     '1  windows ← empty list\n'
     '2  for t in timeline with step stride:\n'
     '3      seg ← series[t : t+W]\n'
     '4      missing_rate ← count_missing(seg) / expected_samples(seg)\n'
     '5      if missing_rate > 0.05: drop segment; break any sequence chain; continue\n'
     '6      seg ← interpolate_gaps(seg, max_gap = 3 samples)\n'
     '7      seg ← clip(seg, fences)                        // fences fitted on training data only\n'
     '8      feats ← extract_31_features(seg)\n'
     '9      label ← interval_join(label_intervals, t..t+W)  // majority state within the window\n'
     '10     windows.append({feats, label, start: t})\n'
     '11 return windows'),
    ('h2', 'A.4 SMOTE Balancing Within a Training Fold'),
    ('p',
     'Procedure balance_fold(train_fold, k = 5)\n'
     '1  minority ← instances with label = failure-prone\n'
     '2  majority ← instances with label = normal\n'
     '3  if len(minority) ≥ len(majority): return train_fold unchanged\n'
     '4  need ← len(majority) − len(minority)\n'
     '5  for i in 1..need:\n'
     '6      x ← choose random instance from minority\n'
     '7      peers ← k nearest minority instances to x (Euclidean, scaled features)\n'
     '8      n ← choose random instance from peers\n'
     '9      gap ← uniform(0, 1)\n'
     '10     synth ← x + gap · (n − x)\n'
     '11     append synth with label failure-prone\n'
     '12 return augmented train_fold     // validation and test folds never enter this procedure'),
    ('h2', 'A.5 Preventive Maintenance Scheduler'),
    ('p',
     'Procedure generate_schedule(asset, horizon = 30 days)\n'
     '1  pm_rules ← load interval rules for asset class      // e.g. oil 250 h, filter 500 h\n'
     '2  runtime ← sum hours where health = normal over last 30 days\n'
     '3  for each rule r in pm_rules:\n'
     '4      due ← r.last_done + r.interval − runtime\n'
     '5      if due ≤ horizon: add task(asset, r.action, due, priority = r.priority)\n'
     '6  if open critical alert exists: add unscheduled task(priority = P0, due = now)\n'
     '7  if due task requires part: check inventory(part); if below safety stock: raise reorder flag\n'
     '8  publish schedule to /api/v1/schedule; append entries to digital logbook'),
    ('h2', 'A.6 Report Generation'),
    ('p',
     'Procedure generate_report(asset, period, format ∈ {pdf, csv})\n'
     '1  telemetry ← query series(asset, period)\n'
     '2  alerts ← query alerts(asset, period)\n'
     '3  stats ← {uptime_pct, alert_count, lead_time_median, mtbf_estimate}\n'
     '4  if format = csv: write frame(telemeletry + alerts) to /reports; return path\n'
     '5  render PDF: header, per-channel summary table, alert table, health-state timeline\n'
     '6  attach model bundle version and preprocessing hash for auditability\n'
     '7  store path in logbook entry; return 200 with download URL'),

    # ============================== APPENDIX B ==============================
    ('h1', 'APPENDIX-B', 'SCREENSHOTS'),
    ('p',
     'The screenshots below were captured from the running system during the 45-day acquisition '
     'campaign and the six-week parallel trial. Each corresponds to an interface or service '
     'described in Chapter 6.'),
    ('shot', 'Edge node MQTT session over TLS with QoS 1 acknowledgement', 'Figure B.1: Edge node MQTT session established over TLS'),
    ('shot', 'FastAPI interactive documentation at /docs showing the seven endpoints', 'Figure B.2: FastAPI OpenAPI documentation for the integration surface'),
    ('shot', 'InfluxDB explorer showing channel series for a monitored asset', 'Figure B.3: InfluxDB time-series explorer with per-channel telemetry'),
    ('shot', 'Streamlit dashboard: status strip, live telemetry and alert log', 'Figure B.4: AEHMS dashboard — live equipment health status'),
    ('shot', 'Alert raised by consecutive-window persistence rule with severity', 'Figure B.5: Alert notification with probability and lead time'),
    ('shot', 'Digital logbook view with maintenance entries', 'Figure B.6: Digital logbook entries for a monitored asset'),
    ('shot', 'Generated preventive maintenance schedule', 'Figure B.7: Automated preventive maintenance schedule generation'),
    ('shot', 'Generated PDF maintenance report', 'Figure B.8: Automated PDF maintenance report output'),
    ('shot', 'CSV export of telemetry and alerts', 'Figure B.9: CSV export of telemetry and alert history'),
    ('shot', 'Training notebook output: cross-validation scores and feature importances', 'Figure B.10: Model training output — cross-validation and feature importances'),
    ('shot', 'Network outage simulation: buffered recovery after broker reconnect', 'Figure B.11: Buffered publication draining after simulated broker outage'),

    # ============================== APPENDIX C ==============================
    ('h1', 'APPENDIX-C', 'ENCLOSURES'),
    ('h2', 'C.1 Publications and Certificates'),
    ('p',
     '1. Journal publication / conference paper presentation certificate / registration proof of '
     'all students (to be enclosed).\n'
     '2. Certificate(s) of any achievement or award won in any project-related event (to be '
     'enclosed, if applicable).\n'
     '3. Similarity Index / Plagiarism Check report clearly showing the percentage (to be enclosed '
     'after running the institutional check on the final document).'),
    ('h2', 'C.2 Mapping of the Project with the Sustainable Development Goals'),
    ('p',
     'The annexure supplied with the report specifies mapping domains through which information '
     'technology projects relate to individual Sustainable Development Goals of the United Nations '
     '2030 agenda. Table C.1 records how AEHMS maps onto the three goals whose annexure domains '
     'the project engages directly, quoting the domain wording of the annexure and stating the '
     'specific project element that realises it.'),
    ('table', 'Table C.1: Mapping of AEHMS onto the Sustainable Development Goals (per the supplied annexure)',
     ['SDG', 'Goal title', 'Mapping domain (annexure wording)', 'How AEHMS engages the domain'],
     [
         ['SDG 9', 'Industry, Innovation, and Infrastructure',
          'Development of intelligent systems, robotics, IoT, and scalable cloud infrastructures',
          'An intelligent IoT system built on low-cost edge nodes (sensor-to-cloud architecture of '
          'Figure 4.1) makes condition-based maintenance infrastructure scalable to fleets rather '
          'than single critical machines'],
         ['SDG 12', 'Responsible Consumption and Production',
          'Block-Chain for supply chain transparency, optimization algorithms for resource '
          'management',
          'Preventive maintenance replaces run-to-failure part consumption; optimised maintenance '
          'scheduling and spares inventory (Algorithm A.5) reduce material waste and extend asset '
          'service life'],
         ['SDG 8', 'Decent Work and Economic Growth',
          'Automation, digital platforms for remote work, and upskilling via online learning '
          'platforms',
          'Automated monitoring removes routine manual inspection, while the documented dashboard '
          'and API (Table 6.2) operate as a digital platform; maintenance staff shift from '
          'inspection to analysis'],
     ]),
    ('p',
     'A secondary alignment exists with SDG 13 (Climate Action), whose annexure domain covers '
     '“environmental monitoring systems using IoT sensors”: the same sensing and telemetry '
     'architecture applied to environmental channels would serve that goal without structural '
     'change. This is noted as an extension opportunity rather than a claim about the present '
     'system, which does not monitor environmental parameters.'),
    ('h2', 'C.3 Enclosure Summary'),
    ('table', 'Table C.2: Enclosure checklist',
     ['#', 'Enclosure', 'Status'],
     [
         ['1', 'Journal publication / conference paper certificate / registration proof', 'To be enclosed'],
         ['2', 'Achievement / award certificates in project-related events', 'To be enclosed, if applicable'],
         ['3', 'Similarity Index / Plagiarism Check report showing the percentage', 'To be enclosed after institutional check'],
         ['4', 'Details of mapping with the Sustainable Development Goals', 'Provided in Table C.1 above'],
     ]),
]
