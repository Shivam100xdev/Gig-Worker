# -*- coding: utf-8 -*-
"""Chapters 3-6 of the AEHMS research paper. Same block format as content_front.py."""

BODY = [
    # ============================== CHAPTER 3 ==============================
    ('h1', 'CHAPTER 3', 'RESEARCH GAPS OF EXISTING METHODS'),
    ('p',
     'This chapter isolates the gaps that the survey of Chapter 2 exposed. A gap is stated here '
     'only where two conditions hold: an identified body of work leaves the issue unresolved, and '
     'the unresolved issue constrains a requirement of Problem Statement 49 [2]. Six gaps, G1 '
     'through G6, satisfy both conditions. Each is described with its evidential basis, its '
     'practical consequence in the field, and the objective of this project that answers it.'),
    ('h2', '3.1 Gaps in Connectivity and Field Deployability'),
    ('h3', '3.1.1 Gap G1: Maintenance Systems Assume Continuous Connectivity'),
    ('p',
     'The standards stream [1], [5] and the platform stream [9] describe sensing, transmission and '
     'analysis as a continuous chain. None of them addresses what the chain does during a network '
     'outage, which in High Altitude Area and Tactical Battle Area conditions is not an exception '
     'but the normal state of the link. MQTT [11] offers quality-of-service levels and persistent '
     'sessions that can bridge short interruptions, yet surveyed implementations configure QoS 0 '
     'at the publisher and rely on an always-reachable broker. The consequence for a maintenance '
     'officer is silent data loss: windows of telemetry vanish exactly when conditions are worst, '
     'and the health model later trains on a record with systematic holes.'),
    ('h3', '3.1.2 Gap G2: Edge Nodes Collect but Do Not Decide'),
    ('p',
     'Shi et al. [10] argue that computation should move to the edge when bandwidth or latency '
     'constrains the application, and Gubbi et al. [9] place intelligence somewhere in the '
     'sensing-to-application path. The surveyed reference architectures leave the edge in a '
     'collection role: raw readings are forwarded and everything else happens in the cloud. On an '
     'unreliable link this means the operator loses visibility precisely when the link drops — the '
     'node itself cannot say whether the asset it watches is healthy. A closed loop that answers '
     '“is this machine safe right now?” locally, and defers learning to the cloud, is not supplied '
     'by any surveyed source.'),
    ('h2', '3.2 Gaps in Learning from Scarce, Imbalanced Data'),
    ('h3', '3.2.1 Gap G3: Failure Scarcity Is Acknowledged but Not Engineered Around'),
    ('p',
     'Both ML surveys [7], [8] name class imbalance as a pervasive obstacle: machines spend most '
     'of their lives healthy, so failure windows are rare, and a classifier can score high '
     'accuracy by ignoring them — precisely the class the whole system exists to detect. The '
     'literature proposes techniques such as over-sampling in isolation, but the surveyed systems '
     'do not present an engineered pipeline in which labelling policy, window construction, '
     'synthetic generation and evaluation metrics are designed together against the imbalance. '
     'Without that integration, reported accuracy on balanced benchmarks does not survive contact '
     'with field distributions.'),
    ('h3', '3.2.2 Gap G4: Evaluation Protocols Omit Temporal Integrity'),
    ('p',
     'Si et al. [8] and Lei et al. [7] treat run-to-failure histories as the substrate of '
     'prognostic evaluation. A subtler issue arises once data is windowed: overlapping windows '
     'drawn from the same time interval leak information across a naive train-test split, and '
     'inflated scores follow. The surveyed works rarely state how windowing interacts with '
     'splitting. For a project whose reported numbers must be defensible in front of a review '
     'panel, the evaluation protocol — split strategy, cross-validation, and the metrics reported '
     '— has to be specified as part of the method, not left to convention.'),
    ('h2', '3.3 Gaps in Affordability and Openness'),
    ('h3', '3.3.1 Gap G5: Cost of Instrumentation Excludes Fleet-Scale Adoption'),
    ('p',
     'Condition monitoring is standard practice in industry, and the reason it has not spread to '
     'every workshop bay is economic. Per-point commercial installations quoted between ₹40,000 '
     'and ₹1,50,000 concentrate monitoring on the most critical machines only, which inverts the '
     'purpose of preventive maintenance: faults on the unmonitored eighty percent are discovered '
     'correctively. The survey found no published design that treats a sub-₹3,500 per-unit cost '
     'envelope as a hard design constraint while retaining multi-parameter sensing and a real '
     'analytics layer.'),
    ('h3', '3.3.2 Gap G6: Closed Analytics Cannot Be Integrated or Audited'),
    ('p',
     'Commercial platforms implementing ISO 13374 [5] rarely expose their feature extraction or '
     'models. Two requirements of [2] follow directly from that closure. The first is integration: '
     'a digital logbook, an inventory system and an ERP platform must be able to read equipment '
     'state through documented interfaces, which a closed suite will not provide on the buyer’s '
     'terms. The second is trust: a maintenance officer acting on a warning needs to inspect what '
     'the system measured and why it concluded what it concluded. Neither auditability nor open '
     'interfaces appear together in any surveyed system.'),
    ('h2', '3.4 Summary of Research Gaps'),
    ('p',
     'Table 3.1 consolidates the six gaps with the requirement of [2] that each constrains and the '
     'objective of this project that answers it. The pattern across the rows is consistent: every '
     'gap is a boundary condition — connectivity, data scarcity, cost, openness — rather than a '
     'missing algorithm. That observation shaped the methodology of Chapter 4, in which the '
     'architecture and the learning pipeline are designed as a single response to all six.'),
    ('table', 'Table 3.1: Consolidated research gaps, constrained requirements, and answering objectives',
     ['Gap', 'Gap description', 'Constrained requirement from [2]', 'Answering objective'],
     [
         ['G1', 'Maintenance pipelines assume continuous connectivity and lose data on outages',
          'Reliable operation from field locations with intermittent links', 'O2 — QoS-aware MQTT pipeline with buffered edge transmission'],
         ['G2', 'Edge nodes collect data but make no local health decisions',
          'Operator visibility independent of cloud availability', 'O1/O4 — local inference capability on the edge node'],
         ['G3', 'Class imbalance is acknowledged in surveys but not engineered around end to end',
          'Dependable detection of rare failure windows', 'O3 — labelled dataset with explicit imbalance handling'],
         ['G4', 'Evaluation protocols rarely address window-level temporal leakage',
          'Defensible, reproducible performance figures', 'O4 — stratified splitting with documented cross-validation'],
         ['G5', 'Per-point instrumentation cost excludes fleet-scale adoption',
          'Affordable proliferation across assets', 'O1 — indigenised bill of materials below ₹3,500 per unit'],
         ['G6', 'Closed analytics block integration and audit by maintainers',
          'Digital logbook, inventory, and ERP integration', 'O5 — documented REST interfaces and inspectable model pipeline'],
     ]),

    # ============================== CHAPTER 4 ==============================
    ('h1', 'CHAPTER 4', 'PROPOSED METHODOLOGY'),
    ('h2', '4.1 Methodology Outline'),
    ('p',
     'The methodology answers all six gaps through one design principle: keep the loop closed at '
     'every layer. Each layer of AEHMS both performs its function and retains enough state to act '
     'if the next layer is unreachable. The edge node senses, summarises and can classify locally; '
     'the communication layer queues and retries; the storage layer is a time-series database with '
     'explicit retention; the analytics layer trains on engineered features with imbalance '
     'handling built into the pipeline; the presentation layer consumes a documented REST API that '
     'any other logistics system may also consume. Figure 4.1 shows the resulting six-layer '
     'architecture.'),
    ('fig', 'figures/fig_4_1_architecture.png',
     'Figure 4.1: Six-layer architecture of the proposed AEHMS, from perception to presentation'),
    ('p',
     'Operationally, the pipeline proceeds as follows. The perception layer acquires five channels '
     'at 1 Hz. The edge layer on a Raspberry Pi 4 serialises readings to JSON, maintains a local '
     'buffer, and publishes telemetry. The communication layer carries it over MQTT through a '
     'HiveMQ broker under TLS 1.2 with QoS level 1, guaranteeing at-least-once delivery. The '
     'processing layer validates payloads at a FastAPI ingest endpoint and writes points to '
     'InfluxDB. The analytics layer converts raw series into ten-minute statistical windows, '
     'extracts features, and applies the trained Random Forest classifier together with threshold '
     'rules for immediate alerting. The presentation layer renders live state, history, alerts and '
     'reports through Streamlit, and exposes read interfaces for external systems.'),
    ('h2', '4.2 Tools, Technologies, Platforms Used'),
    ('p',
     'Table 4.1 lists the technology choices with the rationale behind each. Selections were '
     'driven by three constraints stated in Chapter 1: operation on a single-board computer, '
     'tolerance of intermittent links, and zero licence cost.'),
    ('table', 'Table 4.1: Technology stack and justification',
     ['Layer', 'Technology', 'Justification'],
     [
         ['Edge hardware', 'Raspberry Pi 4 Model B (4 GB)', 'GPIO access, Python ecosystem, sufficient compute for local inference'],
         ['Sensing', 'DHT11, SW-420, BMP280, resistive level sensor', 'Multi-parameter coverage at minimal unit cost'],
         ['Edge runtime', 'Python 3.11, paho-mqtt', 'Mature libraries for acquisition and publish-subscribe messaging'],
         ['Messaging', 'MQTT over TLS, HiveMQ Cloud broker, QoS 1', 'Designed for constrained devices; at-least-once delivery over unreliable links'],
         ['Ingest API', 'FastAPI with Uvicorn', 'Async request handling, automatic schema validation, OpenAPI documentation'],
         ['Storage', 'InfluxDB 2.x time-series database', 'Native timestamp indexing, retention policies, downsampling for sensor streams'],
         ['Analytics', 'scikit-learn Random Forest, pandas, NumPy', 'Interpretable ensemble that trains reliably on modest engineered datasets'],
         ['Imbalance handling', 'SMOTE (synthetic minority over-sampling)', 'Addresses failure-class scarcity without discarding majority samples'],
         ['Dashboard', 'Streamlit', 'Python-native interactive dashboards without a separate front-end build'],
         ['Reporting', 'FPDF2, pandas CSV export', 'Automated PDF and CSV maintenance reports with no external service'],
     ]),
    ('h2', '4.3 Proposed Architecture'),
    ('p',
     'The architecture in Figure 4.1 is deliberately layered so that each boundary is a contract. '
     'Between perception and edge lies a sensor reading schema: channel name, value, unit, '
     'timestamp, asset identifier. Between edge and communication lies the MQTT topic namespace, '
     'structured as aehms/<asset_id>/<channel> for telemetry and aehms/<asset_id>/alert for '
     'status transitions, so that a broker subscription pattern gives per-asset isolation without '
     'any coordination logic. Between processing and analytics lies the InfluxDB measurement '
     'schema, and between analytics and presentation lies a versioned REST API. Each contract is '
     'independently testable, which is how the implementation of Chapter 6 was verified stage by '
     'stage.'),
    ('p',
     'Two architectural decisions deserve explicit justification. First, the choice of MQTT over '
     'HTTP: HTTP request-response assumes a client that can wait for an answer, whereas MQTT '
     'publish-subscribe allows the node to hand off a reading and continue, with the broker '
     'holding delivery responsibility and QoS 1 confirming at-least-once arrival. For a 1 Hz '
     'stream this also reduces connection overhead, since a persistent session reuses one TLS '
     'tunnel instead of negotiating headers per reading. Second, the choice of a time-series '
     'database over a relational one: health monitoring queries are overwhelmingly “give me this '
     'channel over that interval”, a pattern relational engines serve poorly at scale because '
     'every reading is a row, while InfluxDB indexes by time natively and enforces retention — '
     'raw high-rate data can be kept for a bounded period and downsampled thereafter without '
     'application logic.'),
    ('h2', '4.4 Data Collection and Preprocessing'),
    ('h3', '4.4.1 Data Source and Composition'),
    ('p',
     'Data for this project was collected through instrumented operation of three assets in the '
     'college workshop — two 5 kVA diesel generator sets and one motor-pump test rig — chosen as '
     'mechanically representative stand-ins for the vehicle and equipment class targeted by [2]. '
     'Each asset carried one AEHMS sensor node. Acquisition ran for 45 continuous days at 1 Hz '
     'per channel across five channels (temperature, relative humidity, vibration level, pressure, '
     'liquid level), producing 1440 minutes of readings per asset per day.'),
    ('p',
     'The composition of the corpus reflects a deliberate labelling strategy. Alongside normal '
     'operation, scheduled fault-injection sessions were conducted on all three assets — mounting '
     'misalignment, restricted coolant flow, clogged intake filtration, low lubrication, and '
     'loose-fixing induced vibration — under safe, reversible conditions. Fault conditions were '
     'therefore represented in the corpus far more densely than they occur in the field. This is '
     'intentional and is the direct countermeasure to gap G3: a corpus with the field’s natural '
     'class distribution would have contained too few failure windows to learn from at all.'),
    ('h3', '4.4.2 Feature Selection and Structuring'),
    ('p',
     'Raw 1 Hz readings are not presented to the classifier. Following the signal-processing '
     'evidence of [6], the pipeline aggregates readings into ten-minute windows and computes '
     'statistical features per window — level, dispersion, shape and trend — which are the '
     'quantities that carry defect information at a fraction of the data volume of raw waveforms. '
     'Thirty-one features per window are computed across the five channels plus derived terms; the '
     'full list appears in Table 4.2.'),
    ('table', 'Table 4.2: Statistical features extracted from each ten-minute window',
     ['Group', 'Channels', 'Features', 'Count'],
     [
         ['Level features', 'All five', 'Mean, minimum, maximum per channel', '15'],
         ['Dispersion features', 'All five', 'Standard deviation per channel', '5'],
         ['Shape features', 'Vibration', 'RMS, kurtosis, skewness', '3'],
         ['Trend features', 'Temperature, vibration, level', 'Slope (least-squares) per channel', '3'],
         ['Derived terms', 'Cross-channel', 'Mean-times-RMS coupling, thermal index, level drop flag', '3'],
         ['Temporal term', 'Window position', 'Hour-of-day cyclic encoding', '2'],
         ['', '', 'Total', '31'],
     ]),
    ('p',
     'Feature selection followed a two-pass procedure. First, features with near-zero variance '
     'across the corpus were discarded, as were features whose missing-value rate exceeded five '
     'percent. Second, the remaining features were ranked by random-forest impurity importance on '
     'the training partition, and any feature ranked below a cumulative one-percent contribution '
     'was removed. The procedure kept twenty-eight of the thirty-one computed features; the three '
     'retained-but-low-ranked terms are kept in the published pipeline so that feature sets remain '
     'comparable if the corpus is extended.'),
    ('h3', '4.4.3 Preprocessing Workflow'),
    ('p',
     'Figure 4.2 shows the complete preprocessing workflow from sensor reading to model-ready '
     'dataset. Each stage was implemented as an independently executable function so that it could '
     'be unit-tested and re-run deterministically when the corpus changed.'),
    ('fig', 'figures/fig_4_2_workflow.png',
     'Figure 4.2: Data collection and preprocessing workflow from telemetry to labelled dataset'),
    ('p',
     'The stages are as follows. Validation rejects malformed payloads at the ingest endpoint '
     'before they reach storage. Missing-value treatment fills short gaps — up to three '
     'consecutive samples — by linear interpolation within the window, and drops windows whose '
     'gap exceeds that bound rather than fabricating data. Outlier capping clips values outside '
     'the interquartile range fences computed per channel on the training partition, preventing a '
     'single sensor spike from defining a feature. Min-max normalisation maps features to [0, 1] '
     'using training-partition statistics only. Window aggregation then builds the ten-minute '
     'frames, feature extraction computes the thirty-one terms, and labelling attaches the health '
     'state drawn from workshop records of the fault-injection sessions and maintenance logbook '
     'entries.'),
    ('h3', '4.4.4 Sequence Construction for Temporal Learning'),
    ('p',
     'Although the deployed classifier treats windows independently, the pipeline constructs '
     'sequential context as well. Consecutive windows are grouped into six-window sequences — one '
     'hour of operation — and per-sequence summary terms (monotonic trend counts, persistence of '
     'elevated vibration, number of threshold crossings) are appended as features. This encodes '
     'the temporal fact that matters diagnostically: a machine whose vibration is elevated for one '
     'window is noise, while a machine elevated for six consecutive windows is degrading. The '
     'sequence structure also leaves the data in the layout a recurrent model would require, so '
     'future work replacing the classifier with an LSTM, as suggested in the conclusion, consumes '
     'the same prepared dataset without re-engineering.'),
    ('h3', '4.4.5 Data Splitting and Validation Strategy'),
    ('p',
     'Because windows overlap temporally, a random split would place neighbouring windows — nearly '
     'identical in feature values — on both sides of the train-test boundary, a leakage pattern '
     'identified as gap G4. The strategy adopted instead is block-aware: the 45-day timeline is '
     'divided into contiguous blocks, windows are assigned to partitions by block, and only then '
     'stratified sampling is applied within each partition to preserve class ratios. The result is '
     'an 80:20 split in which no test window shares source minutes with any training window. '
     'Five-fold stratified cross-validation is then run within the training partition for model '
     'selection, and the held-out test partition is touched once, at the end.'),
    ('h2', '4.5 Data Set Description'),
    ('h3', '4.5.1 Data Acquisition and Understanding'),
    ('p',
     'The prepared corpus comprises 36,240 labelled windows. Table 4.3 states its composition. '
     'The abnormal share, 45.4 percent, is materially higher than the natural field incidence and '
     'follows from the fault-injection campaign of Section 4.4.1; the evaluation protocol of '
     'Section 4.4.5 is what keeps this enrichment from distorting the reported results, since the '
     'held-out partition preserves the corpus ratio while the field trial of Chapter 9 measures '
     'operational effect independently.'),
    ('table', 'Table 4.3: Composition of the prepared dataset',
     ['Statistic', 'Value'],
     [
         ['Collection period', '45 continuous days, 1 Hz sampling, five channels'],
         ['Assets instrumented', '3 (two 5 kVA diesel generator sets, one motor-pump rig)'],          ['Total labelled windows', '36,240 ten-minute windows at 5-minute stride, after quality screening'],
         ['Normal windows', '19,786 (54.6%)'],
         ['Failure-prone windows', '16,454 (45.4%)'],
         ['Training partition', '28,992 windows (80%)'],
         ['Test partition', '7,248 windows (20%), block-contiguous, stratified'],
         ['Features per window', '31 (28 after pruning, 3 retained for comparability)'],
     ]),
    ('h3', '4.5.2 Feature Engineering and Sequence Construction'),
    ('p',
     'Feature engineering runs inside the cross-validation loop rather than before it, an ordering '
     'that prevents information from the validation fold leaking into training. Normalisation '
     'statistics, outlier fences and importance-based pruning are recomputed on each training fold '
     'and applied to the corresponding validation fold. The fitted artefacts — scaler parameters, '
     'fences, selected feature list and the classifier itself — are serialised together as a '
     'versioned model bundle, so that the dashboard and the edge node load one coherent object '
     'rather than reassembling preprocessing at inference time.'),
    ('h3', '4.5.3 Synthetic Data Generation Using SMOTE'),
    ('p',
     'Even with fault injection, the failure class is the minority in the training partition. '
     'Synthetic Minority Over-sampling Technique (SMOTE) [12] is applied to address this: for each '
     'minority example, a synthetic neighbour is interpolated along the line joining it to one of '
     'its k nearest minority peers, producing new instances that vary the failure mode rather than '
     'duplicating existing rows. SMOTE is applied strictly within training folds — never to '
     'validation or test partitions — so that evaluation always measures generalisation to '
     'genuinely unseen windows. The k parameter was set to five, and ablation during model '
     'selection showed that SMOTE raised failure-class recall by 6.4 percentage points at a cost '
     'of 1.1 percentage points on the normal class, an exchange the application demands: a missed '
     'failure costs a recovery operation, a missed normal window costs an inspection.'),
    ('h2', '4.6 Workflow Diagram'),
    ('p',
     'The workflow of Figure 4.2 unifies the stages of this chapter into a single executable '
     'pipeline. Its operational counterpart — training, evaluation and periodic retraining — is '
     'specified as pseudocode in Chapter 6 and Appendix A, so that the diagram corresponds line '
     'for line to code that was run to produce the dataset and the model reported in Chapter 9.'),
    ('h2', '4.7 Summary'),
    ('p',
     'This chapter specified the proposed methodology: a six-layer architecture with explicit '
     'inter-layer contracts, the technology stack and its rationale, the data campaign over three '
     'instrumented assets, the preprocessing workflow from payload validation to labelled windows, '
     'the block-aware splitting strategy that prevents temporal leakage, and the SMOTE-based '
     'imbalance handling confined to training folds. The dataset of 36,240 windows and the '
     'evaluation protocol are the two artefacts that Chapter 9 depends on. The next chapter states '
     'the objectives these design decisions were meant to fulfil.'),

    # ============================== CHAPTER 5 ==============================
    ('h1', 'CHAPTER 5', 'OBJECTIVES'),
    ('p',
     'Objectives are stated here formally, each with the acceptance criterion that marks its '
     'completion and the research gap it answers. Stating them apart from the methodology, as the '
     'prescribed structure requires, serves an evaluative purpose: the criteria in Table 5.1 can '
     'be checked against the results of Chapter 9 without reference to the design narrative.'),
    ('fig', 'figures/fig_5_1_objectives.png',
     'Figure 5.1: Objective tree derived from Problem Statement 49 of the Indian Army Compendium'),
    ('h2', '5.1 Primary Objectives'),
    ('p',
     'O1: to design and build a multi-parameter sensor node — temperature, humidity, vibration, '
     'pressure and level — on a single-board computer, at an indigenised unit cost below ₹3,500, '
     'answering gap G5. Acceptance: a bill of materials (Table 8.1) totalling under the ceiling '
     'and continuous acquisition for 45 days without data loss attributable to the node.'),
    ('p',
     'O2: to implement a secure telemetry path from node to time-series store using MQTT with TLS '
     'and QoS level 1, including local buffering across link interruptions, answering gap G1. '
     'Acceptance: telemetry survives simulated network outages with no unrecoverable gaps after '
     'reconnection, and all transport is encrypted end to end.'),
    ('p',
     'O3: to construct a labelled, windowed dataset with documented feature engineering and '
     'explicit class-imbalance handling, answering gap G3. Acceptance: a corpus of at least '
     '30,000 labelled windows with a published feature list, and a SMOTE procedure confined to '
     'training folds.'),
    ('p',
     'O4: to train and validate a health-state classifier whose held-out accuracy meets or exceeds '
     '80 percent with failure-class recall reported alongside, answering gap G4. Acceptance: '
     'block-aware 80:20 split, five-fold cross-validation within the training partition, and a '
     'single-touch evaluation on the held-out test set.'),
    ('p',
     'O5: to deliver an operator-facing system — dashboard, alerts, PDF and CSV reports, digital '
     'logbook and preventive maintenance schedule behind documented REST interfaces — satisfying '
     'the deliverables of [2] and answering gap G6. Acceptance: every deliverable reachable from '
     'the dashboard, and the API documented through its OpenAPI schema.'),
    ('h2', '5.2 Secondary Objectives'),
    ('p',
     'Two secondary objectives support the primary set: to quantify the operational effect of the '
     'system against manual logbook practice in a parallel field trial, and to map the delivered '
     'system onto the Sustainable Development Goals listed in the annexure, with the mapping '
     'documented in Appendix C. The first converts a technical result into maintenance outcomes; '
     'the second situates the work within the institutional framework the college report requires.'),
    ('h2', '5.3 Objective–Outcome Traceability'),
    ('table', 'Table 5.1: Traceability of Problem Statement 49 requirements to objectives and results',
     ['Requirement in [2]', 'Objective', 'Where satisfied', 'Result reported'],
     [
         ['Transition from corrective to preventive maintenance', 'O4', 'Chapters 4 and 6', '82.5% held-out accuracy, Chapter 9'],
         ['Advance failure warning', 'O4, O5', 'Chapter 6 alerting module', '48–72 h lead time at 95% CI'],
         ['Digital logbook', 'O5', 'Chapter 6, Appendix B', 'Dashboard logbook view'],
         ['Automated preventive maintenance schedules', 'O5', 'Chapter 6 scheduler', 'Schedule generation in dashboard'],
         ['Inventory management', 'O5', 'REST interface', 'Spares endpoint in API documentation'],
         ['ERP integration capability', 'O5, G6', 'OpenAPI schema', 'Documented versioned endpoints'],          ['Affordable proliferation', 'O1', 'Bill of materials', '₹3,200 per unit (Table 8.1)'],
         ['Field-deployable operation', 'O2', 'Communication layer', 'Buffered QoS 1 transmission'],
     ]),
    ('p',
     'The traceability is not symmetrical by design: requirements cluster on O5 because the '
     'problem statement’s deliverables are largely operational, while O1 through O4 carry the '
     'engineering that makes those deliverables trustworthy. Chapter 9 evaluates each row against '
     'its stated result.'),

    # ============================== CHAPTER 6 ==============================
    ('h1', 'CHAPTER 6', 'SYSTEM DESIGN & IMPLEMENTATION'),
    ('h2', '6.1 Module-Wise Implementation Details'),
    ('h3', '6.1.1 Data Preparation and Encoding Module'),
    ('p',
     'The preparation module reads InfluxDB series, assembles ten-minute windows, and applies the '
     'preprocessing chain of Section 4.4.3. Two implementation details carry the design’s '
     'guarantees. First, every fitted artefact is scoped to its partition: outlier fences and the '
     'min-max scaler are fitted on training data only and stored inside the model bundle, so a '
     'validation fold can never inform its own normalisation. Second, labels are joined by time '
     'interval rather than by nearest timestamp, using workshop records expressed as intervals '
     '(fault injected at 10:14, cleared at 11:02), which prevents label bleed at the boundaries of '
     'fault sessions — the exact region where the classifier’s errors would otherwise hide.'),
    ('h3', '6.1.2 Sequence Construction and Windowing Module'),
    ('p',
     'Windowing iterates the timeline with a ten-minute frame and a five-minute stride during '     'training-fold construction; the same stride is used in both partitions, and block boundaries '
     'are cut between frames so that no source minutes are shared across the split. The sequence builder then'
     'groups six consecutive windows and computes the persistence features of Section 4.4.4. '
     'Windows whose missing-value rate exceeds the five-percent bound are dropped before grouping, '
     'and a dropped window breaks the sequence chain rather than being silently skipped, so that '
     'persistence counts always describe genuinely contiguous operation.'),
    ('h3', '6.1.3 Model Architecture and Model Training'),
    ('p',
     'The classifier is a Random Forest [13] — an ensemble of decision trees trained on bootstrap '
     'samples with random feature subsets, whose majority vote constitutes the prediction. The '
     'choice follows from the data reality documented in Chapters 2 and 4: engineered tabular '
     'features, a training set of tens of thousands rather than millions of rows, and a requirement '
     'that the maintenance officer can be shown why a decision was reached. Trees render '
     'feature importances directly; a deep network on the same data would have been both less '
     'interpretable and, on the evidence of [7], no more accurate. Figure 6.1 shows the training '
     'and inference flow.'),
    ('fig', 'figures/fig_6_1_rf.png',
     'Figure 6.1: Random Forest training and majority-vote inference for health-state classification'),
    ('table', 'Table 6.1: Random Forest hyper-parameters used for final training',
     ['Hyper-parameter', 'Value', 'Rationale'],
     [
         ['n_estimators', '200', 'Vote stability plateaued beyond 200 trees on validation folds'],
         ['max_depth', '15', 'Bound tree growth to limit memorisation of sparse failure windows'],
         ['min_samples_leaf', '4', 'Force leaf generalisation; smooths SMOTE-synthesised neighbourhoods'],
         ['max_features', 'sqrt', 'Standard decorrelation for classification forests'],
         ['class_weight', 'None (SMOTE applied upstream)', 'Balancing done by synthesis, not by loss weighting'],
         ['criterion', 'gini', 'Default impurity measure; equivalent behaviour to entropy here'],
         ['random_state', '42', 'Reproducibility of reported figures'],
     ]),
    ('p',
     'Training proceeds as follows: for each cross-validation fold, preprocessing is fitted on the '
     'training segment, SMOTE is applied to that segment, a forest is trained, and the untouched '
     'validation segment is scored. Hyper-parameter selection maximised mean validation F1 rather '
     'than accuracy, because with an enriched failure class the two diverge and F1 penalises the '
     'failure-class errors that matter. The chosen configuration was refitted on the full training '
     'partition and evaluated once on the held-out test partition; those figures are Chapter 9’s.'),
    ('h2', '6.2 Algorithms'),
    ('p',
     'Algorithm 6.1 specifies the edge acquisition and transmission procedure executed by the '
     'Raspberry Pi node.'),
    ('p',
     'Algorithm 6.1 — Edge acquisition and buffered publication\n'
     'Input: sensor list S, sampling period Δt = 1 s, MQTT topic T\n'
     '1  connect to broker with credentials, TLS session, QoS 1, clean_session = false\n'
     '2  loop forever:\n'
     '3      reading ← {ch: read(ch) for ch in S}\n'
     '4      payload ← JSON{asset_id, ts: now(), readings: reading}\n'
     '5      enqueue payload in local ring buffer (capacity 5000)\n'
     '6      if broker session is up:\n'
     '7          publish payload to T with QoS 1\n'
     '8          dequeue on PUBACK; on timeout (5 s) retain in buffer\n'
     '9      else: retain in buffer; retry connection with exponential backoff (1 s → 60 s)\n'
     '10     sleep Δt'),
    ('p',
     'Algorithm 6.2 specifies window preparation and model training, the batch procedure whose '
     'outputs are the dataset statistics of Table 4.3 and the model bundle.'),
    ('p',
     'Algorithm 6.2 — Window preparation and classifier training\n'
     'Input: time series X, labels L, block split B, fold count k = 5\n'
     '1  partition X, L by B into TRAIN (80%), TEST (20%)   // block-contiguous, no overlap\n'
     '2  for each fold f in k-fold(TRAIN):\n'
     '3      fit scaler, outlier fences, feature pruning on TRAIN\\f only\n'
     '4      transform TRAIN\\f and f with the fitted artefacts\n'
     '5      apply SMOTE to TRAIN\\f only (k_neighbors = 5)\n'
     '6      fit forest (Table 6.1 params) on augmented TRAIN\\f\n'
     '7      score f; record precision, recall, F1 per class\n'
     '8  select hyper-parameters maximising mean validation F1\n'
     '9  refit full pipeline on TRAIN; serialise model bundle\n'
     '10 evaluate once on TEST; write metrics and confusion matrix'),
    ('p',
     'Algorithm 6.3 specifies online inference and alerting as executed by the presentation and '
     'analytics services.'),
    ('p',
     'Algorithm 6.3 — Online inference and alert generation\n'
     'Input: model bundle M, live stream from InfluxDB, persistence threshold θ = 2\n'
     '1  every 5 minutes: fetch latest complete window W\n'
     '2  apply M.preprocess(W)            // fitted scaler, fences, features\n'
     '3  ŷ, prob ← M.forest.predict(W), M.forest.predict_proba(W)\n'
     '4  if ŷ = failure-prone and prob ≥ 0.70: increment consecutive-failure counter c\n'
     '5  else: reset c\n'
     '6  if c ≥ θ: raise alert(asset, severity = prob, window = W)   // dashboard + log\n'
     '7  record (ts, ŷ, prob, c) in logbook store\n'
     '8  if alert is new: export PDF digest; append CSV row for inventory reference'),
    ('h2', '6.3 Screenshots'),
    ('p',
     'Figure 6.2 presents the dashboard wireframe as implemented: a status strip giving per-asset '
     'state at a glance, a live telemetry panel, and an alert log with time, condition and '
     'severity. The wireframe is reproduced here as the design reference; the running system’s '
     'screenshots — dashboard, broker session, ingest API, database explorer, report outputs — are '
     'collected in Appendix B.'),
    ('fig', 'figures/fig_6_2_dashboard.png',
     'Figure 6.2: Wireframe of the AEHMS monitoring dashboard as implemented in Streamlit'),
    ('p',
     'The dashboard consumes only the documented REST endpoints, which means it exercises the same '
     'interface an external ERP or inventory system would. That was a deliberate implementation '
     'constraint: if the dashboard had read the database directly, the API contract would have '
     'been validated by nothing, and requirement G6 — integration readiness — would have been '
     'claimed rather than demonstrated.'),
    ('h2', '6.4 Integration of Components'),
    ('p',
     'Integration followed a bottom-up sequence so that each layer was verified against a live '
     'predecessor rather than a mock: sensors against the node’s GPIO readers; the node against a '
     'local broker, then the cloud broker under TLS; the ingest API against a test publisher; '
     'InfluxDB against the API’s write path; the analytics bundle against stored series; and '
     'finally the dashboard against the API. Network outage was simulated at the transport layer '
     'by dropping the broker session mid-stream and confirming that the ring buffer drained '
     'without loss after reconnection — the acceptance test for O2.'),
    ('table', 'Table 6.2: REST API endpoints exposed for integration',
     ['Method', 'Endpoint', 'Purpose'],
     [
         ['GET', '/api/v1/assets', 'List monitored assets with current health state'],
         ['GET', '/api/v1/assets/{id}/telemetry?from=&to=', 'Time-bounded channel history'],
         ['GET', '/api/v1/assets/{id}/alerts', 'Alert history with severity and lead time'],
         ['GET', '/api/v1/logbook', 'Digital logbook entries'],
         ['GET', '/api/v1/schedule', 'Generated preventive maintenance schedule'],
         ['GET', '/api/v1/inventory', 'Spares inventory status for ERP consumption'],
         ['POST', '/api/v1/reports/export', 'Trigger PDF or CSV report generation'],
     ]),
    ('h2', '6.5 Summary'),
    ('p',
     'This chapter described the system as built: the preparation, windowing and training modules '
     'with the guarantees their implementations carry; the Random Forest configuration and the '
     'three algorithms that run edge acquisition, batch training and online inference; the '
     'dashboard realisation of the design wireframe; and the component integration verified layer '
     'by layer, including the outage-recovery test. The API surface in Table 6.2 is the artefact '
     'that satisfies the integration requirement of [2]. Chapter 7 places these components on the '
     'execution timeline, and Chapter 9 evaluates what they produced.'),
]
