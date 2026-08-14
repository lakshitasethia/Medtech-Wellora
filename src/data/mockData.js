/* Wellora Mock Dataset - Unified EMR Patient Records & System Data */

export const WELLORA_DATA = {
  patients: [
    {
      id: "WEL-8942",
      name: "Eleanor Vance",
      age: 48,
      gender: "Female",
      bloodType: "A+",
      phone: "+1 (555) 234-8901",
      email: "eleanor.vance@example.com",
      address: "742 Evergreen Terrace, Ward 4, Sector B",
      emergencyContact: "Thomas Vance (Spouse) - +1 (555) 998-1122",
      allergies: ["Penicillin", "Sulfa Drugs", "Shellfish"],
      chronicConditions: ["Hypertension", "Type 2 Diabetes Mellitus"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "ICU - Bed 04",
      triagePriority: "Critical",
      appointmentTime: "09:00 AM",
      vitalsHistory: [
        { time: "10:30 AM Today", bp: "148/92", hr: 88, temp: "98.6°F", spo2: "96%", rr: 18 },
        { time: "06:00 AM Today", bp: "152/95", hr: 92, temp: "98.8°F", spo2: "95%", rr: 20 },
        { time: "10:00 PM Yesterday", bp: "142/88", hr: 84, temp: "98.4°F", spo2: "97%", rr: 16 }
      ],
      prescriptions: [
        { drug: "Lisinopril", dose: "20mg", freq: "Once daily (Morning)", duration: "30 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Metformin", dose: "500mg", freq: "Twice daily (Meals)", duration: "60 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" },
        { drug: "Atorvastatin", dose: "10mg", freq: "Once daily (Bedtime)", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 10, 2026", test: "Lipid Profile & Cholesterol", result: "Total: 245 mg/dL (Elevated)", status: "Flagged" },
        { date: "Aug 08, 2026", test: "12-Lead ECG Waveform Scan", result: "ST Depression (1.8mm downsloping)", status: "Flagged" },
        { date: "Jul 25, 2026", test: "HbA1c Blood Test", result: "6.8% (Controlled)", status: "Normal" }
      ],
      consultationNotes: [
        {
          date: "Aug 12, 2026 - 10:15 AM",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Patient reports intermittent retrosternal chest tightness radiating to left shoulder during moderate exertion.",
            o: "BP 148/92 mmHg, HR 88 bpm. ECG shows 1.8mm ST segment depression in leads V4-V6.",
            a: "High risk of coronary artery ischemia. ML Heart Risk Classifier computed 78% risk score.",
            p: "Admit to ICU Bed 04. Stat Troponin I, emergency coronary angiogram scheduled for 14:00."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 78,
        riskCategory: "High Risk",
        confidence: "94.2%",
        parameters: {
          age: 48, sex: 0, cp: 2, trestbps: 148, chol: 245, fbs: 1, restecg: 1, thalach: 132, exang: 1, oldpeak: 1.8, slope: 2, ca: 2, thal: 3
        },
        keyContributors: [
          "ST Depression (1.8mm) indicates myocardial stress",
          "Elevated Total Cholesterol (245 mg/dL)",
          "Exercise-Induced Angina positive",
          "Fasting Blood Sugar > 120 mg/dL"
        ],
        aiRecommendation: "Immediate Cardiology referral, Stat Statin therapy boost, continuous 5-lead ECG monitoring."
      }
    },
    {
      id: "WEL-8943",
      name: "Marcus Thorne",
      age: 62,
      gender: "Male",
      bloodType: "O+",
      phone: "+1 (555) 887-3412",
      email: "m.thorne@example.com",
      address: "128 Skyline Boulevard, Suite 4A",
      emergencyContact: "Rachel Thorne (Daughter) - +1 (555) 443-2211",
      allergies: ["Aspirin", "Codeine"],
      chronicConditions: ["Coronary Artery Disease", "Hyperlipidemia"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "Ward A - Bed 12",
      triagePriority: "Urgent",
      appointmentTime: "10:00 AM",
      vitalsHistory: [
        { time: "11:00 AM Today", bp: "135/85", hr: 74, temp: "98.2°F", spo2: "98%", rr: 16 }
      ],
      prescriptions: [
        { drug: "Clopidogrel", dose: "75mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Rosuvastatin", dose: "20mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 11, 2026", test: "Coronary Calcium CT Scan", result: "Agatston Score: 420 (Severe Calcification)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 11, 2026",
          doctor: "Dr. Alexander Vance",
          soap: {
            s: "Post angioplasty follow-up consultation.",
            o: "Stable vitals, clear lung fields.",
            a: "Post-PCI recovery progressing well.",
            p: "Continue antiplatelet therapy. Cardiac rehab starting next week."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 62,
        riskCategory: "Moderate-High Risk",
        confidence: "91.8%",
        parameters: { age: 62, sex: 1, cp: 1, trestbps: 135, chol: 210, fbs: 0, restecg: 0, thalach: 145, exang: 0, oldpeak: 0.8, slope: 1, ca: 1, thal: 2 },
        keyContributors: ["Age factor (>60 yrs)", "Previous CAD history", "Moderate Coronary Calcium score"],
        aiRecommendation: "Maintain Antiplatelet regimen, low sodium diet, weekly lipid monitoring."
      }
    },
    {
      id: "WEL-8944",
      name: "Sophia Lin",
      age: 29,
      gender: "Female",
      bloodType: "B+",
      phone: "+1 (555) 341-9082",
      email: "sophia.lin@example.com",
      address: "420 Innovation Way, Apt 8C",
      emergencyContact: "David Lin (Father) - +1 (555) 776-9001",
      allergies: ["None Known"],
      chronicConditions: ["Asthma"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Outpatient",
      triagePriority: "Routine",
      appointmentTime: "02:15 PM",
      vitalsHistory: [
        { time: "09:15 AM Today", bp: "118/74", hr: 68, temp: "98.4°F", spo2: "99%", rr: 14 }
      ],
      prescriptions: [
        { drug: "Albuterol Inhaler", dose: "90mcg", freq: "As needed for dyspnea", duration: "180 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Jul 15, 2026", test: "Routine Pulmonary Function", result: "FEV1/FVC: 82% (Normal)", status: "Normal" }
      ],
      consultationNotes: [
        {
          date: "Aug 05, 2026",
          doctor: "Dr. Sarah Jenkins",
          soap: {
            s: "Annual wellness visit.",
            o: "Vitals normal.",
            a: "Mild intermittent asthma.",
            p: "Renew rescue inhaler prescription."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 12,
        riskCategory: "Low Risk",
        confidence: "96.5%",
        parameters: { age: 29, sex: 0, cp: 0, trestbps: 118, chol: 175, fbs: 0, restecg: 0, thalach: 172, exang: 0, oldpeak: 0.0, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["Optimal Blood Pressure", "Low Resting HR", "No Ischemic Markers"],
        aiRecommendation: "Routine annual wellness check. Maintain active lifestyle."
      }
    },
    {
      id: "WEL-8945",
      name: "Arthur Pendelton",
      age: 71,
      gender: "Male",
      bloodType: "AB+",
      phone: "+1 (555) 662-7710",
      email: "a.pendelton@example.com",
      address: "9 Harbour Court, Sector C",
      emergencyContact: "Margaret Pendelton (Spouse) - +1 (555) 662-7711",
      allergies: ["Iodine Contrast"],
      chronicConditions: ["Congestive Heart Failure", "Atrial Fibrillation"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "ICU - Bed 01",
      triagePriority: "Critical",
      appointmentTime: "08:15 AM",
      vitalsHistory: [
        { time: "11:30 AM Today", bp: "165/98", hr: 118, temp: "99.1°F", spo2: "91%", rr: 24 },
        { time: "07:30 AM Today", bp: "158/94", hr: 110, temp: "98.9°F", spo2: "93%", rr: 22 },
        { time: "11:30 PM Yesterday", bp: "150/90", hr: 102, temp: "98.6°F", spo2: "94%", rr: 20 }
      ],
      prescriptions: [
        { drug: "Furosemide", dose: "40mg", freq: "Twice daily", duration: "30 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Apixaban", dose: "5mg", freq: "Twice daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 13, 2026", test: "BNP (Heart Failure Marker)", result: "1,240 pg/mL (Markedly Elevated)", status: "Flagged" },
        { date: "Aug 13, 2026", test: "Serum Creatinine", result: "1.9 mg/dL (Elevated)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 13, 2026 - 08:40 AM",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Increasing dyspnoea on minimal exertion, orthopnoea requiring three pillows overnight.",
            o: "BP 165/98, HR 118 irregularly irregular, SpO2 91% on room air. Bibasal crepitations.",
            a: "Acute decompensated heart failure with rapid AF. Renal function declining.",
            p: "IV diuresis, rate control, strict fluid balance, daily U&E. Cardiology review twice daily."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 91,
        riskCategory: "Critical Risk",
        confidence: "95.1%",
        parameters: { age: 71, sex: 1, cp: 3, trestbps: 165, chol: 268, fbs: 1, restecg: 1, thalach: 118, exang: 1, oldpeak: 2.6, slope: 2, ca: 3, thal: 3 },
        keyContributors: [
          "Severe ST Depression (2.6mm)",
          "Advanced age (>70 yrs) with CHF history",
          "Resting tachycardia with rapid AF",
          "Elevated Total Cholesterol (268 mg/dL)"
        ],
        aiRecommendation: "Continuous telemetry, urgent Cardiology input, consider ICU escalation if SpO2 falls below 90%."
      }
    },
    {
      id: "WEL-8946",
      name: "Clara Oswald",
      age: 34,
      gender: "Female",
      bloodType: "O-",
      phone: "+1 (555) 220-4417",
      email: "c.oswald@example.com",
      address: "16 Blackfriars Lane, Apt 2B",
      emergencyContact: "Dan Oswald (Brother) - +1 (555) 220-4418",
      allergies: ["Latex"],
      chronicConditions: ["Post-Operative Recovery"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "ICU - Bed 02",
      triagePriority: "Urgent",
      appointmentTime: "08:45 AM",
      vitalsHistory: [
        { time: "11:15 AM Today", bp: "112/70", hr: 92, temp: "100.4°F", spo2: "96%", rr: 18 },
        { time: "07:15 AM Today", bp: "108/68", hr: 88, temp: "99.8°F", spo2: "97%", rr: 17 }
      ],
      prescriptions: [
        { drug: "Cefazolin", dose: "1g", freq: "Three times daily (IV)", duration: "5 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" },
        { drug: "Paracetamol", dose: "1g", freq: "Four times daily PRN", duration: "7 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 14, 2026", test: "White Cell Count", result: "14.2 x10⁹/L (Raised)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 14, 2026 - 09:10 AM",
          doctor: "Dr. Sarah Jenkins (Internal Medicine)",
          soap: {
            s: "Day 2 post laparoscopic appendicectomy. Reports moderate incisional pain.",
            o: "Temp 100.4°F, WCC 14.2. Wound sites clean, no discharge.",
            a: "Low-grade post-operative pyrexia, likely inflammatory. Infection not excluded.",
            p: "Continue IV antibiotics, repeat WCC in 24h, encourage early mobilisation."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 18,
        riskCategory: "Low Risk",
        confidence: "95.8%",
        parameters: { age: 34, sex: 0, cp: 0, trestbps: 112, chol: 182, fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.0, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["No ischaemic markers", "Normal blood pressure"],
        aiRecommendation: "No cardiac intervention indicated. Focus on post-operative recovery."
      }
    },
    {
      id: "WEL-8947",
      name: "Rajesh Gupta",
      age: 58,
      gender: "Male",
      bloodType: "B-",
      phone: "+1 (555) 771-2093",
      email: "r.gupta@example.com",
      address: "88 Meridian Park Road",
      emergencyContact: "Priya Gupta (Spouse) - +1 (555) 771-2094",
      allergies: ["None Known"],
      chronicConditions: ["Type 2 Diabetes Mellitus", "Diabetic Nephropathy"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Ward A - Bed 14",
      triagePriority: "Urgent",
      appointmentTime: "11:00 AM",
      vitalsHistory: [
        { time: "10:45 AM Today", bp: "146/90", hr: 82, temp: "98.5°F", spo2: "97%", rr: 17 },
        { time: "06:45 AM Today", bp: "141/86", hr: 78, temp: "98.3°F", spo2: "98%", rr: 16 }
      ],
      prescriptions: [
        { drug: "Insulin Glargine", dose: "24 units", freq: "Once nightly", duration: "Ongoing", status: "Active", prescribedBy: "Dr. Sarah Jenkins" },
        { drug: "Ramipril", dose: "10mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 12, 2026", test: "HbA1c Blood Test", result: "9.4% (Poorly Controlled)", status: "Flagged" },
        { date: "Aug 12, 2026", test: "eGFR", result: "48 mL/min (Stage 3a CKD)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 12, 2026 - 11:20 AM",
          doctor: "Dr. Sarah Jenkins (Internal Medicine)",
          soap: {
            s: "Reports polyuria and fatigue over six weeks. Admits poor dietary adherence.",
            o: "HbA1c 9.4%, eGFR 48. BP 146/90.",
            a: "Poorly controlled T2DM with progressive diabetic nephropathy.",
            p: "Escalate insulin, dietitian referral, nephrology review in 4 weeks."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 68,
        riskCategory: "Moderate-High Risk",
        confidence: "93.4%",
        parameters: { age: 58, sex: 1, cp: 1, trestbps: 146, chol: 232, fbs: 1, restecg: 1, thalach: 138, exang: 0, oldpeak: 1.2, slope: 2, ca: 1, thal: 2 },
        keyContributors: ["Uncontrolled fasting blood sugar", "Systolic hypertension (146 mmHg)", "Moderate ST depression (1.2mm)"],
        aiRecommendation: "Aggressive glycaemic and blood pressure control. Baseline echocardiogram advised."
      }
    },
    {
      id: "WEL-8948",
      name: "Fatima Al-Rashid",
      age: 45,
      gender: "Female",
      bloodType: "A-",
      phone: "+1 (555) 308-6621",
      email: "f.alrashid@example.com",
      address: "23 Crescent Gardens",
      emergencyContact: "Omar Al-Rashid (Spouse) - +1 (555) 308-6622",
      allergies: ["Ibuprofen", "NSAIDs"],
      chronicConditions: ["Migraine with Aura", "Iron Deficiency Anaemia"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Outpatient",
      triagePriority: "Routine",
      appointmentTime: "11:30 AM",
      vitalsHistory: [
        { time: "11:20 AM Today", bp: "122/78", hr: 76, temp: "98.4°F", spo2: "99%", rr: 15 }
      ],
      prescriptions: [
        { drug: "Sumatriptan", dose: "50mg", freq: "As needed at onset", duration: "60 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" },
        { drug: "Ferrous Sulfate", dose: "200mg", freq: "Twice daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 09, 2026", test: "Full Blood Count", result: "Hb 10.2 g/dL (Low)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 09, 2026",
          doctor: "Dr. Sarah Jenkins",
          soap: {
            s: "Migraine frequency increased to three episodes weekly. Persistent fatigue.",
            o: "Hb 10.2 g/dL, ferritin low. Neurological examination unremarkable.",
            a: "Migraine with aura, likely exacerbated by iron deficiency anaemia.",
            p: "Continue iron replacement, headache diary, review in 8 weeks."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 22,
        riskCategory: "Low Risk",
        confidence: "94.7%",
        parameters: { age: 45, sex: 0, cp: 0, trestbps: 122, chol: 196, fbs: 0, restecg: 0, thalach: 160, exang: 0, oldpeak: 0.2, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["No significant ischaemic markers detected"],
        aiRecommendation: "Routine cardiovascular maintenance. Address anaemia."
      }
    },
    {
      id: "WEL-8949",
      name: "Daniel Okafor",
      age: 66,
      gender: "Male",
      bloodType: "O+",
      phone: "+1 (555) 419-8873",
      email: "d.okafor@example.com",
      address: "301 Kingsway Avenue",
      emergencyContact: "Grace Okafor (Daughter) - +1 (555) 419-8874",
      allergies: ["Penicillin"],
      chronicConditions: ["COPD", "Hypertension"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "Ward A - Bed 15",
      triagePriority: "Urgent",
      appointmentTime: "12:00 PM",
      vitalsHistory: [
        { time: "11:40 AM Today", bp: "154/92", hr: 96, temp: "98.9°F", spo2: "92%", rr: 22 },
        { time: "07:40 AM Today", bp: "149/88", hr: 90, temp: "98.7°F", spo2: "93%", rr: 21 }
      ],
      prescriptions: [
        { drug: "Tiotropium", dose: "18mcg", freq: "Once daily (inhaled)", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Amlodipine", dose: "10mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 13, 2026", test: "Arterial Blood Gas", result: "pO2 62 mmHg (Hypoxaemic)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 13, 2026",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Productive cough with increased sputum volume over four days.",
            o: "SpO2 92% room air, RR 22, widespread expiratory wheeze.",
            a: "Infective exacerbation of COPD on background of hypertension.",
            p: "Nebulised bronchodilators, controlled oxygen therapy, non-penicillin antibiotic."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 74,
        riskCategory: "Moderate-High Risk",
        confidence: "92.9%",
        parameters: { age: 66, sex: 1, cp: 2, trestbps: 154, chol: 241, fbs: 0, restecg: 1, thalach: 128, exang: 1, oldpeak: 1.5, slope: 2, ca: 2, thal: 3 },
        keyContributors: ["Exercise-induced angina positive", "Systolic hypertension (154 mmHg)", "ST depression 1.5mm", "Chronic hypoxaemia"],
        aiRecommendation: "Optimise blood pressure control. Cardiology review once respiratory status stabilises."
      }
    },
    {
      id: "WEL-8950",
      name: "Mei Tanaka",
      age: 52,
      gender: "Female",
      bloodType: "A+",
      phone: "+1 (555) 553-9012",
      email: "m.tanaka@example.com",
      address: "77 Lantern Way",
      emergencyContact: "Kenji Tanaka (Spouse) - +1 (555) 553-9013",
      allergies: ["None Known"],
      chronicConditions: ["Hypothyroidism", "Hyperlipidaemia"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Outpatient",
      triagePriority: "Routine",
      appointmentTime: "12:30 PM",
      vitalsHistory: [
        { time: "12:20 PM Today", bp: "128/82", hr: 70, temp: "98.2°F", spo2: "98%", rr: 15 }
      ],
      prescriptions: [
        { drug: "Levothyroxine", dose: "100mcg", freq: "Once daily (fasting)", duration: "180 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" },
        { drug: "Simvastatin", dose: "20mg", freq: "Once daily (bedtime)", duration: "90 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 07, 2026", test: "Thyroid Function (TSH)", result: "3.1 mIU/L (Normal)", status: "Normal" },
        { date: "Aug 07, 2026", test: "Lipid Profile", result: "Total: 218 mg/dL (Borderline)", status: "Normal" }
      ],
      consultationNotes: [
        {
          date: "Aug 07, 2026",
          doctor: "Dr. Sarah Jenkins",
          soap: {
            s: "Routine six-monthly review. Energy levels stable, no cold intolerance.",
            o: "TSH within range on current replacement dose. Lipids borderline.",
            a: "Euthyroid on levothyroxine. Hyperlipidaemia adequately controlled.",
            p: "Continue current therapy. Repeat lipids and TFTs in six months."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 31,
        riskCategory: "Low Risk",
        confidence: "94.1%",
        parameters: { age: 52, sex: 0, cp: 0, trestbps: 128, chol: 218, fbs: 0, restecg: 0, thalach: 152, exang: 0, oldpeak: 0.3, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["Borderline cholesterol (218 mg/dL)"],
        aiRecommendation: "Continue statin therapy. Lifestyle reinforcement at next review."
      }
    },
    {
      id: "WEL-8951",
      name: "Thomas Reyes",
      age: 39,
      gender: "Male",
      bloodType: "B+",
      phone: "+1 (555) 884-1156",
      email: "t.reyes@example.com",
      address: "5 Foundry Street, Unit 12",
      emergencyContact: "Ana Reyes (Sister) - +1 (555) 884-1157",
      allergies: ["Morphine"],
      chronicConditions: ["Anxiety Disorder"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Outpatient",
      triagePriority: "Routine",
      appointmentTime: "01:00 PM",
      vitalsHistory: [
        { time: "12:50 PM Today", bp: "134/84", hr: 94, temp: "98.6°F", spo2: "99%", rr: 18 }
      ],
      prescriptions: [
        { drug: "Sertraline", dose: "50mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 14, 2026", test: "12-Lead ECG", result: "Sinus rhythm, no acute changes", status: "Normal" },
        { date: "Aug 14, 2026", test: "Troponin I", result: "< 0.01 ng/mL (Negative)", status: "Normal" }
      ],
      consultationNotes: [
        {
          date: "Aug 14, 2026 - 01:05 PM",
          doctor: "Dr. Sarah Jenkins (Internal Medicine)",
          soap: {
            s: "Recurrent episodes of chest tightness and palpitations, associated with work stress.",
            o: "ECG sinus rhythm. Troponin negative. Chest wall tender on palpation.",
            a: "Non-cardiac chest pain, likely anxiety-related with musculoskeletal component.",
            p: "Reassurance, continue sertraline, CBT referral. Safety-net advice given."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 26,
        riskCategory: "Low Risk",
        confidence: "93.2%",
        parameters: { age: 39, sex: 1, cp: 1, trestbps: 134, chol: 204, fbs: 0, restecg: 0, thalach: 164, exang: 0, oldpeak: 0.1, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["No ischaemic markers; negative troponin"],
        aiRecommendation: "Cardiac cause unlikely. Manage anxiety and reassess if symptom pattern changes."
      }
    },
    {
      id: "WEL-8952",
      name: "Helen Whitfield",
      age: 78,
      gender: "Female",
      bloodType: "O+",
      phone: "+1 (555) 226-3388",
      email: "h.whitfield@example.com",
      address: "Rosewood Care Home, Room 14",
      emergencyContact: "Peter Whitfield (Son) - +1 (555) 226-3389",
      allergies: ["Codeine", "Tramadol"],
      chronicConditions: ["Osteoporosis", "Hypertension", "Mild Cognitive Impairment"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "Ward B - Bed 03",
      triagePriority: "Urgent",
      appointmentTime: "01:30 PM",
      vitalsHistory: [
        { time: "01:15 PM Today", bp: "158/86", hr: 84, temp: "97.9°F", spo2: "95%", rr: 18 },
        { time: "09:15 AM Today", bp: "162/88", hr: 88, temp: "98.1°F", spo2: "95%", rr: 19 }
      ],
      prescriptions: [
        { drug: "Alendronic Acid", dose: "70mg", freq: "Once weekly", duration: "180 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Bisoprolol", dose: "2.5mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 13, 2026", test: "Hip X-Ray", result: "No acute fracture. Marked osteopenia.", status: "Normal" },
        { date: "Aug 13, 2026", test: "Vitamin D", result: "18 nmol/L (Deficient)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 13, 2026",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Mechanical fall at care home. No loss of consciousness reported by staff.",
            o: "BP 158/86. No fracture on imaging. Vitamin D deficient. Steady with frame.",
            a: "Mechanical fall, multifactorial. Uncontrolled hypertension contributing.",
            p: "Vitamin D replacement, falls team referral, review antihypertensive dosing."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 79,
        riskCategory: "High Risk",
        confidence: "94.5%",
        parameters: { age: 78, sex: 0, cp: 2, trestbps: 158, chol: 252, fbs: 0, restecg: 1, thalach: 122, exang: 1, oldpeak: 1.9, slope: 2, ca: 2, thal: 3 },
        keyContributors: [
          "Advanced age (>75 yrs)",
          "Significant ST depression (1.9mm)",
          "Systolic hypertension (158 mmHg)",
          "Elevated cholesterol (252 mg/dL)"
        ],
        aiRecommendation: "Cardiology assessment recommended. Balance blood pressure control against falls risk."
      }
    },
    {
      id: "WEL-8953",
      name: "Jonas Berg",
      age: 55,
      gender: "Male",
      bloodType: "AB-",
      phone: "+1 (555) 990-4471",
      email: "j.berg@example.com",
      address: "142 Northgate Terrace",
      emergencyContact: "Lise Berg (Spouse) - +1 (555) 990-4472",
      allergies: ["None Known"],
      chronicConditions: ["Hypertension", "Obstructive Sleep Apnoea"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "Outpatient",
      triagePriority: "Urgent",
      appointmentTime: "02:45 PM",
      vitalsHistory: [
        { time: "02:35 PM Today", bp: "150/94", hr: 80, temp: "98.5°F", spo2: "96%", rr: 17 },
        { time: "10:35 AM Today", bp: "147/91", hr: 78, temp: "98.4°F", spo2: "96%", rr: 16 }
      ],
      prescriptions: [
        { drug: "Losartan", dose: "50mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 11, 2026", test: "Exercise Tolerance Test", result: "1.4mm ST depression at 7 METs", status: "Flagged" },
        { date: "Aug 11, 2026", test: "Lipid Profile", result: "Total: 254 mg/dL (Elevated)", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 11, 2026",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Exertional breathlessness climbing stairs. Loud snoring reported by partner.",
            o: "BP 150/94. ETT positive at 7 METs. Cholesterol 254 mg/dL. BMI 34.",
            a: "Probable stable angina on background of untreated OSA and hypertension.",
            p: "Start statin, sleep study referral, CT coronary angiogram requested."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 72,
        riskCategory: "Moderate-High Risk",
        confidence: "93.8%",
        parameters: { age: 55, sex: 1, cp: 2, trestbps: 150, chol: 254, fbs: 0, restecg: 1, thalach: 134, exang: 1, oldpeak: 1.4, slope: 2, ca: 1, thal: 3 },
        keyContributors: ["Positive exercise tolerance test", "Elevated cholesterol (254 mg/dL)", "Systolic hypertension (150 mmHg)"],
        aiRecommendation: "Expedite CT coronary angiography. Initiate high-intensity statin therapy."
      }
    },
    {
      id: "WEL-8954",
      name: "Amara Nwosu",
      age: 27,
      gender: "Female",
      bloodType: "A+",
      phone: "+1 (555) 145-7729",
      email: "a.nwosu@example.com",
      address: "60 Willow Bank, Flat 5",
      emergencyContact: "Chidi Nwosu (Brother) - +1 (555) 145-7730",
      allergies: ["Peanuts"],
      chronicConditions: ["Sickle Cell Trait"],
      assignedDoctor: "Dr. Sarah Jenkins",
      roomBed: "Outpatient",
      triagePriority: "Routine",
      appointmentTime: "03:15 PM",
      vitalsHistory: [
        { time: "03:05 PM Today", bp: "114/72", hr: 72, temp: "98.3°F", spo2: "99%", rr: 14 }
      ],
      prescriptions: [
        { drug: "Folic Acid", dose: "5mg", freq: "Once daily", duration: "180 Days", status: "Active", prescribedBy: "Dr. Sarah Jenkins" }
      ],
      labResults: [
        { date: "Aug 06, 2026", test: "Haemoglobin Electrophoresis", result: "HbAS pattern confirmed", status: "Normal" }
      ],
      consultationNotes: [
        {
          date: "Aug 06, 2026",
          doctor: "Dr. Sarah Jenkins",
          soap: {
            s: "Attends for pre-conception counselling regarding sickle cell trait.",
            o: "Well. Observations normal. Electrophoresis confirms HbAS.",
            a: "Sickle cell trait, asymptomatic. Partner screening indicated.",
            p: "Genetic counselling referral, continue folic acid, partner testing arranged."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 10,
        riskCategory: "Low Risk",
        confidence: "96.8%",
        parameters: { age: 27, sex: 0, cp: 0, trestbps: 114, chol: 168, fbs: 0, restecg: 0, thalach: 178, exang: 0, oldpeak: 0.0, slope: 1, ca: 0, thal: 2 },
        keyContributors: ["Optimal blood pressure", "No ischaemic markers"],
        aiRecommendation: "No cardiovascular concern. Routine wellness follow-up."
      }
    },
    {
      id: "WEL-8955",
      name: "Victor Almeida",
      age: 63,
      gender: "Male",
      bloodType: "O-",
      phone: "+1 (555) 337-2214",
      email: "v.almeida@example.com",
      address: "19 Sandpiper Close",
      emergencyContact: "Sofia Almeida (Spouse) - +1 (555) 337-2215",
      allergies: ["Statins (myalgia)"],
      chronicConditions: ["Previous Myocardial Infarction", "Hypertension"],
      assignedDoctor: "Dr. Alexander Vance",
      roomBed: "Ward A - Bed 16",
      triagePriority: "Critical",
      appointmentTime: "03:45 PM",
      vitalsHistory: [
        { time: "03:30 PM Today", bp: "168/100", hr: 104, temp: "98.8°F", spo2: "94%", rr: 21 },
        { time: "11:30 AM Today", bp: "159/95", hr: 98, temp: "98.6°F", spo2: "95%", rr: 19 },
        { time: "07:30 AM Today", bp: "151/90", hr: 92, temp: "98.5°F", spo2: "96%", rr: 18 }
      ],
      prescriptions: [
        { drug: "Aspirin", dose: "75mg", freq: "Once daily", duration: "Ongoing", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Ezetimibe", dose: "10mg", freq: "Once daily", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" },
        { drug: "Glyceryl Trinitrate", dose: "400mcg", freq: "Sublingual PRN", duration: "90 Days", status: "Active", prescribedBy: "Dr. Alexander Vance" }
      ],
      labResults: [
        { date: "Aug 14, 2026", test: "Troponin I", result: "0.42 ng/mL (Elevated)", status: "Flagged" },
        { date: "Aug 14, 2026", test: "12-Lead ECG", result: "2.2mm ST depression, leads V3-V6", status: "Flagged" }
      ],
      consultationNotes: [
        {
          date: "Aug 14, 2026 - 03:40 PM",
          doctor: "Dr. Alexander Vance (Cardiology)",
          soap: {
            s: "Crushing central chest pain at rest for 40 minutes, radiating to jaw. Diaphoretic.",
            o: "BP 168/100, HR 104. ECG 2.2mm ST depression V3-V6. Troponin 0.42 rising.",
            a: "Non-ST elevation myocardial infarction. High ischaemic risk.",
            p: "Dual antiplatelet loading, IV nitrate, urgent inpatient coronary angiography."
          }
        }
      ],
      mlHeartRisk: {
        riskScore: 88,
        riskCategory: "Critical Risk",
        confidence: "95.6%",
        parameters: { age: 63, sex: 1, cp: 3, trestbps: 168, chol: 276, fbs: 1, restecg: 1, thalach: 116, exang: 1, oldpeak: 2.2, slope: 2, ca: 3, thal: 3 },
        keyContributors: [
          "Severe ST depression (2.2mm) across anterolateral leads",
          "Rising troponin with prior infarct history",
          "Severe hypertension (168/100 mmHg)",
          "Statin intolerance limiting lipid control"
        ],
        aiRecommendation: "URGENT: inpatient coronary angiography, continuous telemetry, consider alternative lipid-lowering agent."
      }
    }
  ],

  staff: [
    { id: "STF-101", name: "Dr. Alexander Vance", role: "Doctor", department: "Cardiology", status: "On Duty", shift: "Day Shift (08:00 - 16:00)", email: "a.vance@wellora.med" },
    { id: "STF-102", name: "Dr. Sarah Jenkins", role: "Doctor", department: "Internal Medicine", status: "On Duty", shift: "Day Shift (08:00 - 16:00)", email: "s.jenkins@wellora.med" },
    { id: "STF-103", name: "Nurse Jessica Alba", role: "Nurse", department: "ICU Ward", status: "On Duty", shift: "Morning Shift (07:00 - 15:00)", email: "j.alba@wellora.med" },
    { id: "STF-104", name: "Nurse Michael Chang", role: "Nurse", department: "Cardiology Ward", status: "On Duty", shift: "Morning Shift (07:00 - 15:00)", email: "m.chang@wellora.med" },
    { id: "STF-105", name: "Elena Rostova", role: "Receptionist", department: "Front Desk", status: "On Duty", shift: "Full Day (08:00 - 17:00)", email: "e.rostova@wellora.med" },
    { id: "STF-106", name: "Marcus Brody", role: "Admin", department: "Operations", status: "On Duty", shift: "Administrative (09:00 - 18:00)", email: "m.brody@wellora.med" }
  ],

  beds: [
    { id: "BED-ICU-01", ward: "ICU", bedNumber: "ICU-01", status: "critical", patientId: "WEL-8945", patientName: "Arthur Pendelton", condition: "Heart Failure RVR" },
    { id: "BED-ICU-02", ward: "ICU", bedNumber: "ICU-02", status: "occupied", patientId: "WEL-8946", patientName: "Clara Oswald", condition: "Post-Op Monitoring" },
    { id: "BED-ICU-03", ward: "ICU", bedNumber: "ICU-03", status: "cleaning", patientId: null, patientName: "Sanitizing...", condition: "Terminal Clean" },
    { id: "BED-ICU-04", ward: "ICU", bedNumber: "ICU-04", status: "critical", patientId: "WEL-8942", patientName: "Eleanor Vance", condition: "Ischemia Alert" },
    { id: "BED-ICU-05", ward: "ICU", bedNumber: "ICU-05", status: "available", patientId: null, patientName: "Unassigned", condition: "Ready for Admission" },
    { id: "BED-ICU-06", ward: "ICU", bedNumber: "ICU-06", status: "occupied", patientId: null, patientName: "Harold Simms", condition: "Ventilated - Sedation Hold" },
    { id: "BED-WA-11", ward: "Ward A", bedNumber: "WA-11", status: "available", patientId: null, patientName: "Unassigned", condition: "Ready for Admission" },
    { id: "BED-WA-12", ward: "Ward A", bedNumber: "WA-12", status: "occupied", patientId: "WEL-8943", patientName: "Marcus Thorne", condition: "Post-PCI Stable" },
    { id: "BED-WA-13", ward: "Ward A", bedNumber: "WA-13", status: "cleaning", patientId: null, patientName: "Sanitizing...", condition: "Discharge Clean" },
    { id: "BED-WA-14", ward: "Ward A", bedNumber: "WA-14", status: "occupied", patientId: "WEL-8947", patientName: "Rajesh Gupta", condition: "Diabetic Nephropathy" },
    { id: "BED-WA-15", ward: "Ward A", bedNumber: "WA-15", status: "occupied", patientId: "WEL-8949", patientName: "Daniel Okafor", condition: "COPD Exacerbation" },
    { id: "BED-WA-16", ward: "Ward A", bedNumber: "WA-16", status: "critical", patientId: "WEL-8955", patientName: "Victor Almeida", condition: "NSTEMI - Awaiting Angio" },
    { id: "BED-WB-01", ward: "Ward B", bedNumber: "WB-01", status: "available", patientId: null, patientName: "Unassigned", condition: "Ready for Admission" },
    { id: "BED-WB-02", ward: "Ward B", bedNumber: "WB-02", status: "available", patientId: null, patientName: "Unassigned", condition: "Ready for Admission" },
    { id: "BED-WB-03", ward: "Ward B", bedNumber: "WB-03", status: "occupied", patientId: "WEL-8952", patientName: "Helen Whitfield", condition: "Post-Fall Observation" },
    { id: "BED-WB-04", ward: "Ward B", bedNumber: "WB-04", status: "occupied", patientId: null, patientName: "Gordon Blythe", condition: "Cellulitis - IV Antibiotics" },
    { id: "BED-WB-05", ward: "Ward B", bedNumber: "WB-05", status: "cleaning", patientId: null, patientName: "Sanitizing...", condition: "Terminal Clean" },
    { id: "BED-WB-06", ward: "Ward B", bedNumber: "WB-06", status: "available", patientId: null, patientName: "Unassigned", condition: "Ready for Admission" }
  ],

  appointments: [
    { id: "APT-501", time: "08:15 AM", patientName: "Arthur Pendelton", patientId: "WEL-8945", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "Decompensated heart failure", status: "In Consultation", type: "Urgent" },
    { id: "APT-502", time: "08:45 AM", patientName: "Clara Oswald", patientId: "WEL-8946", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Post-op pyrexia review", status: "Completed", type: "Follow-up" },
    { id: "APT-503", time: "09:00 AM", patientName: "Eleanor Vance", patientId: "WEL-8942", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "Chest pain workup", status: "In Consultation", type: "Urgent" },
    { id: "APT-504", time: "10:00 AM", patientName: "Marcus Thorne", patientId: "WEL-8943", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "Post-PCI checkup", status: "Completed", type: "Follow-up" },
    { id: "APT-505", time: "11:00 AM", patientName: "Rajesh Gupta", patientId: "WEL-8947", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Diabetes escalation review", status: "Completed", type: "Follow-up" },
    { id: "APT-506", time: "11:30 AM", patientName: "Fatima Al-Rashid", patientId: "WEL-8948", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Migraine and anaemia review", status: "Completed", type: "Routine" },
    { id: "APT-507", time: "12:00 PM", patientName: "Daniel Okafor", patientId: "WEL-8949", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "COPD exacerbation review", status: "Checked-In", type: "Urgent" },
    { id: "APT-508", time: "12:30 PM", patientName: "Mei Tanaka", patientId: "WEL-8950", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Thyroid six-month review", status: "Checked-In", type: "Routine" },
    { id: "APT-509", time: "01:00 PM", patientName: "Thomas Reyes", patientId: "WEL-8951", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Chest pain - non-cardiac", status: "Checked-In", type: "Routine" },
    { id: "APT-510", time: "01:30 PM", patientName: "Helen Whitfield", patientId: "WEL-8952", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "Post-fall assessment", status: "Checked-In", type: "Urgent" },
    { id: "APT-511", time: "02:15 PM", patientName: "Sophia Lin", patientId: "WEL-8944", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Asthma inhaler refill", status: "Scheduled", type: "Routine" },
    { id: "APT-512", time: "02:45 PM", patientName: "Jonas Berg", patientId: "WEL-8953", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "Stable angina workup", status: "Scheduled", type: "Urgent" },
    { id: "APT-513", time: "03:15 PM", patientName: "Amara Nwosu", patientId: "WEL-8954", doctor: "Dr. Sarah Jenkins", dept: "Internal Med", reason: "Pre-conception counselling", status: "Scheduled", type: "Routine" },
    { id: "APT-514", time: "03:45 PM", patientName: "Victor Almeida", patientId: "WEL-8955", doctor: "Dr. Alexander Vance", dept: "Cardiology", reason: "NSTEMI - urgent angiography", status: "Scheduled", type: "Urgent" }
  ]
};
