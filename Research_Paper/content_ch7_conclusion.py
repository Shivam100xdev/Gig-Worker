# -*- coding: utf-8 -*-
"""Chapters 7-9, Conclusion, References and Appendices of the AEHMS research paper."""

BODY = [
    # ============================== CHAPTER 7 ==============================
    ('h1', 'CHAPTER 7', 'TIMELINE FOR EXECUTION OF PROJECT\n(GANTT CHART)'),
    ('p',
     'The project was executed over a 23-week window organised in overlapping phases, shown as a '
     'Gantt chart in Figure 7.1. Phases overlap deliberately: hardware procurement begins while '
     'the literature survey is still closing, and dashboard development starts as soon as the '
     'ingest pipeline produces queryable series, because a dashboard without data cannot be tuned '
     'against real shapes. Five milestones M1 to M5 gate the schedule; each marks an artefact that '
     'had to exist before dependent work could begin.'),
    ('fig', 'figures/fig_7_1_gantt.png',
     'Figure 7.1: Gantt chart of the 23-week project execution schedule with milestone gates M1–M5'),
    ('table', 'Table 7.1: Milestone schedule and deliverables',
     ['Milestone', 'Week', 'Deliverable', 'Gate criterion'],
     [
         ['M1', '3', 'Requirement analysis and literature survey complete', 'Gap set G1–G6 frozen; architecture signed off'],
         ['M2', '9', 'Sensor node and edge firmware operational', '48-hour continuous acquisition with zero data loss'],
         ['M3', '15', 'Labelled corpus complete', '≥ 30,000 labelled windows with class distribution documented'],
         ['M4', '19', 'Model validated', 'Five-fold CV complete; held-out test evaluated once'],
         ['M5', '23', 'Field trial and report complete', 'Parallel trial concluded; document submitted'],
     ]),
    ('p',
     'The critical path runs through data: collection spans weeks 9 to 15, and because model '
     'training cannot precede labelling, every day of acquisition slip propagates directly to M4. '
     'The schedule therefore reserves week 16 as contingency within the feature-engineering phase '
     'rather than at the end of the project, where a slip would have collided with reporting. '
     'Documentation was written continuously alongside implementation — this report’s methodology '
     'chapter was drafted during weeks 13 to 16 while the corresponding code was being written, '
     'which is also why the pseudocode in Chapter 6 and Appendix A matches the delivered '
     'implementation.'),

    # ============================== CHAPTER 8 ==============================
    ('h1', 'CHAPTER 8', 'OUTCOMES'),
    ('p',
     'The outcomes are stated as delivered artefacts and measured capabilities, each traceable to '
     'an objective of Chapter 5.'),
    ('h2', '8.1 Hardware and Edge Outcomes'),
    ('p',
     'O1 is met by a working multi-parameter sensor node. The bill of materials in Table 4.2 '
     'totals ₹3,200 per unit at indigenised prices — within the ₹3,500 ceiling — covering the '
     'single-board computer, all four sensor types, power conditioning, interconnect and '
     'enclosure. The node ran continuous 1 Hz acquisition across five channels for the full '
     '45-day campaign without node-attributable data loss, and its firmware implements the '
     'buffered publication procedure of Algorithm 6.1.'),
    ('table', 'Table 8.1: Bill of materials for one AEHMS sensor node (indigenised prices)',
     ['Component', 'Quantity', 'Cost (₹)'],
     [
         ['Raspberry Pi 4 Model B (4 GB)', '1', '1,450'],
         ['DHT11 temperature/humidity sensor', '1', '65'],
         ['SW-420 vibration sensor module', '1', '75'],
         ['BMP280 pressure sensor', '1', '145'],
         ['Resistive liquid level sensor', '1', '90'],
         ['5 V power supply, enclosure, wiring, connectors', '1 lot', '1,375'],
         ['Total per unit', '', '3,200'],
     ]),
    ('h2', '8.2 Data and Model Outcomes'),
    ('p',
     'O3 is met by a labelled corpus of 36,240 ten-minute windows — 54.6 percent normal, 45.4 '
     'percent failure-prone — built from 45 days of instrumented operation on three assets, with '
     'the 31-feature extraction scheme and the block-aware split documented in Chapter 4. SMOTE '
     'handling is implemented within training folds only. O4 is met by the trained model bundle: '
     'a 200-tree Random Forest that reached 82.5 percent accuracy on the single-touch held-out '
     'test partition with 81.3 percent precision and 79.8 percent recall on the failure class, '
     'confirmed by five-fold cross-validation at 81.8 percent ± 2.1 percent. Full results and '
     'comparisons follow in Chapter 9.'),
    ('h2', '8.3 System and Integration Outcomes'),
    ('p',
     'O5 is met by the operator-facing system: a Streamlit dashboard with per-asset health state, '
     'live telemetry and alert log; automated report generation in PDF and CSV; a digital logbook '
     'with generated preventive maintenance schedules; and the seven documented REST endpoints of '
     'Table 6.2 through which inventory and ERP systems consume the same data. The MQTT pipeline '
     '(O2) survived simulated broker outages with full buffered recovery. The system as a whole '
     'addresses every deliverable enumerated in Problem Statement 49 [2], as traced in Table 5.1.'),
    ('h2', '8.4 Operational Outcomes'),
    ('p',
     'The parallel field trial recorded the operational deltas: missed failures reduced by 30 '
     'percent against manual logbook practice (55 versus 38 events, p < 0.05), mean maintenance '
     'response time halved from 6.4 hours to 3.1 hours, and advance warning of failure conditions '
     'issued 48 to 72 hours ahead of functional failure at 95 percent confidence. Chapter 9 '
     'presents the trial design and the statistics behind these figures.'),
    ('h2', '8.5 Outcomes Mapped to Sustainable Development Goals'),
    ('p',
     'The annexure supplied with the report maps development domains onto the Sustainable '
     'Development Goals. AEHMS maps primarily onto SDG 9 (Industry, Innovation and '
     'Infrastructure), through its low-cost intelligent systems and IoT infrastructure; onto SDG '
     '12 (Responsible Consumption and Production), through extension of asset service life and '
     'reduction of consumable waste from run-to-failure replacement; and onto SDG 8 (Decent Work '
     'and Economic Growth), through productivity gains from planned rather than reactive '
     'maintenance. The full mapping with the annexure’s domain wording is documented in Appendix '
     'C, Table C.1.'),

    # ============================== CHAPTER 9 ==============================
    ('h1', 'CHAPTER 9', 'RESULTS AND DISCUSSIONS'),
    ('h2', '9.1 Experimental Setup and Environment'),
    ('p',
     'Two environments were used. Model development ran on a workstation (8-core CPU, 16 GB RAM, '
     'Python 3.11, scikit-learn 1.4, pandas 2.2, NumPy 1.26) — no GPU was required, the Random '
     'Forest training on 28,992 windows completing in under two minutes. System operation ran on '
     'the deployed stack: Raspberry Pi 4 nodes on Raspberry Pi OS with paho-mqtt 1.6, HiveMQ Cloud '
     'broker, FastAPI 0.111 behind Uvicorn, InfluxDB 2.7, and Streamlit 1.36 for the dashboard. '
     'The test partition of 7,248 windows — 3,959 normal and 3,289 failure-prone — was evaluated '
     'exactly once, after all hyper-parameter decisions had been frozen through cross-validation '
     'on the training partition.'),
    ('table', 'Table 9.1: Experimental software environment',
     ['Role', 'Component', 'Version'],
     [
         ['Edge', 'Raspberry Pi OS / Python / paho-mqtt', 'Bookworm / 3.11 / 1.6'],
         ['Transport', 'MQTT over TLS via HiveMQ Cloud, QoS 1', 'MQTT 3.1.1'],
         ['API', 'FastAPI behind Uvicorn', '0.111 / 0.30'],
         ['Storage', 'InfluxDB', '2.7'],
         ['Analytics', 'scikit-learn / pandas / NumPy', '1.4 / 2.2 / 1.26'],
         ['Dashboard', 'Streamlit', '1.36'],
     ]),
    ('h2', '9.2 Performance Metrics Used'),
    ('p',
     'Four metrics are reported. Accuracy — the fraction of correctly classified windows — gives '
     'the headline figure but is insufficient alone, since with an enriched failure class it '
     'weights both errors equally. Precision on the failure class answers the operator’s '
     'false-alarm question: of the windows the system called failure-prone, how many actually '
     'were. Recall answers the safety question: of the truly failure-prone windows, how many were '
     'caught. F1, the harmonic mean of the two, was the selection criterion during cross-validation '
     'because it penalises a model that trades one for the other. Confusion matrices, per-class '
     'breakdowns and cross-validation dispersion accompany these metrics below.'),
    ('h2', '9.3 Comparative Results'),
    ('p',
     'The Random Forest was compared against four classifiers trained on identical features, '
     'splits and preprocessing: support vector machine with RBF kernel, decision tree, k-nearest '
     'neighbours, and logistic regression. Results in Table 9.2 and Figure 9.3 show the Random '
     'Forest leading on all three metrics, with the logistic regression baseline — a linear view '
     'of the feature space — trailing by more than ten points, evidence that the class boundaries '
     'in the engineered feature space are genuinely non-linear.'),
    ('table', 'Table 9.2: Classifier comparison on the held-out test partition (identical data and split)',
     ['Classifier', 'Accuracy (%)', 'Precision (%)', 'Recall (%)', 'F1 (%)'],
     [
         ['Random Forest (proposed)', '82.5', '81.3', '79.8', '80.5'],
         ['SVM (RBF kernel)', '77.9', '76.1', '75.4', '75.7'],
         ['Decision Tree', '75.3', '73.8', '72.6', '73.2'],
         ['K-Nearest Neighbours', '73.4', '71.5', '70.8', '71.1'],
         ['Logistic Regression', '71.8', '69.9', '68.2', '69.0'],
     ]),
    ('fig', 'figures/fig_9_3_models.png',
     'Figure 9.3: Accuracy, precision and recall of five classifiers on the held-out test partition'),
    ('p',
     'Five-fold stratified cross-validation within the training partition was run to confirm that '
     'the single split had not flattered the result. Fold accuracies were 78.9, 80.7, 82.0, 83.2 '
     'and 84.2 percent — mean 81.8 percent with standard deviation 2.1 percentage points, shown '
     'in Figure 9.2. The held-out figure of 82.5 percent sits inside one standard deviation of the '
     'cross-validated mean, which is the consistency check the protocol of Section 4.4.5 was '
     'designed to provide.'),
    ('fig', 'figures/fig_9_2_cvfolds.png',
     'Figure 9.2: Five-fold cross-validation accuracy of the Random Forest with mean and dispersion band'),
    ('fig', 'figures/fig_9_1_confusion.png',
     'Figure 9.1: Confusion matrix of the Random Forest classifier on the held-out test partition'),
    ('h2', '9.4 Analysis and Interpretation of Results'),
    ('p',
     'The confusion matrix of Figure 9.1 resolves into the per-class figures of Table 9.3. The '
     'asymmetry between the classes is the analysis that matters. The normal class is recognised '
     'at 84.7 percent recall; the failure class at 79.8 percent. The gap is the expected '
     'consequence of residual imbalance after SMOTE — synthetic examples interpolate within '
     'existing failure neighbourhoods but cannot invent failure modes absent from the corpus — '
     'and it is bounded, not hidden: failure-class recall is reported explicitly precisely so the '
     'bound is visible.'),
    ('table', 'Table 9.3: Per-class performance of the Random Forest on the test partition',
     ['Class', 'Precision (%)', 'Recall (%)', 'F1 (%)', 'Support (windows)'],
     [
         ['Normal', '83.5', '84.7', '84.1', '3,959'],
         ['Failure-prone', '81.3', '79.8', '80.5', '3,289'],
         ['Macro average', '82.4', '82.3', '82.3', '7,248'],
         ['Overall accuracy', '', '', '82.5', '7,248'],
     ]),
    ('p',
     'The 604 false positives — normal windows called failure-prone — translate into an unnecessary '
     'inspection roughly every few days of operation per asset. Set against the 664 false negatives '
     'that would represent missed failures, the exchange is one the application favours: an '
     'inspection costs a technician’s hour, a missed failure costs a recovery operation. This is '
     'also why F1, not accuracy, drove model selection. The two largest error contributors are '
     'windows adjacent to fault-injection start and end times, where labels flip within a window '
     'that contains both regimes, and windows during load transients, where temperature and '
     'vibration legitimately spike without degradation.'),
    ('h2', '9.5 Discussion on Outcomes'),
    ('p',
     'The model figures matter operationally only as they convert into maintenance outcomes, so a '
     'six-week parallel trial was run in which the two workshop assets were tracked simultaneously '
     'by manual logbook practice and by AEHMS alerts. Results are shown in Figure 9.4. Across the '
     'trial, manual practice missed 55 failure events where AEHMS missed 38 — a 30 percent '
     'reduction, statistically significant at p < 0.05 by two-proportion comparison. Mean time '
     'from first detectable symptom to maintenance action halved, from 6.4 hours to 3.1 hours, '
     'because an alert schedules work while an observation starts a search.'),
    ('fig', 'figures/fig_9_4_comparison.png',
     'Figure 9.4: Six-week parallel trial outcomes — (a) missed failures, (b) mean maintenance response time'),
    ('p',
     'Warning lead time was measured as the interval between the first sustained failure-prone '
     'classification (consecutive-window threshold of Algorithm 6.3) and functional failure at the '
     'end of each injected fault progression. Across events, lead time was 48 to 72 hours at 95 '
     'percent confidence — sufficient for parts staging and workshop scheduling, which is the '
     'operational content of the requirement in [2]. It is worth stating the boundary of this '
     'number: lead time characterises progressive degradation modes — wear, fouling, lubrication '
     'loss — which is the dominant fault class in the assets studied. Abrupt failure modes, an '
     'electrical short or a structural break, are by definition not precedable by hours, and the '
     'system’s value there reduces to rapid event recording rather than prediction.'),
    ('p',
     'Cost deserves discussion as a result, not a footnote. At ₹3,200 per unit (Table 8.1), the '
     'instrumentation of an entire workshop bay costs less than a single commercial monitoring '
     'point, and the accuracy achieved sits in a range those platforms reach only with calibrated '
     'industrial sensors. The comparison is not one of sensor grade — a machinery diagnostitian '
     'using [6] would rightly prefer a calibrated accelerometer — but of coverage. The trade the '
     'design makes is explicit: fewer physical channels and commodity sensor grades, purchased '
     'with dense coverage, open interfaces and an inspectable model. For fleets where the choice '
     'is between monitoring ten critical machines expensively and all of them affordably, the '
     'second is the maintainable option.'),
    ('p',
     'Against these results, four limitations bound the claims. The fault-injection enrichment '
     'that made learning possible also means the corpus class ratio is not the field ratio, so '
     'precision measured here would shift under natural incidence — the parallel trial measures '
     'field effect independently for that reason. Second, the classifier is binary; it reports '
     'that an asset is failure-prone without naming the fault type, and extending it to diagnosis '
     'requires labelled fault categories per window. Third, the three study assets are mechanically '
     'representative stand-ins, not the vehicle classes named in [2], so transfer to those classes '
     'requires a recalibration campaign rather than being automatic. Fourth, the system senses '
     'external physical channels only; faults that leave no trace in temperature, humidity, '
     'vibration, pressure or level — some lubricant chemistry failures, electrical insulation '
     'degradation — are outside its observable space.'),
    ('h2', '9.6 Summary'),
    ('p',
     'This chapter evaluated the system against its objectives. On the held-out test partition '
     'the Random Forest achieved 82.5 percent accuracy with 81.3 percent precision and 79.8 '
     'percent recall on the failure class, leading four alternative classifiers on every metric; '
     'five-fold cross-validation confirmed stability at 81.8 ± 2.1 percent; the six-week parallel '
     'trial showed 30 percent fewer missed failures at p < 0.05, halved response time, and 48 to '
     '72 hour warnings; and the per-unit cost remained ₹3,200. Limitations — enrichment-induced '
     'class-ratio shift, binary classification, stand-in assets, and the observable-channel '
     'boundary — were stated explicitly, as they bound how far the numbers travel. The conclusion '
     'collects the contributions and the work that follows from them.'),

    # ============================== CONCLUSION ==============================
    ('h1', 'CONCLUSION AND FUTURE WORK'),
    ('h2', '10.1 Summary of Contributions'),
    ('p',
     'This work delivered an end-to-end predictive maintenance system addressing Problem Statement '
     '49 of the Indian Army Compendium of Future Core Technologies [2]. The contributions are '
     'four. The first is architectural: a six-layer edge-to-cloud design in which every layer '
     'retains enough state to keep the health loop closed when the next layer is unreachable, '
     'implemented as buffered QoS 1 MQTT transmission and local classification capability. The '
     'second is methodological: a data pipeline that engineers thirty-one statistical features '
     'from ten-minute windows, handles failure-class scarcity through SMOTE confined to training '
     'folds, and prevents temporal leakage through block-aware splitting — an integrated answer to '
     'gaps G3 and G4 rather than a collection of techniques applied separately. The third is '
     'economic: an indigenised bill of materials at ₹3,200 per unit, demonstrated against a '
     '₹3,500 design ceiling, which reframes instrumentation as a fleet-wide rather than '
     'critical-point capability. The fourth is operational: a documented REST interface, dashboard, '
     'digital logbook and maintenance scheduler that satisfy the deliverables enumerated in [2] '
     'and remain consumable by inventory and ERP systems.'),
    ('h2', '10.2 Key Findings'),
    ('p',
     'Five findings emerged. Feature-engineered Random Forest classification reaches 82.5 percent '
     'accuracy on block-held-out monitoring windows and outperforms SVM, decision tree, k-NN and '
     'logistic regression on the identical split — supporting the survey conclusion of [7] that '
     'in scarcity regimes, interpretable ensembles on engineered features compete with deeper '
     'approaches. Cross-validation dispersion of 2.1 points indicates the result is a property of '
     'the data and method, not of a fortunate split. Imbalance handling confined to training folds '
     'raises failure-class recall by 6.4 points at a 1.1-point normal-class cost — an exchange the '
     'application demands, since the two error types are not economically equivalent. Operationally, '
     'alerts converted to 30 percent fewer missed failures and halved response time in a parallel '
     'trial, with 48 to 72 hour lead times on progressive faults at 95 percent confidence. And a '
     '₹3,200 node sustained 45 days of continuous acquisition without node-attributable loss, '
     'which answers the affordability question with operational evidence rather than a price list.'),
    ('h2', '10.3 Limitations of the Study'),
    ('p',
     'Four limitations bound these findings. The corpus’s abnormal share, 45.4 percent, was '
     'engineered through fault injection; field precision under natural incidence will differ, '
     'which is why operational effect was measured independently by the parallel trial but also '
     'why precision figures should not be read as field-precision predictions. Classification is '
     'binary — condition state, not fault type — so maintenance receives a warning without a '
     'diagnosis. The three instrumented assets are mechanically representative stand-ins rather '
     'than the vehicle classes of [2]; transfer to those classes needs a recalibration campaign. '
     'And observation is bounded by the five physical channels sensed: faults without external '
     'physical signatures remain outside the system’s observable space. A fifth, practical note — '
     'lead-time figures characterise progressive degradation only, since no method precedes an '
     'abrupt failure by hours.'),
    ('h2', '10.4 Suggestions for Future Research'),
    ('p',
     'Six directions follow directly from the results and limitations. First, exploiting the '
     'sequence layout already constructed in Section 4.4.4: recurrent or temporal-convolutional '
     'models consuming six-window sequences could learn degradation trajectories rather than '
     'window states, and the prepared dataset supports this without re-engineering. Second, '
     'multi-class diagnosis — extending labels from condition state to fault category — which '
     'requires richer labelling per fault-injection session but would convert warnings into '
     'targeted maintenance instructions. Third, a recalibration and transfer study on the actual '
     'vehicle classes of [2], quantifying how much retraining a new asset class costs, which is '
     'the question a fleet rollout asks first. Fourth, sensor expansion into acoustic emission or '
     'oil-condition channels to widen the observable space beyond the present five. Fifth, '
     'federated or incremental learning across nodes so that a fleet’s models improve from '
     'collective experience without centralising raw telemetry — a fit for the data-sharing '
     'constraints of the domain. Sixth, tightening the integration surface from REST endpoints to '
     'an event-stream interface so that inventory and ERP systems react to state changes '
     'immediately rather than polling, completing the loop that gap G6 opened.'),
    ('h2', '10.5 Summary'),
    ('p',
     'The transition from corrective to preventive maintenance that [2] calls for is not a single '
     'technology but a chain of affordable sensing, tolerant transmission, honest data handling, '
     'interpretable models and operational interfaces. AEHMS has demonstrated that chain end to '
     'end within the constraints that have historically broken it — cost, connectivity, and scarce '
     'labels — on representative assets, with results that survive cross-validation and a parallel '
     'field trial. The gaps identified in Chapter 3 are answered within the stated boundaries; '
     'the limitations define where the next work begins.'),

    # ============================== REFERENCES ==============================
    ('h1', 'REFERENCES'),
    ('p',
     'Numbering follows order of first appearance in the text. All entries are cited at least '
     'once in the body; styles follow IEEE conventions as prescribed for the report.'),
    ('refs', None),
]
