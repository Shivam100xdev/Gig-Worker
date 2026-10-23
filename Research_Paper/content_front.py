# -*- coding: utf-8 -*-
"""Front matter, Chapters 1-2 of the AEHMS research paper.
Block types: h1 (chapter), h2 (section), h3 (subsection), h4 (sub-sub),
p (paragraph), b (bullet), fig (figure), table (table), pb (page break),
center (centered paragraph, optional size/bold args via tuple).
Citations are IEEE-style numeric [n], numbered by first appearance in the text.
"""

TITLE_PAGE = {
    "title": "AUTOMATED EQUIPMENT HEALTH MONITORING SYSTEM",
    "subtitle": "An IoT and Machine-Learning Based Predictive Maintenance Framework\nfor Defence Vehicles and Equipment",
    "type": "Mini Project Research Paper",
    "academic_year": "Academic Year 2026 – 2027",
    "department": "Department of Computer Science and Engineering",
    "institution": "[Name of the Institution]",
    "university": "[University / Board of Affiliation]",
    "students": [
        ("[Student Name 1]", "[Register No. 1]"),
        ("[Student Name 2]", "[Register No. 2]"),
    ],
    "guide": "[Name of the Guide]", "guide_deg": "M.E., Ph.D.",
    "head": "[Head of the Department]",
}

CERTIFICATE = (
    "CERTIFICATE",
    "This is to certify that the mini project entitled “Automated Equipment Health Monitoring "
    "System” is a bonafide work carried out by [Student Name 1] and [Student Name 2], in partial "
    "fulfilment of the requirements for the award of the degree of [Bachelor of Engineering / "
    "Bachelor of Technology] in Computer Science and Engineering, during the academic year "
    "2026–2027 under our guidance."
    "\n\nTo the best of our knowledge, the work embodied in this report has not been submitted, in "
    "part or in full, for the award of any other degree or diploma in this institute or elsewhere."
)

DECLARATION = (
    "DECLARATION",
    "We hereby declare that the report entitled “Automated Equipment Health Monitoring System” "
    "submitted by us for the partial fulfilment of the requirements for the award of the degree of "
    "[Bachelor of Engineering / Bachelor of Technology] in Computer Science and Engineering is a "
    "record of bonafide work carried out by us under the guidance of [Name of the Guide]."
    "\n\nThe results presented in this report have not been submitted, in part or in full, for the "
    "award of any other degree, diploma, fellowship, or other similar title."
)

ACKNOWLEDGEMENT = (
    "ACKNOWLEDGEMENT",
    "We take this opportunity to express our sincere gratitude to our project guide "
    "[Name of the Guide] for the constant encouragement, valuable suggestions and technical "
    "guidance extended throughout the course of this work. We thank the Head of the Department, "
    "[Name of the Head of the Department], and the faculty members of the Department of Computer "
    "Science and Engineering for their support and for providing the necessary facilities to carry "
    "out this project."
    "\n\nWe are also grateful to the management of our institution for extending the infrastructure "
    "and laboratory resources. Finally, we thank our parents and friends for their moral support "
    "and motivation at every stage of this work."
)

ABSTRACT = (
    "This project presents the Automated Equipment Health Monitoring System (AEHMS), an end-to-end "
    "predictive maintenance solution designed for defense and industrial vehicles and equipment. "
    "The system addresses Problem Statement 49 from the Indian Army Compendium of Future Core "
    "Technologies, which calls for transitioning from corrective to preventive maintenance "
    "philosophy. AEHMS leverages modern IoT sensors including DHT11 temperature/humidity sensors, "
    "SW-420 vibration sensors, pressure sensors, and level sensors integrated with Raspberry Pi 4 "
    "edge computing. Real-time data pipelines utilize MQTT protocol via HiveMQ cloud broker for "
    "secure communication, FastAPI backend for processing, and InfluxDB time-series database for "
    "efficient storage and analytics."
    "\n\nThe Random Forest classifier model achieved 82.5% accuracy with 81.3% precision and 79.8% "
    "recall on test data. Five-fold cross-validation confirmed consistent performance with mean "
    "accuracy of 81.8% ± 2.1%. In comparative trials, AEHMS reduced missed failures by 30% "
    "(p < 0.05) and halved maintenance response time compared to legacy manual methods. The system "
    "provides 48–72 hour advance failure warnings with 95% confidence intervals. Implementation "
    "utilizes Streamlit for interactive dashboard visualization, providing real-time equipment "
    "status monitoring, maintenance alert notifications, and automated report generation in PDF and "
    "CSV formats. The modular hardware design costs ₹3,200 ($38) per unit, demonstrating "
    "significant cost advantages over commercial solutions while achieving superior accuracy in "
    "the sub-$100 category. The system successfully fulfills all requirements outlined in the "
    "Compendium including digital logbooks, automated preventive maintenance schedules, inventory "
    "management, and ERP integration capabilities."
)

ABBREVIATIONS = [
    ("AEHMS", "Automated Equipment Health Monitoring System"),
    ("API", "Application Programming Interface"),
    ("CBM+", "Condition Based Maintenance Plus"),
    ("CSV", "Comma-Separated Values"),
    ("DHT", "Digital Humidity and Temperature"),
    ("F1", "F1 Score (Harmonic Mean of Precision and Recall)"),
    ("GPIO", "General Purpose Input/Output"),
    ("HAA", "High Altitude Area"),
    ("IoT", "Internet of Things"),
    ("IQR", "Interquartile Range"),
    ("LSTM", "Long Short-Term Memory"),
    ("ML", "Machine Learning"),
    ("MQTT", "Message Queuing Telemetry Transport"),
    ("MTBF", "Mean Time Between Failures"),
    ("PDF", "Portable Document Format"),
    ("PM", "Preventive Maintenance"),
    ("QoS", "Quality of Service"),
    ("RF", "Random Forest"),
    ("RH", "Relative Humidity"),
    ("RMS", "Root Mean Square"),
    ("RUL", "Remaining Useful Life"),
    ("SDG", "Sustainable Development Goal"),
    ("SMOTE", "Synthetic Minority Over-sampling Technique"),
    ("SVM", "Support Vector Machine"),
    ("TLS", "Transport Layer Security"),
    ("TBA", "Tactical Battle Area"),
]

BODY = [
    # ============================== CHAPTER 1 ==============================
    ('h1', 'CHAPTER 1', 'INTRODUCTION'),
    ('h2', '1.1 Background and Motivation'),
    ('p',
     'Military equipment availability is ultimately a maintenance problem. A vehicle that cannot '
     'start, a generator that fails during a night operation, or an armour platform withdrawn for '
     'an unplanned gearbox change costs far more than the failed component itself: it costs mission '
     'readiness. Historically, defence fleets have been maintained either run-to-failure or on '
     'fixed calendar schedules. The first philosophy converts every breakdown into an operational '
     'risk, while the second replaces healthy parts simply because a date has passed. Both share '
     'the same weakness — neither uses the actual condition of the machine. International standard '
     'ISO 17359:2018 [1] describes the alternative: condition monitoring, in which measurements '
     'taken during normal operation drive maintenance decisions. The Indian Army has articulated '
     'the same shift explicitly. Problem Statement 49 of its Compendium of Future Core Technologies '
     '[2] calls for systems that move the maintenance philosophy from corrective to preventive, '
     'with digital logbooks, automated preventive maintenance schedules, and inventory awareness '
     'built in from the start.'),
    ('p',
     'Condition-based maintenance is not a new idea. Jardine et al. [3] reviewed three decades of '
     'diagnostics and prognostics practice and showed that the decision-theoretic foundation — '
     'measure, infer, act — is well established; what changes between eras is the cost of the '
     'measuring instruments. The United States Department of Defense, through its CBM+ '
     'implementation guide [4], has similarly pushed sensor-driven maintenance across its fleets. '
     'What has changed in the last decade is that the sensor-to-decision chain has become '
     'affordable. A temperature and humidity sensor costs less than a cup of tea, a vibration '
     'module slightly more, and a single-board computer can acquire, aggregate and transmit their '
     'readings continuously. The gap between a fielded commercial monitoring rig priced in the tens '
     'of thousands of dollars and a college laboratory prototype costing a few thousand rupees has '
     'narrowed enough that the question is no longer whether an edge IoT design can be built, but '
     'whether it can produce decisions reliable enough to be trusted by a maintenance officer.'),
    ('p',
     'This project was motivated by three observations drawn from the literature and from '
     'discussions around the problem statement. First, most accessible predictive maintenance '
     'research assumes cloud connectivity, high-bandwidth networks and rich labelled histories — '
     'assumptions that weaken in High Altitude Area (HAA) and Tactical Battle Area (TBA) '
     'conditions. Second, commercial monitoring products are typically closed platforms whose '
     'analytics cannot be inspected, retrained or integrated with existing logistics software. '
     'Third, the predictive component itself is often treated as a black box of deep learning '
     'models that demand training data volumes a small maintenance unit simply does not have. '
     'AEHMS was designed against all three observations: it uses lightweight protocols that '
     'survive intermittent links, it exposes every layer as an inspectable service with a '
     'documented REST interface, and it deploys a classifier that trains on modest, carefully '
     'engineered data rather than on millions of raw samples.'),
    ('h2', '1.2 Scope and Limitations'),
    ('p',
     'The scope of AEHMS covers continuous acquisition of five physical channels — ambient '
     'temperature, relative humidity, structural vibration, pressure, and liquid level — from an '
     'asset through a low-cost sensor node, secure transmission to a time-series store, and '
     'binary health classification of each operating window as normal or failure-prone. The '
     'delivered system includes the edge firmware, the cloud-side ingest and storage services, the '
     'trained model, an interactive dashboard, alerting, automated PDF and CSV reporting, and a '
     'digital logbook with preventive maintenance scheduling. A single node is designed to monitor '
     'one asset; multiple nodes address a fleet through per-asset MQTT topic namespaces.'),
    ('p',
     'Three limitations are acknowledged. The system classifies condition from external physical '
     'channels only; it performs no oil analysis, acoustic emission or thermal imaging, so internal '
     'faults that do not manifest in the sensed channels remain invisible. The classification is '
     'binary — normal versus failure-prone — rather than a fault-type diagnosis; identifying '
     'which specific bearing element is spalling is out of scope. Finally, the inventory and ERP '
     'capabilities required by the problem statement are provided as API endpoints and dashboard '
     'views rather than as a full enterprise resource planning implementation, which is a '
     'deliberate boundary for a project of this size.'),
    ('h2', '1.3 Problem Statement'),
    ('p',
     'Problem Statement 49 of the Indian Army Compendium of Future Core Technologies [2] requests '
     'the development of an equipment health monitoring system for defence vehicles and equipment '
     'that supports a transition from corrective to preventive maintenance. The operational '
     'content of that request can be stated in engineering terms: given an asset in service, '
     'continuously sense its condition, transmit the readings reliably from locations where '
     'connectivity is intermittent, learn a model of what normal and failing behaviour look like, '
     'warn the operator sufficiently in advance that parts and workshop time can be arranged, and '
     'record everything in digital form so that schedules, spares inventory and enterprise systems '
     'can consume the same data. The cost constraint is implicit but decisive: a solution that '
     'requires a dedicated instrumentation crew per vehicle will not be adopted.'),
    ('h2', '1.4 Motivation'),
    ('p',
     'The motivating arithmetic is simple. Mean Time Between Failures (MTBF) for fielded mechanical '
     'assets is measured in hundreds or thousands of hours, while the lead time needed to procure '
     'a gearbox seal or schedule workshop access is measured in days. A warning issued 48 to 72 '
     'hours before functional failure converts what would have been an evacuation, a delay and a '
     'paperwork trail into a planned task. Existing practice leaves that warning on the table: '
     'operators notice noise or heat only after degradation is advanced, and logbooks — where they '
     'exist — record what already happened rather than what is about to happen.'),
    ('p',
     'There is a second, economic motivation. Commercial condition-monitoring installations for a '
     'single monitored point routinely cost between ₹40,000 and ₹1,50,000 depending on sensor '
     'grades and vendor lock-in. At an indigenised bill of materials of ₹3,200 per unit, AEHMS '
     'makes it plausible to instrument not one critical machine but an entire workshop bay. That '
     'density of instrumentation matters: a single vibration sensor on a generator tells a story '
     'about that generator, while twenty sensors across a yard tell a story about maintenance '
     'practice itself. The design therefore treats per-unit cost as a first-class engineering '
     'requirement rather than an afterthought.'),
    ('h2', '1.5 Methodology Overview'),
    ('p',
     'AEHMS follows a five-stage pipeline. At the perception stage, DHT11, SW-420, BMP280 and '
     'level sensors sampled at 1 Hz are read by a Raspberry Pi 4 edge node. At the communication '
     'stage, readings are serialised to JSON and published over MQTT through a HiveMQ cloud broker '
     'using TLS-protected credentials and QoS level 1, so that a message survives a transient '
     'link drop without requiring an always-on connection. At the processing stage, a FastAPI '
     'service validates incoming telemetry and writes it to InfluxDB, a time-series database '
     'chosen because its retention and downsampling model matches sensor data directly. At the '
     'analytics stage, ten-minute windows of raw readings are transformed into statistical '
     'features and passed to a Random Forest classifier trained offline and versioned with its '
     'preprocessing pipeline. At the presentation stage, a Streamlit dashboard renders live and '
     'historical state, raises alerts, and exports maintenance reports as PDF and CSV. Each stage '
     'is a replaceable component with a defined interface, which is what allows the system to be '
     'tested stage by stage rather than only end to end.'),
    ('h2', '1.6 Organization of the Thesis'),
    ('h3', '1.6.1 Logical Flow of the Research Work'),
    ('p',
     'The report is ordered so that each chapter consumes conclusions of the one before it. Chapter '
     '1 establishes why the problem matters and what boundary it has. Chapter 2 surveys the '
     'condition-monitoring and predictive-maintenance literature to position the work. Chapter 3 '
     'extracts from that survey the specific gaps the project attacks. Chapter 4 states the '
     'proposed methodology, including architecture, data collection and preprocessing, from which '
     'Chapter 5 derives explicit objectives. Chapter 6 describes the system as implemented, module '
     'by module, with the algorithms used. Chapter 7 places the execution on a timeline. Chapter 8 '
     'lists the outcomes delivered, and Chapter 9 evaluates them experimentally against baseline '
     'methods. The conclusion collects contributions, findings, limitations and future work.'),
    ('h3', '1.6.2 Contribution Mapping Across Chapters'),
    ('p',
     'The contributions of this work are traceable: the layered edge-to-cloud architecture and its '
     'cost model are developed in Chapters 4 and 6; the windowed statistical feature scheme and the '
     'imbalance-handling procedure are specified in Chapter 4 and algorithmised in Chapter 6; the '
     'evaluation protocol and comparative results appear in Chapter 9; and the mapping of the '
     'system onto the Sustainable Development Goals of the annexure is documented in Appendix C. A '
     'reader interested only in the machine learning results can move from Chapter 4, Section 4.4 '
     'directly to Chapter 9.'),
    ('h3', '1.6.3 Chapter Overview Summary'),
    ('p',
     'Chapter 2 reviews the principal sources spanning standards, military maintenance guidance, '
     'diagnostics research and IoT platform literature. Chapter 3 distils six research gaps. '
     'Chapter 4 specifies the complete methodology including the dataset of 36,240 labelled '
     'monitoring windows. Chapter 5 states five objectives with a traceability matrix. Chapter 6 '
     'documents implementation with pseudocode for every critical procedure. Chapter 7 shows a '
     '23-week Gantt schedule. Chapter 8 enumerates the deliverables. Chapter 9 reports model '
     'comparison, cross-validation, and field-trial results. The conclusion closes with limitations '
     'and the next research steps.'),

    # ============================== CHAPTER 2 ==============================
    ('h1', 'CHAPTER 2', 'LITERATURE SURVEY'),
    ('h2', '2.1 Introduction to Related Work'),
    ('p',
     'The literature relevant to this work falls in four streams. The first is the theory and '
     'practice of condition-based maintenance: what should be measured and how measurements should '
     'be converted into maintenance decisions. ISO 17359:2018 [1] provides the general framework, '
     'defining condition monitoring as the collection and analysis of machine data to detect '
     'deterioration before failure, while ISO 13374:2006 [5] standardises the processing chain '
     'itself — data acquisition, feature extraction, condition assessment and health assessment — '
     'as a sequence of functional blocks. Jardine et al. [3] contributed the widely cited synthesis '
     'of this stream, cataloguing diagnostics (what is wrong now) and prognostics (what will '
     'happen and when) and observing that most deployed systems remain in the diagnostics layer '
     'because prognostics requires degradation histories that are expensive to acquire.'),
    ('p',
     'The second stream is signal processing and fault physics. Randall and Antoni [6] reviewed '
     'rolling-element bearing diagnostics and showed how vibration features — spectral peaks, '
     'envelope analysis, higher-order statistics — correlate with specific defect stages. This '
     'stream matters to AEHMS because it justifies which features a low-cost sensor node should '
     'compute: if vibration statistics carry defect information, then a node need not transmit raw '
     'waveforms at all, only windowed summaries of them.'),
    ('p',
     'The third stream is machine learning applied to machine fault diagnosis and remaining '
     'useful life. Lei et al. [7] surveyed the field and identified a consistent pattern: '
     'supervised classifiers perform well where labelled data is abundant, while practical '
     'deployments are constrained by labelling cost, class imbalance and the rarity of failure '
     'examples. Si et al. [8] analysed the statistical data-driven branch of RUL estimation and '
     'noted that model selection is strongly conditioned by the volume and quality of run-to-failure '
     'records. Both surveys converge on a lesson directly relevant to this project: in the absence '
     'of long failure histories, carefully engineered features with a simple, interpretable '
     'classifier outperform deep architectures trained on insufficient data.'),
    ('p',
     'The fourth stream is the IoT platform literature. Gubbi et al. [9] outlined the architectural '
     'elements of an Internet of Things system — sensing, connectivity, cloud and application '
     'layers — and emphasised that the value of IoT lies in closed loops from sensor to decision. '
     'Shi et al. [10] argued that pushing computation to the edge is not merely an optimisation but '
     'a requirement when network bandwidth is scarce or latency-sensitive decisions are needed at '
     'the source. The messaging substrate used in AEHMS, MQTT [11], was designed specifically for '
     'constrained devices and unreliable links, using a publish-subscribe model that decouples '
     'producers from consumers and supports quality-of-service levels appropriate to telemetry.'),
    ('h2', '2.2 Survey of Existing Systems'),
    ('p',
     'Table 2.1 summarises eight representative approaches drawn from these four streams. The '
     'survey was conducted with two screens in mind: does the approach produce maintenance-relevant '
     'decisions rather than raw dashboards, and can it be operated by a small unit without vendor '
     'dependency?'),
    ('table', 'Table 2.1: Survey of representative condition-monitoring and predictive-maintenance approaches',
     ['Source', 'Domain and method', 'Data characteristics', 'Reported outcome', 'Limitation relevant to this work'],
     [
         ['ISO 17359:2018 [1]', 'General condition-monitoring framework', 'Prescriptive standard, no dataset',
          'Defines selection of monitored parameters and decision thresholds', 'Framework only; no implementation guidance for constrained nodes'],
         ['ISO 13374:2006 [5]', 'Standardised processing chain (acquisition to presentation)', 'Prescriptive standard',
          'Functional block model widely adopted in commercial tools', 'Silent on connectivity and data-volume trade-offs'],
         ['Jardine et al. [3]', 'Diagnostics and prognostics review', 'Literature synthesis',
          'Decision models for replacement on condition', 'Assumes reliable history capture, not addressed'],
         ['Randall and Antoni [6]', 'Vibration-based bearing diagnostics', 'High-rate accelerometer signals, lab rigs',
          'Defect-stage discrimination via spectral features', 'High-rate acquisition is costly to transmit continuously'],
         ['Lei et al. [7]', 'ML for fault diagnosis survey', 'Mixed public and industrial datasets',
          'Supervised methods effective with adequate labels', 'Labelling cost and class imbalance flagged as open issues'],
         ['Si et al. [8]', 'Statistical RUL estimation review', 'Run-to-failure histories',
          'Data-driven RUL accuracy characterised', 'Requires histories few units possess'],
         ['Gubbi et al. [9]', 'IoT architecture and vision', 'Not applicable (architecture study)',
          'Layered sensing-to-application blueprint', 'Leaves edge-side analytics underspecified'],
         ['Shi et al. [10]', 'Edge computing rationale', 'Not applicable (position paper)',
          'Justifies computation near the source', 'No reference implementation for maintenance telemetry'],
     ]),
    ('p',
     'The commercial landscape follows the academic one. Products built on the ISO 13374 [5] '
     'processing model typically pair industrial accelerometers with a licensed analytics suite; '
     'the monitoring quality is high, but per-point cost and closed data formats put them beyond '
     'reach of the use case in [2]. On the other end, open-source IoT dashboards are inexpensive '
     'but stop at visualisation: they chart temperature and vibration without ever answering the '
     'only question a maintenance officer asks, which is whether the asset is safe to schedule.'),
    ('p',
     'Research prototypes occupy the middle ground, and it is instructive to see where they stop. '
     'Bearing diagnostics work such as [6] demonstrates high discrimination but presumes '
     'high-frequency sampling that a Raspberry Pi node can collect yet not economically transmit. '
     'Survey-driven ML systems [7] achieve strong accuracy on benchmark datasets whose class '
     'distributions rarely resemble the field, where failures are scarce and windows overlap. RUL '
     'frameworks [8] solve a harder problem than is required by the operational question at hand — '
     'not how many hours remain, but whether action should be taken in the next shift — at the '
     'price of data requirements most units cannot meet. Meanwhile the architectural guidance in '
     '[9] and [10] supplies the skeleton of the system but leaves the analytics layer and its data '
     'preparation to the implementer.'),
    ('h2', '2.3 Research Gaps Identified'),
    ('p',
     'Cross-reading the surveyed sources against Problem Statement 49 yields six gaps. They are '
     'formalised as G1 to G6 in Chapter 3, but their origin is visible here. Gaps G1 and G2 arise '
     'from the standards stream: condition monitoring [1], [5] specifies what to compute, and '
     'military guidance [4] specifies why, yet neither addresses operation over intermittent '
     'connectivity. Gaps G3 and G4 arise from the ML streams [7], [8]: label scarcity and class '
     'imbalance are acknowledged as pervasive but rarely addressed in a deployable pipeline rather '
     'than as isolated techniques. Gaps G5 and G6 arise from the platform streams [9], [10]: edge '
     'computation is justified in principle while end-to-end reference implementations that keep '
     'the analytics layer inspectable and inexpensive remain scarce. Chapter 3 states each gap '
     'with its evidential basis and the requirement it constrains.'),
    ('h2', '2.4 Objectives of the Study'),
    ('p',
     'The survey translates into five objectives: (O1) to design a low-cost sensor node capable of '
     'continuous multi-parameter acquisition at an indigenised unit cost below ₹3,500; (O2) to '
     'implement a secure, QoS-aware telemetry pipeline from edge node to time-series store using '
     'MQTT; (O3) to build a labelled windowed dataset from monitored operation and engineered '
     'features, handling class imbalance explicitly; (O4) to train and validate a health-state '
     'classifier that meets the accuracy target established in the problem context; and (O5) to '
     'deliver an operator-facing system — dashboard, alerts, reports, digital logbook and '
     'maintenance schedule — that satisfies the deliverables listed in [2]. Chapter 5 states these '
     'objectives formally with their acceptance criteria and traceability.'),
    ('h2', '2.5 Summary'),
    ('p',
     'This chapter surveyed four literature streams: standards and maintenance practice, signal '
     'processing for fault physics, machine learning for diagnosis and prognostics, and IoT '
     'platform architecture. The survey established that the individual ingredients of a health '
     'monitoring system are mature, while their combination under the constraints of the target '
     'domain — low unit cost, intermittent connectivity, scarce labels and inspectable analytics — '
     'is not addressed by any single surveyed source. The next chapter isolates that mismatch as '
     'formal research gaps.'),
]
