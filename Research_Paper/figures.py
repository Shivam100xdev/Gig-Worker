# Generates all figures for the AEHMS research paper
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman']
plt.rcParams['mathtext.fontset'] = 'stix'
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'figures')
os.makedirs(OUT, exist_ok=True)

GREY = '#d9d9d9'
GREY_D = '#bfbfbf'
BLUE = '#c6d9f1'
GREEN = '#d8e4bc'
ORANGE = '#fce4d6'
WHITE = '#ffffff'


def box(ax, x, y, w, h, text, fc=WHITE, ec='black', fs=9, lw=1.0, bold=False):
    p = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.02,rounding_size=0.02',
                       fc=fc, ec=ec, lw=lw)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha='center', va='center', fontsize=fs,
            fontweight='bold' if bold else 'normal', linespacing=1.25)


def arrow(ax, x1, y1, x2, y2, lw=1.2, style='-|>'):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                                 mutation_scale=12, lw=lw, color='black'))


# ---------------- Figure 4.1: Layered System Architecture ----------------
fig, ax = plt.subplots(figsize=(7.2, 5.4))
ax.set_xlim(0, 10); ax.set_ylim(0, 8.6); ax.axis('off')

layers = [
    (7.0, 'PERCEPTION LAYER\nDHT11 (Temp/RH) | SW-420 (Vibration) | BMP280 (Pressure) | Float Sensor (Fuel Level)', BLUE),
    (5.6, 'EDGE LAYER\nRaspberry Pi 4 Model B  |  Python 3.11  |  1 Hz Sampling  |  JSON Serialisation', GREEN),
    (4.2, 'COMMUNICATION LAYER\nMQTT Protocol  |  HiveMQ Cloud Broker (TLS 1.2)  |  QoS Level 1', ORANGE),
    (2.8, 'PROCESSING & STORAGE LAYER\nFastAPI (Ingest API)  |  InfluxDB (Time-Series Store)  |  Scheduler Service', BLUE),
    (1.4, 'ANALYTICS LAYER\nFeature Extraction (10-min windows)  |  Random Forest Classifier  |  Threshold Rules', GREEN),
    (0.0, 'PRESENTATION LAYER\nStreamlit Dashboard  |  PDF/CSV Reports  |  SMS-Style Alert Notifications', ORANGE),
]
for y, text, fc in layers:
    box(ax, 0.4, y, 9.2, 1.05, text, fc=fc, fs=8.5)
for y1, y2 in [(7.0, 6.65), (5.6, 5.25), (4.2, 3.85), (2.8, 2.45), (1.4, 1.05)]:
    arrow(ax, 5.0, y1, 5.0, y2)
ax.text(9.85, 6.1, 'telemetry', rotation=90, fontsize=7.5, ha='center', va='center')
ax.text(9.85, 2.1, 'commands /\nconfig', rotation=90, fontsize=7.5, ha='center', va='center')
ax.set_title('')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_4_1_architecture.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 4.2: Data Collection and Preprocessing Workflow ----------------
fig, ax = plt.subplots(figsize=(7.2, 4.6))
ax.set_xlim(0, 10); ax.set_ylim(0, 6.4); ax.axis('off')
steps = [
    (0.3, 4.6, 'Sensor\nReadings\n(1 Hz)', BLUE),
    (2.0, 4.6, 'MQTT\nPublish\n(Pi 4)', GREEN),
    (3.7, 4.6, 'FastAPI\nIngest\nEndpoint', ORANGE),
    (5.4, 4.6, 'InfluxDB\nTime-Series\nStorage', BLUE),
    (7.1, 4.6, 'Validation &\nMissing-Value\nTreatment', GREEN),
]
for x, y, t, fc in steps:
    box(ax, x, y, 1.55, 1.3, t, fc=fc, fs=8)
for i in range(4):
    arrow(ax, steps[i][0] + 1.55, 5.25, steps[i + 1][0], 5.25)
steps2 = [
    (0.3, 2.4, 'Outlier\nCapping\n(IQR)', ORANGE),
    (2.0, 2.4, 'Min-Max\nNormalisation', BLUE),
    (3.7, 2.4, 'Sliding Window\nAggregation\n(10 min)', GREEN),
    (5.4, 2.4, 'Statistical\nFeature\nExtraction', ORANGE),
    (7.1, 2.4, 'Label\nAssignment\n(Maint. Logs)', BLUE),
]
for x, y, t, fc in steps2:
    box(ax, x, y, 1.55, 1.3, t, fc=fc, fs=8)
for i in range(4):
    arrow(ax, steps2[i][0] + 1.55, 3.05, steps2[i + 1][0], 3.05)
arrow(ax, 7.875, 4.6, 1.075, 3.7)   # from validation down-left to outlier
arrow(ax, 7.875, 2.4, 4.6, 0.9)     # to final box
box(ax, 3.2, 0.25, 3.6, 0.9, 'Balanced Feature-Label Dataset\n(SMOTE on Training Split Only)', fc=GREEN, fs=8.5, bold=True)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_4_2_workflow.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 5.1: Objective Tree ----------------
fig, ax = plt.subplots(figsize=(7.2, 3.8))
ax.set_xlim(0, 10); ax.set_ylim(0, 5.2); ax.axis('off')
box(ax, 3.4, 4.1, 3.2, 0.85, 'Transition from corrective to\npreventive maintenance (PS 49)', fc=ORANGE, fs=8.5, bold=True)
objs = [
    (0.2, 'O1\nLow-cost IoT\nsensor node'),
    (2.15, 'O2\nSecure MQTT\ntelemetry'),
    (4.1, 'O3\nHealth state\nclassifier'),
    (6.05, 'O4\n48-72 h\nadvance alert'),
    (8.0, 'O5\nDashboard &\nreporting'),
]
for x, t in objs:
    box(ax, x, 2.0, 1.8, 1.5, t, fc=BLUE, fs=8)
    arrow(ax, 5.0, 4.1, x + 0.9, 3.5)
box(ax, 2.5, 0.4, 5.0, 0.9, 'Digital logbook | PM schedule | Inventory | ERP-ready REST API', fc=GREEN, fs=8.5)
for x, _ in objs:
    arrow(ax, x + 0.9, 2.0, 5.0, 1.3)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_5_1_objectives.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 6.1: Random Forest Training and Inference ----------------
fig, ax = plt.subplots(figsize=(7.2, 4.4))
ax.set_xlim(0, 10); ax.set_ylim(0, 6.2); ax.axis('off')
box(ax, 3.6, 5.1, 2.8, 0.8, 'Training Feature Vectors\n(31 statistical features)', fc=BLUE, fs=8.5)
for i, (x, lbl) in enumerate([(1.0, 'Decision Tree 1'), (3.15, 'Decision Tree 2'), (5.3, 'Decision Tree 3'), (7.45, '... Tree 200')]):
    box(ax, x, 3.3, 1.65, 1.0, lbl, fc=GREEN, fs=8.5)
    arrow(ax, 5.0, 5.1, x + 0.825, 4.3)
    box(ax, x, 1.9, 1.65, 0.8, 'Vote: Normal', fc=WHITE, fs=8) if i == 0 else None
# votes
votes = ['Normal', 'Normal', 'Failure', 'Normal']
for (x, lbl), v in zip([(1.0, 'Decision Tree 1'), (3.15, 'Decision Tree 2'), (5.3, 'Decision Tree 3'), (7.45, '... Tree 200')], votes):
    box(ax, x, 1.9, 1.65, 0.8, 'Vote:\n' + v, fc=WHITE, fs=8)
    arrow(ax, x + 0.825, 3.3, x + 0.825, 2.7)
box(ax, 3.2, 0.3, 3.6, 0.95, 'Majority Vote Aggregator\nPredicted Health State + Confidence', fc=ORANGE, fs=8.5, bold=True)
for x, _ in [(1.0, 1), (3.15, 2), (5.3, 3), (7.45, 4)]:
    arrow(ax, x + 0.825, 1.9, 5.0, 1.25)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_6_1_rf.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 7.1: Gantt Chart ----------------
activities = [
    ('Requirement analysis & literature survey', 0, 3),
    ('Hardware procurement & sensor-node assembly', 2, 4),
    ('Edge firmware & MQTT integration', 4, 5),
    ('Cloud pipeline (FastAPI + InfluxDB)', 6, 4),
    ('Field data collection & labelling', 9, 6),
    ('Feature engineering & SMOTE balancing', 13, 3),
    ('Model training & 5-fold validation', 15, 4),
    ('Streamlit dashboard & report module', 17, 3),
    ('Integration testing & field trials', 19, 3),
    ('Documentation & report writing', 21, 2),
]
fig, ax = plt.subplots(figsize=(7.4, 4.2))
for i, (name, start, dur) in enumerate(activities):
    y = len(activities) - i - 1
    color = BLUE if i < 3 else (GREEN if i < 6 else ORANGE)
    ax.barh(y, dur, left=start, height=0.55, color=color, edgecolor='black', linewidth=0.6)
ax.set_yticks(range(len(activities)))
ax.set_yticklabels([a[0] for a in reversed(activities)], fontsize=8.5)
ax.set_xlabel('Project week', fontsize=10)
ax.set_xticks(np.arange(0, 24, 2))
ax.set_xlim(0, 23.5)
ax.set_ylim(-0.7, len(activities) - 0.3)
ax.grid(axis='x', linestyle=':', linewidth=0.6)
ax.set_axisbelow(True)
for wk, lab in [(3, 'M1'), (9, 'M2'), (15, 'M3'), (19, 'M4'), (23, 'M5')]:
    ax.axvline(wk, color='red', linestyle='--', linewidth=0.8)
    ax.text(wk, len(activities) - 0.45, lab, color='red', fontsize=8, ha='center')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_7_1_gantt.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 9.1: Confusion Matrix ----------------
cm = np.array([[3355, 604], [664, 2625]])
fig, ax = plt.subplots(figsize=(5.2, 4.2))
im = ax.imshow(cm, cmap='Blues')
ax.set_xticks([0, 1]); ax.set_xticklabels(['Predicted\nNormal', 'Predicted\nFailure'], fontsize=10)
ax.set_yticks([0, 1]); ax.set_yticklabels(['Actual\nNormal', 'Actual\nFailure'], fontsize=10)
for i in range(2):
    for j in range(2):
        ax.text(j, i, f'{cm[i, j]:,}', ha='center', va='center', fontsize=13,
                color='white' if cm[i, j] > 2000 else 'black')
ax.set_title('')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_9_1_confusion.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 9.2: Cross-validation folds ----------------
folds = [78.9, 80.7, 82.0, 83.2, 84.2]
fig, ax = plt.subplots(figsize=(5.8, 3.6))
bars = ax.bar([f'Fold {i+1}' for i in range(5)], folds, color=BLUE, edgecolor='black', linewidth=0.6)
ax.axhline(81.8, color='red', linestyle='--', linewidth=1.0, label='Mean = 81.8%')
ax.axhspan(81.8 - 2.1, 81.8 + 2.1, color='red', alpha=0.08, label='Std. dev. band (2.1%)')
ax.set_ylim(70, 90)
ax.set_ylabel('Accuracy (%)', fontsize=10)
for b, v in zip(bars, folds):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.4, f'{v}%', ha='center', fontsize=9)
ax.legend(fontsize=8.5, loc='lower right')
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_9_2_cvfolds.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 9.3: Model comparison ----------------
models = ['Random\nForest', 'Support\nVector\nMachine', 'Decision\nTree', 'K-Nearest\nNeighbors', 'Logistic\nRegression']
acc = [82.5, 77.9, 75.3, 73.4, 71.8]
prec = [81.3, 76.1, 73.8, 71.5, 69.9]
rec = [79.8, 75.4, 72.6, 70.8, 68.2]
x = np.arange(len(models)); w = 0.26
fig, ax = plt.subplots(figsize=(7.0, 3.8))
ax.bar(x - w, acc, w, label='Accuracy', color=BLUE, edgecolor='black', linewidth=0.5)
ax.bar(x, prec, w, label='Precision', color=GREEN, edgecolor='black', linewidth=0.5)
ax.bar(x + w, rec, w, label='Recall', color=ORANGE, edgecolor='black', linewidth=0.5)
ax.set_xticks(x); ax.set_xticklabels(models, fontsize=8.5)
ax.set_ylim(60, 90); ax.set_ylabel('Score (%)', fontsize=10)
ax.legend(fontsize=8.5, ncol=3, loc='upper right')
ax.grid(axis='y', linestyle=':', linewidth=0.6); ax.set_axisbelow(True)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_9_3_models.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 9.4: AEHMS vs Manual maintenance ----------------
fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.4))
ax = axes[0]
bars = ax.bar(['Manual\n(logbook)', 'AEHMS\n(proposed)'], [55, 38], color=[GREY_D, BLUE], edgecolor='black', linewidth=0.6)
ax.set_ylabel('Missed failures (count)', fontsize=10)
for b, v in zip(bars, [55, 38]):
    ax.text(b.get_x() + b.get_width() / 2, v + 1, str(v), ha='center', fontsize=10)
ax.set_title('(a) Missed failures', fontsize=10)
ax = axes[1]
bars = ax.bar(['Manual\n(logbook)', 'AEHMS\n(proposed)'], [6.4, 3.1], color=[GREY_D, GREEN], edgecolor='black', linewidth=0.6)
ax.set_ylabel('Mean response time (h)', fontsize=10)
for b, v in zip(bars, [6.4, 3.1]):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.12, f'{v} h', ha='center', fontsize=10)
ax.set_title('(b) Maintenance response time', fontsize=10)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_9_4_comparison.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

# ---------------- Figure 6.2: Dashboard Wireframe ----------------
fig, ax = plt.subplots(figsize=(7.2, 4.2))
ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis('off')
box(ax, 0.2, 5.2, 9.6, 0.6, 'AEHMS  |  Equipment Health Monitoring Dashboard', fc=BLUE, fs=10, bold=True)
statuses = [('ENGINE: NORMAL', GREEN), ('GEARBOX: WARNING', ORANGE), ('COOLANT: NORMAL', GREEN), ('FUEL: CRITICAL', '#f4cccc')]
for i, (t, fc) in enumerate(statuses):
    box(ax, 0.2 + i * 2.45, 4.1, 2.25, 0.85, t, fc=fc, fs=8, bold=True)
box(ax, 0.2, 0.4, 4.6, 3.4, 'Live Telemetry Chart\n(Temperature / Vibration / Pressure)', fc=WHITE, fs=9)
box(ax, 5.05, 0.4, 4.75, 3.4, 'Alert Log\n-----------------------------\n14:02  FUEL level below 15%  CRITICAL\n12:47  GEARBOX vibration > 7.2 mm/s\n09:15  Daily PM schedule generated', fc=WHITE, fs=8.5)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'fig_6_2_dashboard.png'), dpi=220, bbox_inches='tight')
plt.close(fig)

print('All figures written to', OUT)
for f in sorted(os.listdir(OUT)):
    print(' -', f)
