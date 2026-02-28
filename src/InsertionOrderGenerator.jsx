import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  PenSquare,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { initializeApp, getApps } from "firebase/app";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import SignatureCanvas from "react-signature-canvas";

const REQUIREMENTS_OPTIONS = [
  "Below age 65",
  "Ages 50 to 79",
  "Ages 40 to 79",
  "Below 80",
  "Below 85",
  "Below 90",
  "Must NOT live in a nursing home",
  "Must NOT need a power of attorney",
  "Must have an active checking or card",
  "No Medicaid, Medicare, or Tricare",
];

const DATAPASS_FIELDS = [
  "lead_token",
  "caller_id",
  "first_name",
  "last_name",
  "email",
  "address",
  "city",
  "state",
  "zip",
  "dob (YYYY-mm-dd)",
  "jornaya_leadid",
  "trusted_form_cert_url",
  "tcpa_opt_in",
  "tcpa_optin_consent_language",
];

const BILLING_CYCLES = [
  "Paid in Advance",
  "Daily",
  "Weekly",
  "Net 7",
  "Net 14",
  "Net 30",
  "As paid by Carrier",
];

const CHARGEBACK_LIABILITY_OPTIONS = [
  "First Payment",
  "3 months",
  "6 months",
  "9 months",
];

const BUFFER_TIMES = ["60", "90", "120", "180", "240"];

const VERTICALS = [
  "Medicare",
  "ACA Health",
  "Final Expense",
  "LLC Operating Agreement",
];

const CAMPAIGN_TYPES = [
  "CPL",
  "CPA",
  "ACA Health",
  "Employment Contract",
  "Auto Insurance LLC Operating Agreement",
];

const ACA_SUB_TYPES = [
  { value: "Partnership", label: "ACA Partnership", description: "NPN Override + Per Policy + Agent Bonus residual structure" },
  { value: "CPL", label: "ACA CPL (Cost Per Lead/Call)", description: "Payout per qualified call exceeding duration threshold" },
  { value: "CPA", label: "ACA CPA (Cost Per Acquisition)", description: "Payout per qualified enrollment/policy sale" },
];

const PROOF_OF_CONSENT_OPTIONS = ["Jornaya", "Trusted Form", "None"];

const DATAPASS_PLATFORM_OPTIONS = ["Ringba", "Trackdrive", "Other"];

// Employment Contract Constants
const COMPENSATION_TYPES = [
  "Hourly",
  "Commission",
  "Hourly + Commission",
  "Salary",
];
const EMPLOYMENT_STATUS = ["Full-time", "Part-time", "Contract", "Temporary"];
const BENEFITS_OPTIONS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "Life Insurance",
  "Disability Insurance",
  "401(k) Retirement Plan",
  "Paid Time Off",
  "Sick Leave",
  "Vacation Days",
  "Holiday Pay",
  "Performance Bonuses",
  "Stock Options",
  "Company Vehicle",
  "Cell Phone Allowance",
  "Professional Development",
];
const WORK_SCHEDULE_OPTIONS = [
  "Monday-Friday, 9AM-5PM",
  "Monday-Friday, 8AM-4PM",
  "Monday-Friday, 10AM-6PM",
  "Flexible Hours",
  "Remote Work",
  "Hybrid (Remote/Office)",
  "Shift Work",
  "Weekend Availability Required",
];
const JOB_TITLES = [
  "Sales Representative",
  "Account Manager",
  "Business Development Manager",
  "Sales Manager",
  "Regional Sales Director",
  "Vice President of Sales",
  "Insurance Agent",
  "Financial Advisor",
  "Customer Service Representative",
  "Marketing Specialist",
  "Operations Manager",
  "Other",
];

const ENTITY_TYPES = [
  "LLC",
  "Corporation",
  "Sole Proprietor",
  "Partnership",
  "Nonprofit",
  "Other",
];

// Auto Insurance LLC Operating Agreement Constants
const LLC_MEMBER_ROLES = [
  "Managing Member/Investor",
  "Chief Operating Officer",
  "Chief Marketing Officer",
  "Chief Financial Officer",
  "Operations Manager",
  "Sales Manager",
  "Marketing Manager",
];

const LLC_OWNERSHIP_PERCENTAGES = [
  "10%",
  "15%",
  "20%",
  "25%",
  "27.5%",
  "30%",
  "33.33%",
  "35%",
  "40%",
  "45%",
  "50%",
  "55%",
  "60%",
  "65%",
  "70%",
  "75%",
  "80%",
  "85%",
  "90%",
  "95%",
  "100%",
];

const LLC_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const LLC_INTEREST_RATES = [
  "0%",
  "1%",
  "2%",
  "3%",
  "4%",
  "5%",
  "6%",
  "7%",
  "8%",
  "9%",
  "10%",
  "12%",
  "15%",
];

const LLC_RECOVERY_PERCENTAGES = [
  "25%",
  "30%",
  "35%",
  "40%",
  "45%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "100%",
];

const LLC_PERCENTAGE_OPTIONS = [
  "0%",
  "1%",
  "2%",
  "3%",
  "4%",
  "5%",
  "6%",
  "7%",
  "8%",
  "9%",
  "10%",
  "12%",
  "15%",
  "20%",
  "25%",
  "30%",
  "35%",
  "40%",
  "45%",
  "50%",
];

const LLC_PERFORMANCE_METRICS = [
  "Minimum number of carriers",
  "Agent retention rate",
  "Quarterly sales targets",
  "Lead generation targets",
  "Conversion rates",
  "Cost per acquisition",
  "Customer satisfaction scores",
  "Revenue growth targets",
];

const INITIAL_PARTY_STATE = {
  companyName: "",
  entityType: ENTITY_TYPES[0],
  address: "",
  email: "",
  phone: "",
};

// deriveFlowState removed - function not currently used

const INITIAL_FORM_STATE = {
  contractType: "",
  vertical: VERTICALS[0],
  type: CAMPAIGN_TYPES[0],
  payout: "",
  payoutType: "flat", // "flat" or "percentage" for Final Expense CPA
  payoutPercentage: "",
  payoutLevel: "",
  payoutAllOther: "",
  payoutPercentageLevel: "",
  payoutPercentageAllOther: "",
  chargebackLiability: CHARGEBACK_LIABILITY_OPTIONS[0],
  brokerLiability: false,
  billingCycle: BILLING_CYCLES[2], // "Weekly"
  bufferTime: BUFFER_TIMES[0], // "60"
  requirements: [],
  proofOfConsent: PROOF_OF_CONSENT_OPTIONS[0],
  datapass: "No",
  datapassPlatform: DATAPASS_PLATFORM_OPTIONS[0],
  datapassOtherPlatform: "",
  datapassPostUrl: "",
  datapassFields: [],
  exportToSheets: false,
  // ACA Health specific fields
  acaSubType: "Partnership", // Partnership, CPL, or CPA
  acaNpnOverride: "",
  acaPerPolicy: "",
  acaAgentBonus: "",
  acaBillingCycle: "As paid by Carrier",
  acaChargebackLiability: CHARGEBACK_LIABILITY_OPTIONS[0],
  acaDuration: "12",
  // ACA CPL specific
  acaCplPayout: "",
  acaCplBufferTime: BUFFER_TIMES[0],
  // ACA CPA specific
  acaCpaPayout: "",
  // Employment Contract specific fields
  jobTitle: JOB_TITLES[0],
  jobTitleOther: "",
  employmentStatus: EMPLOYMENT_STATUS[0],
  compensationType: COMPENSATION_TYPES[0],
  hourlyRate: "",
  salaryAmount: "",
  commissionRate: "",
  commissionStructure: "",
  benefits: [],
  workSchedule: WORK_SCHEDULE_OPTIONS[0],
  startDate: "",
  probationaryPeriod: "",
  reportingManager: "",
  department: "",
  jobDescription: "",
  performanceMetrics: "",
  terminationClause: "",
  nonCompetePeriod: "",
  confidentialityPeriod: "",
  intellectualProperty: "",
  trainingRequirements: "",
  travelRequirements: "",
  equipmentProvided: "",
  remoteWorkPolicy: "",
  // Auto Insurance LLC Operating Agreement specific fields
  llcCompanyName: "",
  llcState: LLC_STATES[0],
  llcFormationDate: "",
  llcRegisteredAddress: "",
  llcInvestorName: "",
  llcInvestorOwnership: "45%",
  llcInvestorContribution: "",
  llcMember1Name: "",
  llcMember1Ownership: "27.5%",
  llcMember1Contribution: "",
  llcMember1Role: "",
  llcMember2Name: "",
  llcMember2Ownership: "27.5%",
  llcMember2Contribution: "",
  llcMember2Role: "",
  llcMaxWorkingCapital: "",
  llcMinReserves: "",
  llcInterestRate: LLC_INTEREST_RATES[2],
  llcRecoveryPercentage: LLC_RECOVERY_PERCENTAGES[4],
  llcMinCarriers: "",
  llcAgentRetention: "",
  llcQuarterlyTargets: "",
  llcMinLeads: "",
  llcConversionRate: "",
  llcMaxCPA: "",
  llcOperationalLimit: "",
  llcMarketingLimit: "",
  llcFinancialLimit: "",
  llcEOCoverage: "",
  llcBonusPercentage: "",
  llcManagementFeePercentage: "",
  llcJurisdiction: "",
  llcAmendmentNoticePeriod: "",
  llcPaymentPeriod: "",
  llcExecutionDate: "",
  llcCounty: "",
  llcNotaryExpiration: "",
  // Monthly Cost Tracking Fields
  llcMonthlyRent: "",
  llcMonthlyUtilities: "",
  llcMonthlyInsurance: "",
  llcMonthlySoftware: "",
  llcMonthlyMarketing: "",
  llcMonthlySalaries: "",
  llcMonthlyOther: "",
  llcTotalMonthlyCosts: "",
  // Investor Return Planning Fields
  llcExpectedMonthlyRevenue: "",
  llcBreakEvenMonths: "",
  llcInvestorReturnTimeline: "",
  llcExitStrategy: "",
  llcLiquidationPreference: "",
  buyer: { ...INITIAL_PARTY_STATE },
  publisher: { ...INITIAL_PARTY_STATE },
};

const SECTION_TITLE_CLASSES =
  "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 border-b border-slate-200 pb-2";
const LABEL_CLASSES = "text-[13px] font-medium text-slate-600";
const CARD_CLASSES =
  "rounded-2xl border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm p-4 sm:p-5 space-y-3 card-shell";
const INPUT_BASE_CLASSES =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-1";

const GLOBAL_STYLE_BLOCK = `
  :root {
    color-scheme: light;
    font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  }

  input:focus, select:focus, textarea:focus {
    border-color: #2EAC6D !important;
    --tw-ring-color: #5BC894 !important;
  }

  .app-shell {
    min-height: 100vh;
    background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 40%, #ffffff 100%);
  }

  .contract-body {
    font-family: "Crimson Text", Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.4in 0.75in;
    background: white;
    box-shadow: 0 4px 25px rgba(0,0,0,0.08);
    border-radius: 12px;
    white-space: normal;
    border: 1px solid #e5e7eb;
    box-sizing: border-box;
  }

  .contract-body h1, .contract-body h2, .contract-body h3 {
    font-weight: 700 !important;
    color: #263149 !important;
    margin: 0.6rem 0 0.3rem 0 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    font-family: "Inter", sans-serif !important;
  }

  .contract-body h1 {
    font-size: 13pt !important;
    border-bottom: 2px solid #2EAC6D !important;
    padding-bottom: 0.25rem !important;
    margin-bottom: 0.4rem !important;
    margin-top: 0.5rem !important;
    text-align: left !important;
    font-family: "Inter", sans-serif !important;
    font-weight: 700 !important;
    color: #263149 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
  }

  .contract-body h2 {
    font-size: 12pt !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.3rem !important;
    border-left: 3px solid #2EAC6D !important;
    padding-left: 0.75rem !important;
    font-family: "Inter", sans-serif !important;
    font-weight: 700 !important;
    color: #263149 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
  }

  .contract-body h3 {
    font-size: 11pt !important;
    margin-top: 0.4rem !important;
    margin-bottom: 0.2rem !important;
    color: #374151 !important;
    font-family: "Inter", sans-serif !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
  }

  .contract-body p {
    margin-top: 0 !important;
    margin-bottom: 0.35rem !important;
    text-align: justify !important;
    text-indent: 0.35in !important;
    line-height: 1.45 !important;
  }

  .contract-body strong {
    font-weight: 700 !important;
    color: #263149 !important;
    font-family: "Inter", sans-serif !important;
  }

  .contract-body .section-number {
    font-weight: 700 !important;
    color: #263149 !important;
    font-family: "Inter", sans-serif !important;
    font-size: 11pt !important;
  }

  .contract-body .separator {
    text-align: center;
    color: #6b7280;
    margin: 0.5rem 0;
    font-size: 10pt;
    font-weight: 300;
    letter-spacing: 1px;
    border-top: 1px solid #e5e7eb;
    padding-top: 0.35rem;
    width: 100%;
    overflow: hidden;
  }

  .contract-header {
    text-align: center;
    border-bottom: 2px solid #2EAC6D;
    padding-bottom: 0.5rem;
    margin-bottom: 0.15rem;
    margin-top: 0;
  }

  .contract-logo {
    max-width: 200px;
    height: auto;
    margin: 0 auto 1rem auto;
    display: block;
  }

  .contract-title {
    font-family: "Inter", sans-serif;
    font-size: 24pt;
    font-weight: 700;
    color: #263149;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.5px;
  }

  .contract-subtitle {
    font-size: 12pt;
    color: #64748b;
    font-weight: 500;
    margin: 0;
  }





  .contract-body p.no-indent {
    text-indent: 0;
  }

  .contract-body .party-section {
    background: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    margin: 0.35rem 0;
    border-left: 3px solid #2EAC6D;
    width: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }

  .contract-body .party-section p {
    margin-bottom: 0.15rem !important;
    text-indent: 0 !important;
    line-height: 1.35 !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  .contract-body strong {
    font-weight: 600;
    color: #263149;
  }

  .contract-body ul, .contract-body ol {
    margin: 0.25rem 0;
    padding-left: 1.5rem;
  }

  .contract-body li {
    margin-bottom: 0.25rem;
    line-height: 1.5;
  }


  .contract-body .subsection {
    margin-left: 1rem;
  }

  .contract-body .signature-section {
    margin-top: 1rem;
    padding: 1rem;
    border-top: 2px solid #2EAC6D;
    background: #f8fafc;
    border-radius: 6px;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .contract-body .signature-line {
    border-bottom: 2px solid #263149;
    width: 350px;
    margin: 1rem 0;
    height: 2rem;
  }

  .contract-body .signature-block {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .contract-body .signature-label {
    font-size: 12pt !important;
    font-weight: 700 !important;
    color: #263149 !important;
    margin-bottom: 1rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
  }

  .contract-body .signature-details {
    font-size: 10pt !important;
    margin: 0.5rem 0 !important;
    color: #374151 !important;
  }

  .contract-body .exhibit-content {
    margin-top: 0.5rem;
  }

  .contract-body .requirements-list {
    margin: 0.35rem 0;
    padding-left: 0.75rem;
    border-left: 2px solid #2EAC6D;
    background: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
  }

  .contract-body .exhibit-section {
    background: #ffffff;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    margin: 0.5rem 0;
    border-radius: 4px;
    box-shadow: none;
    width: 100%;
    overflow: hidden;
  }

  .contract-body .exhibit-title {
    font-family: "Inter", sans-serif;
    font-size: 14pt;
    font-weight: 700;
    color: #263149;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.25rem;
  }

  .contract-body .payment-structure {
    background: #F0FAF5;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #5BC894;
    margin: 0.5rem 0;
  }

  .contract-body .separator {
    text-align: center;
    color: #6b7280;
    margin: 0.5rem 0;
    font-size: 10pt;
    font-weight: 300;
    letter-spacing: 1px;
    border-top: 1px solid #e5e7eb;
    padding-top: 0.35rem;
    width: 100%;
    overflow: hidden;
  }

  .contract-body .recitals {
    font-style: italic;
    margin: 0.5rem 0;
  }

  .contract-body .recitals p {
    text-indent: 0;
    margin-bottom: 0.2rem;
  }

  .print-only {
    display: none;
  }

  @media (max-width: 768px) {
    .contract-body {
      padding: 1rem;
      margin: 0.5rem;
      border-radius: 8px;
    }
    
    .contract-body h1 {
      font-size: 14pt;
    }
    
    .contract-body h2 {
      font-size: 12pt;
    }
    
    .contract-body h3 {
      font-size: 11pt;
    }
    
    .party-section {
      padding: 1rem;
    }
    
    .signature-section {
      margin-left: 0;
      margin-right: 0;
      padding: 1rem;
    }
    
    .signature-line {
      width: 250px;
    }
    
    .exhibit-section {
      padding: 1rem;
    }
  }

  @media (max-width: 640px) {
    .card-shell {
      border-radius: 18px;
    }
    
    .contract-body {
      padding: 0.75rem;
      margin: 0.25rem;
    }
    
    .contract-body h1 {
      font-size: 12pt;
    }
    
    .contract-body h2 {
      font-size: 11pt;
    }
    
    .contract-body h3 {
      font-size: 10pt;
    }
    
    .signature-line {
      width: 200px;
    }
  }

  @media print {
    body {
      margin: 0;
      background: #ffffff !important;
    }

    .app-shell,
    .app-shell * {
      box-shadow: none !important;
      background: transparent !important;
    }

    .card-shell,
    .highlight-banner {
      border: none !important;
      background: transparent !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .contract-body {
      max-height: none !important;
      overflow: visible !important;
      white-space: normal !important;
      font-size: 10pt !important;
      line-height: 1.4 !important;
      padding: 0.5in !important;
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      max-width: none !important;
    }

    .contract-body h1 {
      font-size: 14pt !important;
      color: #000 !important;
      border-bottom: 2px solid #000 !important;
    }

    .contract-body h2 {
      font-size: 12pt !important;
      color: #000 !important;
      border-left: none !important;
      padding-left: 0 !important;
    }

    .contract-body h3 {
      font-size: 11pt !important;
      color: #000 !important;
    }

    .contract-body strong {
      color: #000 !important;
    }

    .contract-body .section-number {
      color: #000 !important;
    }

    .party-section {
      background: transparent !important;
      border: 1px solid #000 !important;
      border-left: 3px solid #000 !important;
    }

    .signature-section {
      background: transparent !important;
      border: 1px solid #000 !important;
      border-top: 3px solid #000 !important;
    }

    .signature-block {
      background: transparent !important;
      border: 1px solid #000 !important;
    }

    .signature-line {
      border-bottom: 1px solid #000 !important;
    }

    .exhibit-section {
      background: transparent !important;
      border: 1px solid #000 !important;
      border-left: 3px solid #000 !important;
    }

    .exhibit-title {
      color: #000 !important;
      border-bottom: 1px solid #000 !important;
    }

    .requirements-list {
      background: transparent !important;
      border-left: 2px solid #000 !important;
    }

    .separator {
      color: #000 !important;
    }

    .hide-on-print {
      display: none !important;
    }

    .print-only {
      display: block !important;
    }
  }
`;

const ensureValue = (value, fallback = "Not Provided") => {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : fallback;
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not Provided";
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return ensureValue(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numeric);
};

const joinList = (items, emptyLabel = "None specified") => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="no-indent">${emptyLabel}</p>`;
  }
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
};

const deriveGoverningLaw = (buyerAddress, publisherAddress) => {
  const combined = `${buyerAddress || ""} ${publisherAddress || ""}`;
  const stateMatch = combined.match(
    /\b(A[KLZR]|C[AOT]|DE|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])\b/,
  );
  if (stateMatch) {
    return `the State of ${stateMatch[0]}`;
  }
  return "the State of Delaware";
};

const buildContractTemplate = (
  formData,
  buyerSignatureData = null,
  publisherSignatureData = null,
) => {
  const effectiveDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const governingLaw = deriveGoverningLaw(
    formData?.buyer?.address,
    formData?.publisher?.address,
  );

  const brokerLiabilityClause = formData?.brokerLiability
    ? "The Buyer/Broker expressly accepts financial liability for all Qualified Calls delivered under this Insertion Order in the event the underlying advertiser or end-customer fails to remit payment. Buyer will remit payment to Publisher irrespective of downstream collections and shall not offset or delay payment while a consumer dispute is investigated."
    : "The Buyer/Broker does not accept downstream payment liability. Publisher reserves the right to suspend or terminate routing with immediate effect if payment disputes exceed reasonable thresholds or if ageing AR exceeds agreed credit limits.";

  const datapassClause =
    formData?.datapass === "Yes"
      ? `Publisher will transmit the datapass payload in real time to the endpoint designated by Buyer (currently ${ensureValue(
          formData.datapassPostUrl,
          "Not Provided",
        )}). Buyer warrants that its systems are hardened, secured, and compliant with all data privacy requirements. Buyer shall acknowledge receipt of each lead within two minutes. Required datapass fields: ${joinList(
          formData?.datapassFields,
          "No additional datapass fields selected",
        )}`
      : "No datapass payload will be transmitted under this Agreement. Should Buyer later request datapass enablement, the parties must execute a written addendum setting forth security, retention, and processing requirements.";

  const acaHealthClause =
    formData?.type === "ACA Health"
      ? formData?.acaSubType === "CPL"
        ? `

<h1>5.6 ACA HEALTH CPL CALL REQUIREMENTS</h1>

<p><span class="section-number">5.6.1</span> A "Qualified Call" means a live inbound telephone call from a verified consumer actively seeking ACA health insurance information or enrollment assistance, where the call duration meets or exceeds the Buffer Time threshold of ${ensureValue(formData?.acaCplBufferTime)} seconds.</p>

<p><span class="section-number">5.6.2</span> Calls must originate from consumers who have expressed genuine interest in ACA health insurance products and have provided verifiable contact information.</p>

<h1>5.7 PAYMENT TERMS</h1>

<p><span class="section-number">5.7.1</span> Payout per Qualified Call: Buyer shall pay Publisher ${formatCurrency(formData?.acaCplPayout || "Not Provided")} for each Qualified Call that meets or exceeds the ${ensureValue(formData?.acaCplBufferTime)}-second duration threshold.</p>

<p><span class="section-number">5.7.2</span> Calls that do not meet the minimum duration threshold shall not be billable and no payment shall be owed.</p>

<p><span class="section-number">5.7.3</span> <strong>NO REFUNDS POLICY:</strong> Buyer acknowledges and agrees that once payment has been made for any Qualified Call, no refunds will be provided under any circumstances. This no-refund policy is final and non-negotiable.</p>

<p><span class="section-number">5.7.4</span> <strong>CREDIT POLICY:</strong> Publisher may, in its sole discretion, choose to provide credits for specific calls on a case-by-case basis. Credits are a courtesy, not an obligation.</p>

<h1>5.8 CALL QUALITY AND COMPLIANCE</h1>

<p><span class="section-number">5.8.1</span> All calls must comply with CMS Medicare Communications and Marketing Guidelines as applicable to ACA health insurance products.</p>

<p><span class="section-number">5.8.2</span> Publisher shall maintain call recordings for a minimum of five (5) years for compliance and audit purposes.</p>

<p><span class="section-number">5.8.3</span> Publisher shall ensure all marketing and advertising materials comply with applicable state and federal insurance regulations.</p>

<h1>5.9 BUYER OBLIGATIONS</h1>

<p><span class="section-number">5.9.1</span> Buyer shall maintain adequate staffing and systems to handle the volume of Qualified Calls delivered.</p>

<p><span class="section-number">5.9.2</span> Buyer shall provide properly licensed and trained insurance agents to handle ACA health insurance inquiries and enrollments.</p>

<p><span class="section-number">5.9.3</span> Buyer shall submit call disputes within seventy-two (72) hours of call receipt. Failure to timely dispute constitutes acceptance of the call as Qualified.</p>`
        : formData?.acaSubType === "CPA"
          ? `

<h1>5.6 ACA HEALTH CPA ENROLLMENT REQUIREMENTS</h1>

<p><span class="section-number">5.6.1</span> A "Qualified Enrollment" means a completed ACA health insurance application that results in an active policy issued by a participating carrier, where the enrollee has been verified as eligible and has completed all required documentation.</p>

<p><span class="section-number">5.6.2</span> Publisher shall ensure all enrollments are compliant with CMS guidelines, state regulations, and carrier requirements.</p>

<h1>5.7 PAYMENT TERMS</h1>

<p><span class="section-number">5.7.1</span> Payout per Qualified Enrollment: Buyer shall pay Publisher ${formatCurrency(formData?.acaCpaPayout || "Not Provided")} for each Qualified Enrollment resulting in an active, paid policy.</p>

<p><span class="section-number">5.7.2</span> Payment is contingent upon the policy being issued and the first premium being paid by the enrollee. No payment shall be owed for applications that are not approved, cancelled before issuance, or where the first premium is not paid.</p>

<p><span class="section-number">5.7.3</span> <strong>REPLACEMENT POLICY:</strong> Publisher will replace enrollments where the insured does not pay their first premium. Publisher agrees to provide replacement enrollments at no additional cost to Buyer when a CPA conversion is charged but the insured fails to remit payment for their first premium.</p>

<h1>5.8 ENROLLMENT QUALITY AND COMPLIANCE</h1>

<p><span class="section-number">5.8.1</span> All enrollments must comply with CMS regulations, state insurance regulations, and carrier underwriting guidelines.</p>

<p><span class="section-number">5.8.2</span> Publisher shall maintain detailed records of all enrollment activities, including consumer consent documentation, for a minimum of five (5) years.</p>

<p><span class="section-number">5.8.3</span> Publisher shall ensure all agents involved in the enrollment process maintain active and valid insurance licenses in the applicable states.</p>

<h1>5.9 BUYER OBLIGATIONS</h1>

<p><span class="section-number">5.9.1</span> Buyer shall provide carrier access, training materials, and administrative support to facilitate the enrollment process.</p>

<p><span class="section-number">5.9.2</span> Buyer shall process and submit applications to carriers in a timely manner.</p>

<p><span class="section-number">5.9.3</span> Buyer shall provide monthly reports showing all enrollments, active policies, and payment calculations.</p>`
          : `

<h1>5.6 AGENT RECRUITMENT SERVICES</h1>

<p><span class="section-number">5.6.1</span> Recruiter shall identify, recruit, and hire qualified insurance agents for the Agency in two categories:</p>
<p style="margin-left: 1rem;">(a) NPN Override Agents: Licensed insurance agents who provide their National Producer Number (NPN) to the Agency for contracting purposes to sell ACA health insurance policies under their license</p>
<p style="margin-left: 1rem;">(b) Direct Sales Agents: Licensed insurance agents who will sell ACA health insurance policies directly to consumers through the Agency's platform</p>

<h1>5.7 PAYMENT STRUCTURE AND TERMS</h1>

<p><span class="section-number">5.7.1</span> NPN Override Payments: Recruiter shall receive ${formatCurrency(
            formData?.acaNpnOverride || "Not Provided",
          )} per month for each Active Policy sold under recruited agents' NPN numbers. This payment continues monthly for as long as the customer maintains their policy and the policy remains in force with the carrier.</p>

<p><span class="section-number">5.7.2</span> Per Policy Payments: Recruiter shall receive ${formatCurrency(
            formData?.acaPerPolicy || "Not Provided",
          )} for each ACA policy sale completed by recruited agents, paid weekly (one week after the sale is completed and confirmed by the carrier).</p>

<p><span class="section-number">5.7.3</span> Agent Bonus Payments: Recruiter shall receive an additional ${formatCurrency(
            formData?.acaAgentBonus || "Not Provided",
          )} per month for each Active Policy sold by recruited agents, paid monthly with the same residual structure as NPN Override payments.</p>

<p><span class="section-number">5.7.4</span> Payment Timing: Sales completed before December 8th of each year will count toward January residual payments. Sales completed on or after December 8th will count toward February residual payments.</p>

<p><span class="section-number">5.7.5</span> Payment Contingency: All payments are contingent upon the policy being issued, paid by the carrier, and remaining in good standing. No payments will be made for policies that are not issued, cancelled, or fail to receive carrier payment.</p>

<p><span class="section-number">5.7.6</span> Residual Payment Structure: Residual payments are made on an "as earned" basis each month, meaning Recruiter is only paid for policies that remain active and in good standing with the carrier.</p>

<h1>5.8 RECRUITER OBLIGATIONS</h1>

<p><span class="section-number">5.8.1</span> Recruiter must identify, recruit, and hire qualified agents for both NPN Override and Direct Sales positions, ensuring all agents meet the Agency's qualification standards.</p>

<p><span class="section-number">5.8.2</span> Recruiter must verify and maintain records of all agent licenses and ensure compliance with state insurance regulations at the time of recruitment.</p>

<p><span class="section-number">5.8.3</span> Recruiter must provide initial onboarding support for recruited agents during their first 30 days with the Agency.</p>


<p><span class="section-number">5.8.5</span> Recruiter must maintain detailed records of all recruitment activities, including candidate sourcing, interview processes, and hiring decisions.</p>

<p><span class="section-number">5.8.6</span> Recruiter must provide monthly recruitment reports showing the number of agents recruited, hired, and currently active with the Agency.</p>

<h1>5.9 AGENCY OBLIGATIONS</h1>

<p><span class="section-number">5.9.1</span> Agency will provide inbound calls and call transfers to recruited agents through its established systems.</p>

<p><span class="section-number">5.9.2</span> Agency will provide training materials, sales scripts, and support for recruited agents.</p>

<p><span class="section-number">5.9.3</span> Agency will handle carrier contracting, policy administration, and customer service for recruited agents.</p>

<p><span class="section-number">5.9.4</span> Agency will provide monthly reports to Recruiter showing policy sales, active policies, and payment calculations.</p>

<p><span class="section-number">5.9.5</span> Agency will implement quality assurance measures to monitor agent performance and ensure compliance.</p>

<p><span class="section-number">5.9.6</span> Agency will provide necessary technology platforms and tools for recruited agents to perform their duties.</p>`
      : "";

  const requirementsSection = joinList(formData?.requirements);

  const getContractTitle = () => {
    switch (formData?.type) {
      case "ACA Health":
        return formData?.acaSubType === "CPL"
          ? "ACA HEALTH INSURANCE CPL AGREEMENT"
          : formData?.acaSubType === "CPA"
            ? "ACA HEALTH INSURANCE CPA AGREEMENT"
            : "ACA INSURANCE AGENCY RECRUITMENT AGREEMENT";
      case "Employment Contract":
        return "EMPLOYMENT AGREEMENT";
      case "Auto Insurance LLC Operating Agreement":
        return "LIMITED LIABILITY COMPANY OPERATING AGREEMENT";
      default:
        return "PAY PER CALL INSERTION ORDER AGREEMENT";
    }
  };

  const getPartyLabels = () => {
    switch (formData?.type) {
      case "ACA Health":
        return formData?.acaSubType === "CPL" || formData?.acaSubType === "CPA"
          ? { buyer: "Buyer", publisher: "Publisher" }
          : { buyer: "ACA Insurance Agency", publisher: "Agent Recruiter" };
      case "Employment Contract":
        return { buyer: "Employer", publisher: "Employee" };
      case "Auto Insurance LLC Operating Agreement":
        return {
          buyer: "Company Information",
          publisher: "Member Information",
        };
      default:
        return { buyer: "Buyer/Broker", publisher: "Publisher" };
    }
  };

  const partyLabels = getPartyLabels();

  // Generate LLC Operating Agreement
  const generateLLCContract = (formData, effectiveDate) => {
    return `<style>
.contract-body {
  font-family: "Crimson Text", Georgia, "Times New Roman", serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1a1a1a;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.4in 0.75in;
  background: white;
  box-shadow: 0 4px 25px rgba(0,0,0,0.08);
  border-radius: 12px;
  white-space: normal;
  border: 1px solid #e5e7eb;
  box-sizing: border-box;
}

.contract-header {
  text-align: center;
  border-bottom: 2px solid #2EAC6D;
  padding-bottom: 0.5rem;
  margin-bottom: 0.15rem;
  margin-top: 0;
}

.contract-logo {
  max-width: 200px;
  height: auto;
  margin: 0 auto 1rem auto;
  display: block;
}

.contract-header h1 {
  font-size: 14pt;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #263149;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: "Inter", sans-serif;
}

.contract-subtitle {
  font-size: 12pt;
  margin: 0.25rem 0;
  color: #64748b;
  font-weight: 500;
}

.separator {
  text-align: center;
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 10pt;
  font-weight: 300;
  letter-spacing: 1px;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.35rem;
  width: 100%;
  overflow: hidden;
}

.section {
  margin-bottom: 0.75rem;
}

.section h1 {
  font-size: 13pt;
  font-weight: 700;
  margin: 0.5rem 0 0.3rem 0;
  color: #263149;
  border-bottom: 2px solid #2EAC6D;
  padding-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: "Inter", sans-serif;
}

.section h2 {
  font-size: 12pt;
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 0.3rem;
  border-left: 3px solid #2EAC6D;
  padding-left: 0.75rem;
  color: #263149;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: "Inter", sans-serif;
}

.section p {
  margin: 0.25rem 0;
  text-align: justify;
}

.section ul, .section ol {
  margin: 0.25rem 0;
  padding-left: 1.5rem;
}

.section li {
  margin: 0.25rem 0;
}

.table-of-contents {
  margin: 1rem 0;
}

.table-of-contents h2 {
  font-size: 14pt;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
  color: #263149;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: "Inter", sans-serif;
}

.toc-list {
  list-style: none;
  padding: 0;
}

.toc-list li {
  margin: 0.5rem 0;
  padding: 0.25rem 0;
  border-bottom: 1px dotted #ccc;
}

.toc-list a {
  text-decoration: none;
  color: #263149;
  font-weight: 500;
}

.toc-list a:hover {
  text-decoration: underline;
}

.table-container {
  margin: 1rem 0;
  overflow-x: auto;
}

.member-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 10pt;
}

.member-table th {
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
  font-weight: 700;
  color: #263149;
  font-family: "Inter", sans-serif;
}

.member-table td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  color: #1a1a1a;
}

.member-table tr:nth-child(even) {
  background-color: #f8fafc;
}

.definition-box {
  background-color: #f8fafc;
  border-left: 4px solid #2EAC6D;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  border-top: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.definition-box h3 {
  margin: 0 0 0.5rem 0;
  font-size: 12pt;
  font-weight: 700;
  color: #263149;
  font-family: "Inter", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.definition-box p {
  margin: 0.25rem 0;
  font-size: 10pt;
}

.signature-section {
  margin-top: 1.5rem;
  page-break-inside: avoid;
}

.signature-line {
  border-bottom: 2px solid #263149;
  width: 200px;
  display: inline-block;
  margin: 0 1rem;
}

.notary-section {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #2EAC6D;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
}

.notary-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 12pt;
  font-weight: 700;
  color: #263149;
  font-family: "Inter", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notary-section p {
  margin: 0.25rem 0;
  font-size: 10pt;
}
</style>

<div class="contract-body">
<div class="contract-header">
<img src="${
      typeof window !== "undefined"
        ? window.location.origin + "/pvnvoice.png"
        : "/pvnvoice.png"
    }" alt="PVNVoice Logo" class="contract-logo" onerror="this.style.display='none'" />
<h1>LIMITED LIABILITY COMPANY OPERATING AGREEMENT</h1>
<p class="contract-subtitle">${ensureValue(formData?.llcCompanyName)} LLC</p>
<p class="contract-subtitle">Effective Date: ${effectiveDate}</p>
</div>

<div class="separator"></div>

<div class="table-of-contents">
<h2>TABLE OF CONTENTS</h2>
<ol class="toc-list">
<li><a href="#section1">FORMATION AND ORGANIZATION</a></li>
<li><a href="#section2">CAPITAL CONTRIBUTIONS AND FINANCIAL STRUCTURE</a></li>
<li><a href="#section3">MEMBERSHIP INTERESTS AND OWNERSHIP</a></li>
<li><a href="#section4">MANAGEMENT AND GOVERNANCE</a></li>
<li><a href="#section5">OPERATIONAL RESPONSIBILITIES</a></li>
<li><a href="#section6">PROFIT AND LOSS ALLOCATION</a></li>
<li><a href="#section7">DISTRIBUTIONS AND CAPITAL RECOVERY</a></li>
<li><a href="#section8">INSURANCE INDUSTRY COMPLIANCE</a></li>
<li><a href="#section9">TRANSFER RESTRICTIONS</a></li>
<li><a href="#section10">DISSOLUTION AND WINDING UP</a></li>
<li><a href="#section11">MISCELLANEOUS PROVISIONS</a></li>
</ol>
</div>

<div class="separator"></div>

<div class="section" id="section1">
<h1>1. FORMATION AND ORGANIZATION</h1>

<h2>1.1 Formation</h2>
<p>${ensureValue(
      formData?.llcCompanyName,
    )}, LLC (the "Company") is a limited liability company formed under the laws of ${ensureValue(
      formData?.llcState,
    )} on ${ensureValue(
      formData?.llcFormationDate,
    )} for the purpose of operating as a licensed auto insurance agency.</p>

<h2>1.2 Principal Business</h2>
<p>The Company's principal business is to:</p>
<ul>
<li>Act as an independent insurance agency for auto insurance products</li>
<li>Market, sell, and service auto insurance policies</li>
<li>Provide insurance consulting and advisory services</li>
<li>Engage in related insurance activities as permitted by law</li>
</ul>

<h2>1.3 Registered Office</h2>
<p>The Company's registered office is located at ${ensureValue(
      formData?.llcRegisteredAddress,
    )}.</p>

<h2>1.4 Term</h2>
<p>The Company shall continue in existence until dissolved in accordance with this Agreement or by operation of law.</p>
</div>

<div class="separator"></div>

<div class="section" id="section2">
<h1>2. CAPITAL CONTRIBUTIONS AND FINANCIAL STRUCTURE</h1>

<h2>2.1 Initial Capital Contributions</h2>
<p>The Members have made the following initial capital contributions:</p>

<div class="table-container">
<table class="member-table">
<thead>
<tr>
<th>Member</th>
<th>Contribution</th>
<th>Percentage</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>${ensureValue(formData?.llcInvestorName)}</td>
<td>$${ensureValue(formData?.llcInvestorContribution)}</td>
<td>${ensureValue(formData?.llcInvestorOwnership)}</td>
<td>Cash + Working Capital</td>
</tr>
<tr>
<td>${ensureValue(formData?.llcMember1Name)}</td>
<td>$${ensureValue(formData?.llcMember1Contribution)}</td>
<td>${ensureValue(formData?.llcMember1Ownership)}</td>
<td>Services + Expertise</td>
</tr>
<tr>
<td>${ensureValue(formData?.llcMember2Name)}</td>
<td>$${ensureValue(formData?.llcMember2Contribution)}</td>
<td>${ensureValue(formData?.llcMember2Ownership)}</td>
<td>Services + Expertise</td>
</tr>
</tbody>
</table>
</div>

<h2>2.2 Additional Capital Requirements</h2>
<ul>
<li><strong>Working Capital Facility:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} agrees to provide working capital funding up to $${ensureValue(
      formData?.llcMaxWorkingCapital,
    )} to cover operating expenses until the Company achieves profitability</li>
<li><strong>Capital Call Procedures:</strong> Additional capital contributions may be required by majority vote of Members</li>
<li><strong>Priority Recovery:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} shall have priority in recovering working capital advances before profit distributions</li>
</ul>

<h2>2.3 Capital Account Maintenance</h2>
<p>Each Member's Capital Account shall be maintained in accordance with Treasury Regulation Section 1.704-1(b)(2)(iv).</p>

<h2>2.4 Monthly Operating Cost Structure</h2>
<p>The Company's estimated monthly operating costs to be covered by ${ensureValue(
      formData?.llcInvestorName,
    )}'s working capital facility:</p>
<ul>
<li><strong>Rent and Facilities:</strong> $${ensureValue(
      formData?.llcMonthlyRent,
    )} per month</li>
<li><strong>Utilities:</strong> $${ensureValue(
      formData?.llcMonthlyUtilities,
    )} per month</li>
<li><strong>Insurance:</strong> $${ensureValue(
      formData?.llcMonthlyInsurance,
    )} per month</li>
<li><strong>Software and Technology:</strong> $${ensureValue(
      formData?.llcMonthlySoftware,
    )} per month</li>
<li><strong>Marketing and Advertising:</strong> $${ensureValue(
      formData?.llcMonthlyMarketing,
    )} per month</li>
<li><strong>Salaries and Benefits:</strong> $${ensureValue(
      formData?.llcMonthlySalaries,
    )} per month</li>
<li><strong>Other Operating Expenses:</strong> $${ensureValue(
      formData?.llcMonthlyOther,
    )} per month</li>
<li><strong>Total Monthly Operating Costs:</strong> $${ensureValue(
      formData?.llcTotalMonthlyCosts,
    )} per month</li>
</ul>

<h2>2.5 Financial Projections and Break-Even Analysis</h2>
<ul>
<li><strong>Expected Monthly Revenue:</strong> $${ensureValue(
      formData?.llcExpectedMonthlyRevenue,
    )}</li>
<li><strong>Projected Break-Even Timeline:</strong> ${ensureValue(
      formData?.llcBreakEvenMonths,
    )} months from commencement</li>
<li><strong>Investor Return Timeline:</strong> ${ensureValue(
      formData?.llcInvestorReturnTimeline,
    )} months from commencement</li>
<li><strong>Exit Strategy:</strong> ${ensureValue(
      formData?.llcExitStrategy,
    )}</li>
<li><strong>Liquidation Preference:</strong> ${ensureValue(
      formData?.llcLiquidationPreference,
    )}</li>
</ul>

<div class="separator"></div>

<h1>3. MEMBERSHIP INTERESTS AND OWNERSHIP</h1>

<h2>3.1 Membership Interests</h2>
<p>The Company shall have the following membership interests:</p>
<ul>
<li><strong>${ensureValue(formData?.llcInvestorName)}:</strong> ${ensureValue(
      formData?.llcInvestorOwnership,
    )} (Managing Member/Investor)</li>
<li><strong>${ensureValue(formData?.llcMember1Name)}:</strong> ${ensureValue(
      formData?.llcMember1Ownership,
    )} (Operating Member)</li>
<li><strong>${ensureValue(formData?.llcMember2Name)}:</strong> ${ensureValue(
      formData?.llcMember2Ownership,
    )} (Operating Member)</li>
</ul>

<h2>3.2 Voting Rights</h2>
<ul>
<li><strong>Major Decisions:</strong> Require unanimous consent of all Members</li>
<li><strong>Operating Decisions:</strong> Require majority vote of Members</li>
<li><strong>Emergency Decisions:</strong> Managing Member may act unilaterally in emergencies</li>
</ul>

<h2>3.3 Management Structure</h2>
<ul>
<li><strong>Managing Member:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} (45% voting power)</li>
<li><strong>Operating Members:</strong> ${ensureValue(
      formData?.llcMember1Name,
    )} and ${ensureValue(formData?.llcMember2Name)} (27.5% each)</li>
</ul>

<div class="separator"></div>

<h1>4. MANAGEMENT AND GOVERNANCE</h1>

<h2>4.1 Board of Managers</h2>
<p>The Company shall be managed by a Board of Managers consisting of:</p>
<ul>
<li>${ensureValue(formData?.llcInvestorName)} (Chairman)</li>
<li>${ensureValue(formData?.llcMember1Name)} (Chief Operating Officer)</li>
<li>${ensureValue(formData?.llcMember2Name)} (Chief Marketing Officer)</li>
</ul>

<h2>4.2 Decision-Making Authority</h2>
<ul>
<li><strong>Strategic Decisions:</strong> Board approval required</li>
<li><strong>Operational Decisions:</strong> COO authority up to $${ensureValue(
      formData?.llcOperationalLimit,
    )}</li>
<li><strong>Marketing Decisions:</strong> CMO authority up to $${ensureValue(
      formData?.llcMarketingLimit,
    )}</li>
<li><strong>Financial Decisions:</strong> Chairman approval required for amounts over $${ensureValue(
      formData?.llcFinancialLimit,
    )}</li>
</ul>

<h2>4.3 Meeting Requirements</h2>
<ul>
<li><strong>Regular Meetings:</strong> Monthly board meetings</li>
<li><strong>Special Meetings:</strong> As needed with 48-hour notice</li>
<li><strong>Quorum:</strong> Majority of Members must be present</li>
<li><strong>Voting:</strong> Majority vote of present Members</li>
</ul>

<div class="separator"></div>

<h1>5. OPERATIONAL RESPONSIBILITIES</h1>

<h2>5.1 ${ensureValue(
      formData?.llcMember1Name,
    )} - Chief Operating Officer (${ensureValue(
      formData?.llcMember1Ownership,
    )})</h2>
<p><strong>Primary Responsibilities:</strong></p>
<ul>
<li>Carrier relationship management and contract negotiations</li>
<li>Agent recruitment, licensing, and training programs</li>
<li>Sales performance monitoring and reporting</li>
<li>Technology infrastructure (CRM, phone systems, software)</li>
<li>Compliance with insurance regulations</li>
<li>Quality assurance and customer service standards</li>
</ul>

<p><strong>Performance Metrics:</strong></p>
<ul>
<li>Maintain relationships with minimum ${ensureValue(
      formData?.llcMinCarriers,
    )} carriers</li>
<li>Achieve agent retention rate of ${ensureValue(
      formData?.llcAgentRetention,
    )}%</li>
<li>Meet quarterly sales targets of $${ensureValue(
      formData?.llcQuarterlyTargets,
    )}</li>
</ul>

<h2>5.2 ${ensureValue(
      formData?.llcMember2Name,
    )} - Chief Marketing Officer (${ensureValue(
      formData?.llcMember2Ownership,
    )})</h2>
<p><strong>Primary Responsibilities:</strong></p>
<ul>
<li>Lead generation and inbound call management</li>
<li>Call center operations and live transfer coordination</li>
<li>Marketing strategy and campaign management</li>
<li>Customer acquisition and retention programs</li>
<li>Digital marketing and online presence</li>
<li>Partnership development with lead providers</li>
</ul>

<p><strong>Performance Metrics:</strong></p>
<ul>
<li>Generate minimum ${ensureValue(
      formData?.llcMinLeads,
    )} qualified leads per month</li>
<li>Maintain lead conversion rate of ${ensureValue(
      formData?.llcConversionRate,
    )}%</li>
<li>Achieve cost per acquisition under $${ensureValue(formData?.llcMaxCPA)}</li>
</ul>

<h2>5.3 ${ensureValue(
      formData?.llcInvestorName,
    )} - Managing Member/Investor (${ensureValue(
      formData?.llcInvestorOwnership,
    )})</h2>
<p><strong>Primary Responsibilities:</strong></p>
<ul>
<li>Financial oversight and capital management</li>
<li>Strategic planning and business development</li>
<li>Risk management and compliance oversight</li>
<li>Investor relations and reporting</li>
<li>Legal and regulatory compliance</li>
<li>Exit strategy planning</li>
</ul>

<div class="separator"></div>

<h1>6. PROFIT AND LOSS ALLOCATION</h1>

<h2>6.1 Profit Allocation</h2>
<p>Net profits shall be allocated as follows:</p>
<ol>
<li><strong>First:</strong> Repayment of ${ensureValue(
      formData?.llcInvestorName,
    )}'s working capital advances</li>
<li><strong>Second:</strong> Return of capital contributions (pro rata)</li>
<li><strong>Third:</strong> Profit distributions according to ownership percentages:
<ul>
<li>${ensureValue(formData?.llcInvestorName)}: ${ensureValue(
      formData?.llcInvestorOwnership,
    )}</li>
<li>${ensureValue(formData?.llcMember1Name)}: ${ensureValue(
      formData?.llcMember1Ownership,
    )}</li>
<li>${ensureValue(formData?.llcMember2Name)}: ${ensureValue(
      formData?.llcMember2Ownership,
    )}</li>
</ul>
</li>
</ol>

<h2>6.2 Loss Allocation</h2>
<p>Net losses shall be allocated according to ownership percentages.</p>

<h2>6.3 Special Allocations</h2>
<ul>
<li><strong>Performance Bonuses:</strong> Up to ${ensureValue(
      formData?.llcBonusPercentage,
    )}% of net profits may be allocated as performance bonuses</li>
<li><strong>Management Fees:</strong> ${ensureValue(
      formData?.llcManagementFeePercentage,
    )}% management fee to ${ensureValue(
      formData?.llcInvestorName,
    )} for financial oversight</li>
</ul>

<div class="separator"></div>

<h1>7. DISTRIBUTIONS AND CAPITAL RECOVERY</h1>

<h2>7.1 Distribution Policy</h2>
<ul>
<li><strong>Quarterly Distributions:</strong> Distributions may be made quarterly upon Board approval</li>
<li><strong>Reserve Requirements:</strong> Maintain minimum cash reserves of $${ensureValue(
      formData?.llcMinReserves,
    )}</li>
<li><strong>Working Capital Recovery:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} shall recover working capital advances before other distributions</li>
</ul>

<h2>7.2 Capital Recovery Mechanism</h2>
<p><strong>For ${ensureValue(
      formData?.llcInvestorName,
    )}'s Investment Recovery:</strong></p>
<ol>
<li><strong>Priority Recovery:</strong> Working capital advances shall be recovered first from available cash flow</li>
<li><strong>Recovery Schedule:</strong> Minimum ${ensureValue(
      formData?.llcRecoveryPercentage,
    )}% of available cash flow until full recovery</li>
<li><strong>Interest on Advances:</strong> Working capital advances shall bear interest at ${ensureValue(
      formData?.llcInterestRate,
    )}% per annum</li>
<li><strong>Acceleration Rights:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} may accelerate recovery in case of material breach</li>
<li><strong>Security Interest:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} shall have a security interest in Company assets for unrecovered advances</li>
</ol>

<h2>7.3 Distribution Waterfall</h2>
<ol>
<li>Operating expenses and reserves</li>
<li>${ensureValue(
      formData?.llcInvestorName,
    )}'s working capital recovery (with interest)</li>
<li>Return of capital contributions</li>
<li>Profit distributions (${ensureValue(
      formData?.llcInvestorOwnership,
    )}/${ensureValue(formData?.llcMember1Ownership)}/${ensureValue(
      formData?.llcMember2Ownership,
    )})</li>
</ol>

<h2>7.4 Investor Return Plan and Exit Strategy</h2>
<p><strong>Return Timeline:</strong> ${ensureValue(
      formData?.llcInvestorName,
    )} expects to recover their investment within ${ensureValue(
      formData?.llcInvestorReturnTimeline,
    )} months from commencement of operations.</p>

<p><strong>Break-Even Projection:</strong> The Company is projected to achieve break-even status within ${ensureValue(
      formData?.llcBreakEvenMonths,
    )} months, with expected monthly revenue of $${ensureValue(
      formData?.llcExpectedMonthlyRevenue,
    )} against monthly operating costs of $${ensureValue(
      formData?.llcTotalMonthlyCosts,
    )}.</p>

<p><strong>Exit Strategy:</strong> The Company's planned exit strategy is ${ensureValue(
      formData?.llcExitStrategy,
    )}. In the event of liquidation or sale, ${ensureValue(
      formData?.llcInvestorName,
    )} shall have a liquidation preference of ${ensureValue(
      formData?.llcLiquidationPreference,
    )}.</p>

<p><strong>Monthly Cost Coverage:</strong> During the initial operating period, ${ensureValue(
      formData?.llcInvestorName,
    )} will cover monthly operating costs of approximately $${ensureValue(
      formData?.llcTotalMonthlyCosts,
    )}, including rent ($${ensureValue(
      formData?.llcMonthlyRent,
    )}), utilities ($${ensureValue(
      formData?.llcMonthlyUtilities,
    )}), insurance ($${ensureValue(
      formData?.llcMonthlyInsurance,
    )}), software ($${ensureValue(
      formData?.llcMonthlySoftware,
    )}), marketing ($${ensureValue(
      formData?.llcMonthlyMarketing,
    )}), salaries ($${ensureValue(
      formData?.llcMonthlySalaries,
    )}), and other expenses ($${ensureValue(formData?.llcMonthlyOther)}).</p>

<div class="separator"></div>

<h1>8. INSURANCE INDUSTRY COMPLIANCE</h1>

<h2>8.1 Licensing Requirements</h2>
<ul>
<li>All Members must maintain appropriate insurance licenses</li>
<li>Company must maintain agency licenses in all operating states</li>
<li>Compliance with state insurance department regulations</li>
</ul>

<h2>8.2 Carrier Relationships</h2>
<ul>
<li>Maintain relationships with minimum ${ensureValue(
      formData?.llcMinCarriers,
    )} A-rated carriers</li>
<li>Comply with carrier appointment agreements</li>
<li>Meet carrier production and quality requirements</li>
</ul>

<h2>8.3 Regulatory Compliance</h2>
<ul>
<li><strong>NAIC Compliance:</strong> Adhere to National Association of Insurance Commissioners standards</li>
<li><strong>State Regulations:</strong> Comply with all applicable state insurance laws</li>
<li><strong>E&O Insurance:</strong> Maintain errors and omissions insurance of minimum $${ensureValue(
      formData?.llcEOCoverage,
    )}</li>
<li><strong>Bonding:</strong> Maintain surety bonds as required by state law</li>
</ul>

<h2>8.4 Data Security and Privacy</h2>
<ul>
<li><strong>HIPAA Compliance:</strong> Protect customer health information</li>
<li><strong>PCI Compliance:</strong> Secure payment card information</li>
<li><strong>State Privacy Laws:</strong> Comply with applicable state privacy regulations</li>
<li><strong>Cybersecurity:</strong> Implement industry-standard security measures</li>
</ul>

<div class="separator"></div>

<h1>9. TRANSFER RESTRICTIONS</h1>

<h2>9.1 Transfer Limitations</h2>
<ul>
<li>No Member may transfer their interest without Board approval</li>
<li>Right of first refusal to other Members</li>
<li>Valuation procedures for transfers</li>
<li>Tag-along and drag-along rights</li>
</ul>

<h2>9.2 Buy-Sell Provisions</h2>
<ul>
<li><strong>Triggering Events:</strong> Death, disability, bankruptcy, or voluntary departure</li>
<li><strong>Valuation Method:</strong> Independent appraisal or formula-based valuation</li>
<li><strong>Payment Terms:</strong> Installment payments over ${ensureValue(
      formData?.llcPaymentPeriod,
    )} years</li>
<li><strong>Insurance Requirements:</strong> Life and disability insurance to fund buyouts</li>
</ul>

<div class="separator"></div>

<h1>10. DISSOLUTION AND WINDING UP</h1>

<h2>10.1 Dissolution Events</h2>
<ul>
<li>Unanimous consent of all Members</li>
<li>Bankruptcy of the Company</li>
<li>Expiration of the Company term</li>
<li>Judicial dissolution</li>
</ul>

<h2>10.2 Winding Up Procedures</h2>
<p><strong>Liquidation Order:</strong></p>
<ol>
<li>Pay creditors</li>
<li>Return ${ensureValue(
      formData?.llcInvestorName,
    )}'s working capital advances</li>
<li>Return capital contributions</li>
<li>Distribute remaining assets according to ownership percentages</li>
</ol>

<h2>10.3 Continuation Rights</h2>
<ul>
<li>Remaining Members may continue the business</li>
<li>Purchase price for departing Member's interest</li>
<li><strong>Note:</strong> Non-compete obligations are illegal as of October 2025</li>
</ul>

<div class="separator"></div>

<h1>11. MISCELLANEOUS PROVISIONS</h1>

<h2>11.1 Governing Law</h2>
<p>This Agreement shall be governed by the laws of ${ensureValue(
      formData?.llcState,
    )}.</p>

<h2>11.2 Dispute Resolution</h2>
<ul>
<li><strong>Mediation:</strong> Good faith mediation before litigation</li>
<li><strong>Arbitration:</strong> Binding arbitration for unresolved disputes</li>
<li><strong>Jurisdiction:</strong> ${ensureValue(
      formData?.llcJurisdiction,
    )} courts for enforcement</li>
</ul>

<h2>11.3 Confidentiality</h2>
<ul>
<li>All Members agree to maintain confidentiality of Company information</li>
<li>Non-disclosure of customer lists, carrier relationships, and business strategies</li>
<li><strong>Note:</strong> Non-compete clauses are illegal as of October 2025 and have been removed from this agreement</li>
</ul>

<h2>11.4 Amendment Procedures</h2>
<ul>
<li>Amendments require unanimous consent of all Members</li>
<li>Written notice of proposed amendments</li>
<li>${ensureValue(
      formData?.llcAmendmentNoticePeriod,
    )} days for consideration</li>
</ul>

<h2>11.5 Succession Planning</h2>
<ul>
<li><strong>Key Person Insurance:</strong> Life insurance on key Members</li>
<li><strong>Succession Rights:</strong> Designated successors for key positions</li>
<li><strong>Training Requirements:</strong> Cross-training for critical functions</li>
</ul>

<h2>11.6 Technology and Intellectual Property</h2>
<ul>
<li><strong>IP Ownership:</strong> Company owns all intellectual property developed</li>
<li><strong>Software Licenses:</strong> Proper licensing of all software and systems</li>
<li><strong>Data Ownership:</strong> Company owns all customer and business data</li>
</ul>

<div class="separator"></div>

<h1>EXECUTION</h1>

<p>IN WITNESS WHEREOF, the Members have executed this Operating Agreement as of ${ensureValue(
      formData?.llcExecutionDate,
    )}.</p>

<p><strong>${ensureValue(
      formData?.llcInvestorName,
    )}</strong> (Managing Member)<br>
Signature: _________________________<br>
Date: _____________________________</p>

<p><strong>${ensureValue(
      formData?.llcMember1Name,
    )}</strong> (Operating Member)<br>
Signature: _________________________<br>
Date: _____________________________</p>

<p><strong>${ensureValue(
      formData?.llcMember2Name,
    )}</strong> (Operating Member)<br>
Signature: _________________________<br>
Date: _____________________________</p>

<div class="separator"></div>

<h1>NOTARY ACKNOWLEDGMENT</h1>

<p>State of ${ensureValue(formData?.llcState)}<br>
County of ${ensureValue(formData?.llcCounty)}</p>

<p>On this ${ensureValue(
      formData?.llcExecutionDate,
    )}, before me personally appeared ${ensureValue(
      formData?.llcInvestorName,
    )}, ${ensureValue(formData?.llcMember1Name)}, and ${ensureValue(
      formData?.llcMember2Name,
    )}, who proved to me on the basis of satisfactory evidence to be the persons whose names are subscribed to the within instrument and acknowledged to me that they executed the same in their authorized capacities, and that by their signatures on the instrument the persons, or the entity upon behalf of which the persons acted, executed the instrument.</p>

<p>I certify under PENALTY OF PERJURY under the laws of the State of ${ensureValue(
      formData?.llcState,
    )} that the foregoing paragraph is true and correct.</p>

<p>WITNESS my hand and official seal.</p>

<p>Signature: _________________________<br>
Notary Public<br>
My Commission Expires: ${ensureValue(formData?.llcNotaryExpiration)}</p>

<div class="separator"></div>

<p><em>This Operating Agreement represents a comprehensive framework for the operation of ${ensureValue(
      formData?.llcCompanyName,
    )} LLC as a professional auto insurance agency. All variable fields should be customized based on specific business requirements and legal counsel recommendations.</em></p>

</div>`;
  };

  // Handle LLC Operating Agreement separately
  if (
    formData?.type === "Auto Insurance LLC Operating Agreement" ||
    formData?.vertical === "LLC Operating Agreement"
  ) {
    return generateLLCContract(formData, effectiveDate);
  }

  return `<div class="contract-body">
<div class="contract-header">
<img src="${
    typeof window !== "undefined"
      ? window.location.origin + "/pvnvoice.png"
      : "/pvnvoice.png"
  }" alt="PVNVoice Logo" class="contract-logo" onerror="this.style.display='none'" />
<h1>${getContractTitle()}</h1>
<p class="contract-subtitle">Effective Date: ${effectiveDate}</p>
</div>

<div class="separator"></div>

<h2>BETWEEN</h2>

<div class="party-section">
<p class="no-indent"><strong>${partyLabels.buyer}:</strong> ${ensureValue(
    formData?.buyer?.companyName,
  )} (${ensureValue(formData?.buyer?.entityType)})</p>
<p class="no-indent"><strong>Principal Address:</strong> ${ensureValue(
    formData?.buyer?.address,
  )}</p>
<p class="no-indent"><strong>Primary Contact Email:</strong> ${ensureValue(
    formData?.buyer?.email,
  )}</p>
<p class="no-indent"><strong>Primary Contact Phone:</strong> ${ensureValue(
    formData?.buyer?.phone,
  )}</p>
</div>

<h3>AND</h3>

<div class="party-section">
<p class="no-indent"><strong>${partyLabels.publisher}:</strong> ${ensureValue(
    formData?.publisher?.companyName,
  )} (${ensureValue(formData?.publisher?.entityType)})</p>
<p class="no-indent"><strong>Principal Address:</strong> ${ensureValue(
    formData?.publisher?.address,
  )}</p>
<p class="no-indent"><strong>Primary Contact Email:</strong> ${ensureValue(
    formData?.publisher?.email,
  )}</p>
<p class="no-indent"><strong>Primary Contact Phone:</strong> ${ensureValue(
    formData?.publisher?.phone,
  )}</p>
</div>

<p class="no-indent">Each a "Party" and collectively the "Parties."</p>

<div class="separator"></div>

<h2>RECITALS</h2>

<div class="recitals">
<p><strong>WHEREAS,</strong> ${
    formData?.type === "Employment Contract"
      ? `the Employer desires to engage the Employee as a ${ensureValue(
          formData?.jobTitle,
        )} and the Employee desires to accept such employment`
      : formData?.type === "ACA Health"
        ? "the ACA Insurance Agency requires qualified agents to sell ACA health insurance policies and the Recruiter specializes in recruiting and hiring such agents"
        : "Publisher specializes in sourcing and qualifying inbound telemarketing calls for compliant pay-per-call campaigns"
  }; and</p>

<p><strong>WHEREAS,</strong> ${
    formData?.type === "Employment Contract"
      ? "the Parties desire to establish the terms and conditions of employment, including compensation, benefits, duties, and responsibilities"
      : formData?.type === "ACA Health"
        ? "the Agency desires to engage the Recruiter for agent recruitment services to build their agent network"
        : "Buyer desires to receive such calls and compensate Publisher"
  } pursuant to the commercial terms set forth in this Agreement; and</p>

<p><strong>WHEREAS,</strong> the Parties wish to memorialize their respective obligations, representations, warranties, and indemnities in a binding writing enforceable under Applicable Law.</p>

<p><strong>NOW, THEREFORE,</strong> in consideration of the mutual covenants and promises contained herein, the Parties agree as follows:</p>
</div>

<div class="separator"></div>

<h1>1. DEFINITIONS AND INTERPRETATION</h1>

<p><span class="section-number">1.1</span> <strong>"Applicable Law"</strong> means all federal, state, provincial, and international statutes, regulations, and industry guidelines governing ${
    formData?.type === "ACA Health"
      ? "insurance sales, agent licensing, privacy, data protection, consumer protection, and advertising, including without limitation HIPAA, state insurance regulations, and federal ACA requirements"
      : "telemarketing, privacy, data protection, consumer protection, and advertising, including without limitation the Telephone Consumer Protection Act (TCPA), Telemarketing Sales Rule (TSR), CAN-SPAM Act, state Do Not Call statutes, HIPAA (to the extent applicable), and GDPR/UK GDPR"
  }.</p>

<p><span class="section-number">1.2</span> ${
    formData?.type === "Employment Contract"
      ? '<strong>"Employment"</strong> means the employment relationship established between Employer and Employee pursuant to this Agreement.'
      : formData?.type === "ACA Health"
        ? '<strong>"Agent Recruitment Services"</strong> means the services provided by Recruiter to identify, recruit, hire, and support qualified insurance agents for the Agency.'
        : '<strong>"Campaign"</strong> means the pay-per-call program described in Exhibit A.'
  }</p>

<p><span class="section-number">1.3</span> ${
    formData?.type === "Employment Contract"
      ? '<strong>"Compensation"</strong> means the total remuneration package provided to Employee, including base salary, hourly wages, commissions, bonuses, and benefits as specified in this Agreement.'
      : formData?.type === "ACA Health"
        ? '<strong>"NPN Override Agent"</strong> means an insurance agent who provides their National Producer Number (NPN) to the Agency for contracting purposes to sell ACA health insurance policies.'
        : formData?.type === "CPA"
          ? '<strong>"Qualified Sale"</strong> means a Sale that satisfies the targeting and compliance requirements in Exhibit A.'
          : '<strong>"Qualified Call"</strong> means a Call that satisfies the targeting and compliance requirements in Exhibit A and remains connected to Buyer for at least the applicable billable duration.'
  }</p>

<p><span class="section-number">1.4</span> ${
    formData?.type === "Employment Contract"
      ? '<strong>"Job Duties"</strong> means the specific responsibilities, tasks, and obligations of Employee as outlined in the job description and performance expectations.'
      : formData?.type === "ACA Health"
        ? '<strong>"Direct Sales Agent"</strong> means an insurance agent recruited by Recruiter who will sell ACA health insurance policies directly to consumers.'
        : formData?.type === "CPA"
          ? '<strong>"Sale"</strong> means a conversion event as defined in Exhibit A.'
          : '<strong>"Call"</strong> means a telephone call generated by Publisher and delivered to Buyer.'
  }</p>

<p><span class="section-number">1.5</span> ${
    formData?.type === "Employment Contract"
      ? '<strong>"Confidential Information"</strong> means all proprietary, confidential, and trade secret information of Employer, including but not limited to customer lists, business strategies, financial data, and technical information.'
      : formData?.type === "ACA Health"
        ? '<strong>"Active Policy"</strong> means an ACA health insurance policy that has been issued by the carrier and for which the customer is current on premium payments.'
        : formData?.type === "CPL"
          ? '<strong>"Billable Duration"</strong> means the minimum call length required for a Call to qualify for payment.'
          : '<strong>"Traffic Source"</strong> means the origin of conversions, including but not limited to digital advertising, direct mail, or other marketing channels.'
  }</p>

${
  formData?.type === "CPL"
    ? `<p><span class="section-number">1.5a</span> <strong>"Buffer Time"</strong> means the amount of time (${ensureValue(
        formData?.bufferTime,
      )} seconds) from the initiation of a Call during which Buyer has the opportunity to speak with the prospect before the Call becomes billable. Calls that terminate within the Buffer Time are not billable to Buyer.</p>`
    : ""
}

<p><span class="section-number">1.6</span> ${
    formData?.type === "Employment Contract"
      ? '<strong>"Intellectual Property"</strong> means all inventions, discoveries, improvements, works of authorship, and other intellectual property created by Employee during the course of employment.'
      : formData?.type === "ACA Health"
        ? '<strong>"Carrier"</strong> means the insurance company that issues and administers ACA health insurance policies.'
        : formData?.type === "CPL"
          ? '<strong>"Traffic Source"</strong> means the origin of calls, including but not limited to digital advertising, direct mail, or other marketing channels.'
          : '<strong>"Conversion Event"</strong> means the specific qualifying action as defined in Exhibit A.'
  }</p>

<p><span class="section-number">1.7</span> Headings are for reference only and do not affect interpretation. Terms used in the singular include the plural and vice versa.</p>

<div class="separator"></div>

<h1>2. ${
    formData?.type === "Employment Contract"
      ? "EMPLOYMENT TERMS"
      : formData?.type === "ACA Health"
        ? "AGENT RECRUITMENT SERVICES"
        : "CAMPAIGN GOVERNANCE"
  }</h1>

${
  formData?.type === "Employment Contract"
    ? `
<p><span class="section-number">2.1</span> <strong>Position and Title:</strong> Employee is employed as a ${ensureValue(
        formData?.jobTitle,
      )} in a ${ensureValue(
        formData?.employmentStatus,
      )} capacity, reporting to ${ensureValue(
        formData?.reportingManager,
      )} in the ${ensureValue(formData?.department)} department.</p>

<p><span class="section-number">2.2</span> <strong>Job Duties and Responsibilities:</strong> Employee shall perform the following duties and responsibilities: ${ensureValue(
        formData?.jobDescription,
      )}</p>

<p><span class="section-number">2.3</span> <strong>Performance Standards:</strong> Employee's performance will be evaluated based on the following metrics: ${ensureValue(
        formData?.performanceMetrics,
      )}</p>

<p><span class="section-number">2.4</span> <strong>Work Schedule:</strong> Employee's work schedule shall be ${ensureValue(
        formData?.workSchedule,
      )}. Employee acknowledges that this position may require flexibility in scheduling and may include occasional overtime as business needs require.</p>

<p><span class="section-number">2.5</span> <strong>Start Date:</strong> Employee's employment shall commence on ${ensureValue(
        formData?.startDate,
      )}.</p>

<p><span class="section-number">2.6</span> <strong>Probationary Period:</strong> ${
        ensureValue(formData?.probationaryPeriod) ||
        "Employee shall serve a ninety (90) day probationary period during which either party may terminate employment with or without cause and with or without notice."
      }</p>
`
    : formData?.type === "ACA Health"
      ? formData?.acaSubType === "CPL"
        ? `
<p><span class="section-number">2.1</span> Publisher shall source, qualify, and deliver inbound calls relating to ACA health insurance products to Buyer in accordance with the targeting and compliance requirements set forth in Exhibit A.</p>

<p><span class="section-number">2.2</span> A "Qualified Call" means a call that meets the minimum duration threshold of ${ensureValue(formData?.acaCplBufferTime)} seconds and originates from a verified consumer seeking ACA health insurance information or enrollment assistance.</p>
`
        : formData?.acaSubType === "CPA"
          ? `
<p><span class="section-number">2.1</span> Publisher shall source, qualify, and deliver verified ACA health insurance enrollments ("Qualified Enrollments") to Buyer. A Qualified Enrollment means a completed application resulting in an active health insurance policy issued by a participating carrier.</p>

<p><span class="section-number">2.2</span> Buyer shall provide necessary carrier access, training materials, and administrative support to facilitate the enrollment process. Publisher shall ensure all enrollments comply with CMS guidelines and applicable state regulations.</p>
`
          : `
<p><span class="section-number">2.1</span> Recruiter shall identify, recruit, and hire qualified insurance agents for the Agency in two categories: (a) NPN Override Agents who provide their National Producer Number for Agency contracting purposes, and (b) Direct Sales Agents who will sell ACA health insurance policies directly to consumers.</p>

<p><span class="section-number">2.2</span> Agency shall provide comprehensive training, support, and administrative services for all recruited agents, including carrier contracting, policy administration, and customer service.</p>
`
      : `
<p><span class="section-number">2.1</span> Publisher will source, qualify, and deliver Calls to Buyer in accordance with the targeting and compliance requirements set forth in Exhibit A.</p>

<p><span class="section-number">2.2</span> Buyer shall accept and handle all Qualified Calls in accordance with Applicable Law and the terms of this Agreement.</p>
`
}

<p><span class="section-number">2.3</span> ${
    formData?.type === "ACA Health"
      ? "Both Parties shall maintain detailed records of all recruitment activities, agent performance, and policy sales for audit and compliance purposes."
      : "Both Parties shall maintain detailed call logs, consent documentation, and disposition data for audit and compliance purposes."
  }</p>

<p><span class="section-number">2.4</span> ${
    formData?.type === "ACA Health"
      ? "Recruiter shall maintain detailed records of all agent recruitment activities, including candidate sourcing, interview processes, hiring decisions, and performance evaluations. These records shall be available for Agency review upon reasonable notice."
      : "Publisher shall maintain detailed records of all call generation activities, including traffic sources, conversion rates, and quality metrics. These records shall be available for Buyer review upon reasonable notice."
  }</p>

<div class="separator"></div>

${
  formData?.type === "Employment Contract"
    ? `
<h1>3. COMPENSATION AND BENEFITS</h1>

<p><span class="section-number">3.1</span> <strong>Base Compensation:</strong> Employee's compensation shall be as follows:
${
  formData?.compensationType === "Hourly"
    ? `$${ensureValue(formData?.hourlyRate)} per hour`
    : formData?.compensationType === "Salary"
      ? `$${ensureValue(formData?.salaryAmount)} annually`
      : formData?.compensationType === "Commission"
        ? `${ensureValue(formData?.commissionRate)}% commission on sales`
        : formData?.compensationType === "Hourly + Commission"
          ? `$${ensureValue(formData?.hourlyRate)} per hour plus ${ensureValue(
              formData?.commissionRate,
            )}% commission on sales`
          : "As specified in the compensation schedule"
}</p>

${
  formData?.compensationType === "Commission" ||
  formData?.compensationType === "Hourly + Commission"
    ? `
<p><span class="section-number">3.2</span> <strong>Commission Structure:</strong> ${ensureValue(
        formData?.commissionStructure,
      )}</p>
`
    : ""
}

<p><span class="section-number">3.${
        formData?.compensationType === "Commission" ||
        formData?.compensationType === "Hourly + Commission"
          ? "3"
          : "2"
      }</span> <strong>Payment Schedule:</strong> Employee shall be paid ${
        formData?.compensationType === "Salary" ? "monthly" : "bi-weekly"
      } in accordance with Employer's standard payroll practices.</p>

<p><span class="section-number">3.${
        formData?.compensationType === "Commission" ||
        formData?.compensationType === "Hourly + Commission"
          ? "4"
          : "3"
      }</span> <strong>Benefits Package:</strong> Employee shall be eligible for the following benefits: ${
        formData?.benefits && formData.benefits.length > 0
          ? formData.benefits.join(", ")
          : "Standard company benefits as outlined in the Employee Handbook"
      }</p>

<p><span class="section-number">3.${
        formData?.compensationType === "Commission" ||
        formData?.compensationType === "Hourly + Commission"
          ? "5"
          : "4"
      }</span> <strong>Expense Reimbursement:</strong> Employee shall be reimbursed for reasonable and necessary business expenses incurred in the performance of job duties, subject to Employer's expense reimbursement policy.</p>

<div class="separator"></div>

<h1>4. CONFIDENTIALITY AND INTELLECTUAL PROPERTY</h1>

<p><span class="section-number">4.1</span> <strong>Confidentiality Obligations:</strong> Employee acknowledges that during the course of employment, Employee will have access to Confidential Information. Employee agrees to maintain the confidentiality of all such information and not to disclose it to any third party without Employer's prior written consent.</p>

<p><span class="section-number">4.2</span> <strong>Intellectual Property Assignment:</strong> ${
        ensureValue(formData?.intellectualProperty) ||
        "All Intellectual Property created by Employee during the course of employment shall be the exclusive property of Employer. Employee hereby assigns all rights, title, and interest in such Intellectual Property to Employer."
      }</p>

<p><span class="section-number">4.3</span> <strong>Non-Disclosure Period:</strong> Employee's confidentiality obligations shall survive termination of employment for a period of ${
        ensureValue(formData?.confidentialityPeriod) || "five (5) years"
      }.</p>

<div class="separator"></div>

<h1>5. TERMINATION</h1>

<p><span class="section-number">5.1</span> <strong>At-Will Employment:</strong> This is an at-will employment relationship. Either party may terminate employment at any time, with or without cause, and with or without notice.</p>

<p><span class="section-number">5.2</span> <strong>Termination Procedures:</strong> ${
        ensureValue(formData?.terminationClause) ||
        "Upon termination, Employee shall return all company property and materials. Employer shall pay Employee all earned compensation and benefits through the last day of employment."
      }</p>

<p><span class="section-number">5.3</span> <strong>Non-Compete Obligations:</strong> ${
        formData?.nonCompetePeriod
          ? `Employee agrees not to compete with Employer for a period of ${formData.nonCompetePeriod} following termination of employment.`
          : "Employee acknowledges that no non-compete restrictions apply to this position."
      }</p>

<div class="separator"></div>

<h1>6. GENERAL PROVISIONS</h1>

<p><span class="section-number">6.1</span> <strong>Training Requirements:</strong> ${
        ensureValue(formData?.trainingRequirements) ||
        "Employee shall complete all required training programs as designated by Employer."
      }</p>

<p><span class="section-number">6.2</span> <strong>Travel Requirements:</strong> ${
        ensureValue(formData?.travelRequirements) ||
        "This position may require occasional business travel as needed."
      }</p>

<p><span class="section-number">6.3</span> <strong>Equipment and Resources:</strong> ${
        ensureValue(formData?.equipmentProvided) ||
        "Employer shall provide necessary equipment and resources for Employee to perform job duties effectively."
      }</p>

<p><span class="section-number">6.4</span> <strong>Remote Work Policy:</strong> ${
        ensureValue(formData?.remoteWorkPolicy) ||
        "Remote work arrangements are subject to Employer's remote work policy and business needs."
      }</p>

`
    : ""
}

<h1>${formData?.type === "Employment Contract" ? "7" : "3"}. ${
    formData?.type === "Employment Contract"
      ? "GOVERNING LAW AND DISPUTE RESOLUTION"
      : formData?.type === "ACA Health"
        ? "AGENT LICENSING AND COMPLIANCE"
        : "CONSENT, EVIDENCE, AND COMPLIANCE"
  }</h1>

<p><span class="section-number">3.1</span> ${
    formData?.type === "ACA Health"
      ? "All recruited agents must be properly licensed to sell ACA health insurance in their respective states. Recruiter shall verify and maintain records of all agent licenses and ensure compliance with state insurance regulations."
      : "Publisher will capture, maintain, and furnish proof of consent for all Calls in accordance with Applicable Law, including Jornaya LeadID, TrustedForm Certificates, or equivalent."
  }</p>

<p><span class="section-number">3.2</span> ${
    formData?.type === "ACA Health"
      ? "Recruiter shall ensure all recruited agents complete required training and certification programs for ACA health insurance sales. Agency shall provide ongoing compliance support and monitoring."
      : "Consent and call recordings will be retained for a minimum of five (5) years. Buyer shall notify Publisher within one (1) business day of any consumer revocation of consent."
  }</p>

<p><span class="section-number">3.3</span> ${
    formData?.type === "ACA Health"
      ? "Each Party shall cooperate in good faith to investigate any compliance issues or regulatory inquiries within two (2) business days of notice and implement mutually agreed remediation steps."
      : "Each Party shall cooperate in good faith to investigate disputes or regulatory inquiries within two (2) business days of notice and implement mutually agreed remediation steps."
  }</p>

<div class="separator"></div>

<h1>4. ${
    formData?.type === "ACA Health"
      ? "AGENT SUPPORT AND TRAINING"
      : "CALL HANDLING AND BUFFER PROTOCOLS"
  }</h1>

<p><span class="section-number">4.1</span> ${
    formData?.type === "ACA Health"
      ? "Agency shall provide comprehensive training materials, sales scripts, and ongoing support for all recruited agents. Agency shall ensure adequate staffing to support agent needs during business hours."
      : formData?.type === "CPL"
        ? `Buyer shall ensure adequate staffing and technical capacity to accept Calls during designated hours. The Buffer Time of ${ensureValue(
            formData?.bufferTime,
          )} seconds provides Buyer with a grace period from Call initiation during which Buyer may speak with the prospect without incurring charges. Calls that terminate or are disconnected within the Buffer Time are not billable to Buyer and shall not be counted as Qualified Calls.`
        : "Buyer shall ensure adequate staffing and technical capacity to accept Calls during designated hours."
  }</p>

${
  formData?.type === "CPL"
    ? `<p><span class="section-number">4.1a</span> <strong>Buffer Time Implementation:</strong> The Buffer Time period of ${ensureValue(
        formData?.bufferTime,
      )} seconds commences immediately upon Call connection. During this period, Buyer has the exclusive opportunity to engage with the prospect and assess call quality before the Call becomes billable. Only Calls that remain connected for at least ${ensureValue(
        formData?.bufferTime,
      )} seconds shall qualify for billing.</p>`
    : ""
}

<p><span class="section-number">4.2</span> ${
    formData?.type === "ACA Health"
      ? "Recruiter shall provide ongoing support and training to recruited agents to ensure they meet performance standards and maintain compliance with all applicable regulations."
      : "Publisher may monitor live transfers, IVR flows, and call recordings to verify call quality and adherence to scripts. Buyer consents to such quality assurance measures to the extent permitted by Applicable Law."
  }</p>

<p><span class="section-number">4.3</span> ${
    formData?.type === "ACA Health"
      ? "Agency shall implement quality assurance measures to monitor agent performance and ensure compliance with all applicable laws and regulations."
      : "Where overseas or remote call centers are utilized, the responsible Party shall implement enhanced linguistic, cultural, and compliance training to protect consumers and brand integrity."
  }</p>

<div class="separator"></div>

<h1>5. ${
    formData?.type === "ACA Health"
      ? "PAYMENT TERMS AND STRUCTURE"
      : "COMMERCIAL TERMS AND PAYMENT"
  }</h1>

<p><span class="section-number">5.1</span> ${
    formData?.type === "ACA Health"
      ? formData?.acaSubType === "CPL"
        ? `Payout per Qualified Call: ${formatCurrency(formData?.acaCplPayout)}. A Qualified Call is defined as a call lasting ${ensureValue(formData?.acaCplBufferTime)} seconds or longer from a verified consumer seeking ACA health insurance information.`
        : formData?.acaSubType === "CPA"
          ? `Payout per Qualified Enrollment: ${formatCurrency(formData?.acaCpaPayout)}. A Qualified Enrollment is defined as a completed ACA health insurance application resulting in an active policy issued by a participating carrier.`
          : "Payment Structure: See ACA Health partnership payment structure detailed in Section 5.6-5.9 below."
      : formData?.type === "CPA"
        ? formData?.vertical === "Final Expense"
          ? formData?.payoutType === "percentage"
            ? `Payout per Qualified Sale: Level: ${formData?.payoutPercentageLevel}% of annual premium, All Other: ${formData?.payoutPercentageAllOther}% of annual premium`
            : `Payout per Qualified Sale: Level: ${formatCurrency(
                formData?.payoutLevel,
              )}, All Other: ${formatCurrency(formData?.payoutAllOther)}`
          : `Payout per Qualified Sale: ${formatCurrency(formData?.payout)}`
        : `Payout per Qualified Call: ${formatCurrency(formData?.payout)}`
  }</p>

<p><span class="section-number">5.2</span> ${
    formData?.type === "ACA Health"
      ? `Billing Cycle: ${ensureValue(formData?.acaBillingCycle)}. Agreement Duration: ${ensureValue(formData?.acaDuration)} months from the Effective Date, automatically renewing for successive ${ensureValue(formData?.acaDuration)}-month periods unless either Party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.`
      : `Billing Cycle: ${ensureValue(formData?.billingCycle)}`
  }</p>

<p><span class="section-number">5.2a</span> ${
    formData?.type === "ACA Health"
      ? "Payment Timing: All payments are contingent upon policies being issued and paid by the carrier. No payments will be made for policies that are not issued, cancelled, or fail to receive carrier payment."
      : ""
  }</p>

${
  formData?.type === "CPL" || formData?.type === "CPA"
    ? `<p><span class="section-number">5.3</span> <strong>NO REFUNDS POLICY:</strong> Buyer acknowledges and agrees that once payment has been made for any Qualified Call or Qualified Conversion, no refunds will be provided under any circumstances. No money will ever be refunded for calls, regardless of call outcome, quality, conversion result, or any other factor. This no-refund policy applies to all payments made for ${
        formData?.type === "CPL" ? "Qualified Calls" : "Qualified Conversions"
      } and is final and non-negotiable.</p>`
    : ""
}

${
  formData?.type === "CPL" || formData?.type === "CPA"
    ? `<p><span class="section-number">5.4</span> <strong>CREDIT POLICY:</strong> Publisher may, in its sole discretion, choose to provide credits for specific calls or conversions on a case-by-case basis. Any credits are granted solely at Publisher's discretion and are not guaranteed. Credits are not refunds and may only be applied against future invoices. Each credit request will be evaluated individually based on the specific circumstances, and Publisher reserves the right to approve or deny any credit request. Buyer acknowledges that credits are a courtesy, not an obligation, and that Publisher has no duty to provide credits. The absence of credits does not give Buyer the right to withhold payment or dispute charges.</p>`
    : ""
}

${
  formData?.type === "CPA"
    ? `<p><span class="section-number">5.5</span> <strong>Publisher Replacement Policy:</strong> Publisher will replace sales where the insured does not pay their first premium. Publisher agrees to provide replacement leads/sales at no additional cost to Buyer when a CPA conversion is charged but the insured fails to remit payment for their first premium payment.</p>`
    : ""
}

${formData?.vertical === "Final Expense" && formData?.type === "CPA" ? `<p><span class="section-number">5.6</span> <strong>Chargeback Liability Period:</strong> Publisher shall remain liable for chargebacks, clawbacks, or policy lapses for a period of <strong>${ensureValue(formData?.chargebackLiability)}</strong> from the date of the Qualified Conversion. If a policy lapses or is charged back within this period, Publisher shall refund the full payout amount or provide a replacement conversion at Buyer's discretion.</p>` : ""}

${formData?.type === "ACA Health" ? `<p><span class="section-number">5.5a</span> <strong>Chargeback Liability Period:</strong> Recruiter shall remain liable for policy chargebacks, clawbacks, or lapses for a period of <strong>${ensureValue(formData?.acaChargebackLiability)}</strong> from the date of the Active Policy. If a policy lapses or is charged back within this period, Recruiter shall refund the full payout amount or provide a replacement agent/sale at Agency's discretion.</p>` : ""}

<p><span class="section-number">${formData?.vertical === "Final Expense" && formData?.type === "CPA" ? "5.7" : formData?.type === "CPA" ? "5.6" : formData?.type === "CPL" ? "5.5" : "5.3"}</span> ${
    formData?.type === "ACA Health"
      ? "Residual Payments: All residual payments are made on an 'as earned' basis each month, meaning Recruiter is only paid for policies that remain active and in good standing with the carrier."
      : brokerLiabilityClause
  }</p>

<p><span class="section-number">${formData?.vertical === "Final Expense" && formData?.type === "CPA" ? "5.8" : formData?.type === "CPA" ? "5.7" : formData?.type === "CPL" ? "5.6" : "5.4"}</span> ${
    formData?.type === "ACA Health"
      ? "Agency shall provide detailed monthly reports showing all policy sales, active policies, and payment calculations. Recruiter may audit these records upon reasonable notice."
      : "Publisher will issue detailed invoices aligned with the billing cycle specified in Exhibit A. Buyer shall remit payment within the stated net terms. Amounts not paid when due accrue interest at one and one-half percent (1.5%) per month or the maximum permitted by Applicable Law, whichever is lower."
  }</p>

<p><span class="section-number">${formData?.vertical === "Final Expense" && formData?.type === "CPA" ? "5.9" : formData?.type === "CPA" ? "5.8" : formData?.type === "CPL" ? "5.7" : "5.5"}</span> ${
    formData?.type === "ACA Health"
      ? "Late Payments: Amounts not paid when due accrue interest at one and one-half percent (1.5%) per month or the maximum permitted by Applicable Law, whichever is lower."
      : "Publisher may suspend or reroute traffic if Buyer is more than seven (7) days past due, upon written notice."
  }</p>

${acaHealthClause}

<div class="separator"></div>

<h1>6. ${
    formData?.type === "ACA Health"
      ? "DATA SECURITY AND PRIVACY"
      : "DATAPASS, SECURITY, AND PRIVACY"
  }</h1>

<p><span class="section-number">6.1</span> ${
    formData?.type === "ACA Health"
      ? "Each Party shall maintain administrative, technical, and physical safeguards that meet or exceed industry standards (including SOC 2 or ISO 27001 controls when applicable) to protect agent and customer data against unauthorized access, use, or disclosure."
      : datapassClause
  }</p>

<p><span class="section-number">6.2</span> ${
    formData?.type === "ACA Health"
      ? "All agent information, customer data, and policy details must be handled in accordance with HIPAA and applicable state insurance regulations."
      : "Each Party shall maintain administrative, technical, and physical safeguards that meet or exceed industry standards (including SOC 2 or ISO 27001 controls when applicable) to protect Call data against unauthorized access, use, or disclosure."
  }</p>

<p><span class="section-number">6.3</span> ${
    formData?.type === "ACA Health"
      ? "Security incidents impacting agent or customer data must be reported to the other Party within twenty-four (24) hours and followed by a written incident report within forty-eight (48) hours detailing remediation steps."
      : "Security incidents impacting Call data must be reported to the other Party within twenty-four (24) hours and followed by a written incident report within forty-eight (48) hours detailing remediation steps."
  }</p>

<div class="separator"></div>

<h1>7. ${
    formData?.type === "ACA Health"
      ? "REPORTING, AUDIT RIGHTS, AND RECORD RETENTION"
      : "REPORTING, AUDIT RIGHTS, AND RECORD RETENTION"
  }</h1>

<p><span class="section-number">7.1</span> ${
    formData?.type === "ACA Health"
      ? "Agency will maintain comprehensive records of all agent recruitment activities, policy sales, active policies, and payment calculations for at least five (5) years."
      : "Publisher will maintain comprehensive call logs, consent documentation, disposition data, and QA recordings for at least five (5) years."
  }</p>

<p><span class="section-number">7.2</span> ${
    formData?.type === "ACA Health"
      ? "Agency shall provide monthly reports to Recruiter showing all policy sales, active policies, and payment calculations. Any disputes regarding payments must be raised within thirty (30) days of the report."
      : "Buyer shall deliver invalid/disputed call notices within seventy-two (72) hours of receipt. Failure to timely dispute constitutes acceptance of the Call as Qualified."
  }</p>

<p><span class="section-number">7.3</span> ${
    formData?.type === "ACA Health"
      ? "Each Party may audit the other's relevant records upon fifteen (15) days' prior written notice, not more than twice per twelve-month period, provided that confidentiality obligations remain intact."
      : "Each Party may audit the other's relevant records upon fifteen (15) days' prior written notice, not more than twice per twelve-month period, provided that confidentiality obligations remain intact."
  }</p>

<div class="separator"></div>

<h1>8. REPRESENTATIONS AND WARRANTIES</h1>

<p><span class="section-number">8.1</span> Each Party represents that it is duly organized, validly existing, and authorized to enter into this Agreement.</p>

<p><span class="section-number">8.2</span> Each Party warrants that it will comply with Applicable Law, obtain all required licenses, and refrain from misleading marketing practices.</p>

<p><span class="section-number">8.3</span> Each Party warrants that its technology stack is configured to safeguard consumer data and that it will promptly cure any material vulnerabilities.</p>

<div class="separator"></div>

<h1>9. INDEMNIFICATION</h1>

<p><span class="section-number">9.1</span> Each Party (the "Indemnifying Party") shall defend, indemnify, and hold harmless the other Party and its affiliates, officers, directors, employees, and agents from and against all third-party claims, fines, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) breach of this Agreement; (b) violation of Applicable Law; (c) gross negligence or willful misconduct; or (d) infringement or misappropriation of third-party rights.</p>

<p><span class="section-number">9.2</span> The indemnified Party shall promptly notify the Indemnifying Party of any claim, and the Indemnifying Party shall assume control of the defense, provided that the indemnified Party may participate with counsel of its choosing at its own expense.</p>

<div class="separator"></div>

<h1>10. LIMITATION OF LIABILITY</h1>

<p><span class="section-number">10.1</span> Except for payment obligations, indemnification duties, or damages arising from gross negligence, willful misconduct, or breach of confidentiality, neither Party's aggregate liability under this Agreement shall exceed the total fees paid or payable during the six (6) months preceding the claim.</p>

<p><span class="section-number">10.2</span> Neither Party shall be liable for indirect, consequential, exemplary, special, or punitive damages, including lost profits or loss of goodwill, whether arising in contract, tort, or otherwise.</p>

<div class="separator"></div>

<h1>11. CONFIDENTIALITY AND TRADE SECRETS</h1>

<p><span class="section-number">11.1</span> All non-public business, financial, technical, or marketing information disclosed by either Party is "Confidential Information."</p>

<p><span class="section-number">11.2</span> The receiving Party shall protect Confidential Information using at least the same degree of care it employs for its own confidential information (and no less than reasonable care) and shall disclose it only to employees, contractors, or professional advisers with a legitimate need to know and who are bound by written confidentiality obligations.</p>

<p><span class="section-number">11.3</span> Upon termination, each Party shall promptly return or destroy the other Party's Confidential Information, except for archival copies maintained in accordance with legal retention policies.</p>

<p><span class="section-number">11.4</span> ${
    formData?.type === "ACA Health"
      ? "CUSTOMER NON-SOLICITATION: During the term of this Agreement and for a period of one (1) year following termination, Recruiter shall not directly or indirectly solicit or attempt to solicit any customers or clients of the Agency that were introduced to Recruiter through this Agreement."
      : "CUSTOMER NON-SOLICITATION: During the term of this Agreement and for a period of one (1) year following termination, Publisher shall not directly or indirectly solicit or attempt to solicit any customers or clients of Buyer that were introduced to Publisher through this Agreement."
  }</p>

${
  formData?.type === "Employment Contract" || formData?.type === "ACA Health"
    ? `<p><span class="section-number">11.5</span> EMPLOYEE NON-SOLICITATION: During the term of this Agreement and for a period of one (1) year following termination, neither Party shall directly or indirectly solicit, recruit, or hire employees or contractors of the other Party without prior written consent.</p>`
    : ""
}

<p><span class="section-number">${
    formData?.type === "Employment Contract" || formData?.type === "ACA Health"
      ? "11.6"
      : "11.5"
  }</span> ${
    formData?.type === "ACA Health"
      ? "TRADE SECRETS: All agent recruitment methodologies, training materials, sales processes, and business strategies developed or disclosed during this Agreement shall be considered trade secrets and subject to the confidentiality provisions herein."
      : "TRADE SECRETS: All call generation methodologies, traffic sources, conversion optimization techniques, and business strategies developed or disclosed during this Agreement shall be considered trade secrets and subject to the confidentiality provisions herein."
  }</p>

<p><span class="section-number">${
    formData?.type === "Employment Contract" || formData?.type === "ACA Health"
      ? "11.7"
      : "11.6"
  }</span> ${
    formData?.type === "ACA Health"
      ? "CONFIDENTIALITY DURATION: The confidentiality obligations set forth in this Section 11 shall survive termination of this Agreement and continue for a period of five (5) years from the date of termination."
      : "CONFIDENTIALITY DURATION: The confidentiality obligations set forth in this Section 11 shall survive termination of this Agreement and continue for a period of five (5) years from the date of termination."
  }</p>

<div class="separator"></div>

<h1>12. TERM, TERMINATION, AND SUSPENSION</h1>

<p><span class="section-number">12.1</span> This Agreement commences on the Effective Date and continues until terminated by either Party upon five (5) business days' written notice.</p>

<p><span class="section-number">12.2</span> Either Party may terminate immediately upon written notice for (a) uncured material breach after three (3) business days; (b) ${
    formData?.type === "ACA Health"
      ? "repeated failure to recruit qualified agents or maintain agent performance standards"
      : "repeated invalid or fraudulent Calls"
  }; (c) non-payment beyond the cure period; or (d) regulatory or compliance violations creating material legal exposure.</p>

${
  formData?.type === "Employment Contract" || formData?.type === "ACA Health"
    ? `<p><span class="section-number">12.3</span> RESIDUAL COMMISSION PROTECTION: Recruiter's residual commissions cannot be taken away for any reason other than the client no longer has an active policy with any carrier of the agency. All earned residual commissions shall continue to be paid according to the terms of this Agreement regardless of termination.</p>`
    : ""
}

<p><span class="section-number">${
    formData?.type === "Employment Contract" || formData?.type === "ACA Health"
      ? "12.4"
      : "12.3"
  }</span> Sections 5 through 15 shall survive expiration or termination.</p>

<div class="separator"></div>

<h1>13. FORCE MAJEURE</h1>

<p><span class="section-number">13.1</span> Neither Party shall be liable for failure or delay in performance caused by events beyond its reasonable control, including natural disasters, acts of government, labor disputes, civil disturbances, telecommunications failures, or pandemics, provided the affected Party gives prompt notice and uses commercially reasonable efforts to resume performance.</p>

<div class="separator"></div>

<h1>14. GOVERNING LAW AND DISPUTE RESOLUTION</h1>

<p><span class="section-number">14.1</span> This Agreement shall be governed by and construed in accordance with the laws of ${governingLaw}, without regard to conflict-of-law principles.</p>

<p><span class="section-number">14.2</span> ${
    formData?.type === "ACA Health"
      ? "MEDIATION: Before initiating any formal dispute resolution process, the Parties shall attempt to resolve disputes through good faith negotiations and, if necessary, mediation with a mutually agreed mediator within thirty (30) days of written notice of the dispute."
      : "The Parties shall escalate disputes to executive-level negotiations."
  }</p>

<p><span class="section-number">14.3</span> ${
    formData?.type === "ACA Health"
      ? "ARBITRATION: If mediation fails, any dispute arising under this Agreement shall be submitted to binding arbitration administered by JAMS under its Streamlined Arbitration Rules before a single arbitrator with expertise in insurance and recruitment matters, seated in the venue mutually agreed by the Parties."
      : "If the Parties cannot resolve a dispute within fifteen (15) days, the matter shall be submitted to binding arbitration administered by JAMS under its Streamlined Arbitration Rules before a single arbitrator seated in the venue mutually agreed by the Parties."
  }</p>

<p><span class="section-number">14.4</span> ${
    formData?.type === "ACA Health"
      ? "ARBITRATION PROCEDURES: The arbitrator shall have the authority to award injunctive relief, specific performance, and monetary damages. The arbitration shall be conducted in English and the arbitrator's decision shall be final and binding."
      : "Judgment on the arbitration award may be entered in any court of competent jurisdiction."
  }</p>

<p><span class="section-number">14.5</span> ${
    formData?.type === "ACA Health"
      ? "COSTS: Each Party shall bear its own costs and attorneys' fees, unless the arbitrator determines that one Party's claims were frivolous or brought in bad faith, in which case the prevailing Party may be awarded reasonable costs and attorneys' fees."
      : "COSTS: Each Party shall bear its own costs and attorneys' fees, unless the arbitrator determines that one Party's claims were frivolous or brought in bad faith, in which case the prevailing Party may be awarded reasonable costs and attorneys' fees."
  }</p>

<div class="separator"></div>

<h1>15. MISCELLANEOUS</h1>

<p><span class="section-number">15.1</span> Entire Agreement. This Agreement (including Exhibit A) constitutes the entire understanding between the Parties and supersedes all prior insertion orders or understandings on the subject matter.</p>

<p><span class="section-number">15.2</span> Amendments. Any modification must be in writing and signed by authorized representatives of both Parties.</p>

<p><span class="section-number">15.3</span> Assignment. Neither Party may assign this Agreement without the other's prior written consent, except to a successor in interest in connection with a merger, acquisition, or sale of substantially all assets.</p>

<p><span class="section-number">15.4</span> Notices. Notices shall be delivered via email with confirmation of receipt and followed by overnight courier to the addresses listed above.</p>

<p><span class="section-number">15.5</span> Counterparts. This Agreement may be executed in counterparts, each deemed an original, and together constituting one instrument. Electronic signatures and digital certificates are deemed original signatures.</p>

<div class="separator"></div>

<div class="exhibit-section">
<h2 class="exhibit-title">EXHIBIT A - ${
    formData?.type === "ACA Health"
      ? "AGENT RECRUITMENT SPECIFICATIONS"
      : formData?.type === "Employment Contract"
        ? "COMPENSATION STRUCTURE"
        : "CAMPAIGN SPECIFICATIONS"
  }</h2>

<div class="exhibit-content">
${
  formData?.type === "Employment Contract"
    ? `
<p class="no-indent"><strong>Position:</strong> ${ensureValue(
        formData?.jobTitle,
      )}</p>
<p class="no-indent"><strong>Employment Status:</strong> ${ensureValue(
        formData?.employmentStatus,
      )}</p>
<p class="no-indent"><strong>Compensation Type:</strong> ${ensureValue(
        formData?.compensationType,
      )}</p>
${
  formData?.compensationType === "Hourly" ||
  formData?.compensationType === "Hourly + Commission"
    ? `<p class="no-indent"><strong>Hourly Rate:</strong> $${ensureValue(
        formData?.hourlyRate,
      )} per hour</p>`
    : ""
}
${
  formData?.compensationType === "Salary"
    ? `<p class="no-indent"><strong>Annual Salary:</strong> $${ensureValue(
        formData?.salaryAmount,
      )}</p>`
    : ""
}
${
  formData?.compensationType === "Commission" ||
  formData?.compensationType === "Hourly + Commission"
    ? `<p class="no-indent"><strong>Commission Rate:</strong> ${ensureValue(
        formData?.commissionRate,
      )}%</p>`
    : ""
}
<p class="no-indent"><strong>Benefits:</strong> ${
        formData?.benefits && formData.benefits.length > 0
          ? formData.benefits.join(", ")
          : "Standard company benefits"
      }</p>
<p class="no-indent"><strong>Work Schedule:</strong> ${ensureValue(
        formData?.workSchedule,
      )}</p>
<p class="no-indent"><strong>Start Date:</strong> ${ensureValue(
        formData?.startDate,
      )}</p>
<p class="no-indent"><strong>Reporting Manager:</strong> ${ensureValue(
        formData?.reportingManager,
      )}</p>
<p class="no-indent"><strong>Department:</strong> ${ensureValue(
        formData?.department,
      )}</p>

<h3 style="margin-top: 20px; margin-bottom: 15px; font-size: 16px; font-weight: bold;">Commission Structure Example:</h3>
<div style="margin: 1rem 0; padding: 1rem; border-left: 3px solid #2EAC6D; background: #f8fafc; border-radius: 4px;">
<p style="margin-bottom: 10px; font-weight: bold;">Daily Example:</p>
<p style="margin-bottom: 5px;">Payout per billable call: $3</p>
<p style="margin-bottom: 5px;">Answered Calls: 100</p>
<p style="margin-bottom: 5px;">Billable Calls: 25</p>
<p style="margin-bottom: 5px;">Commission: 25 billable calls x $3 = $75 per day</p>
<p style="margin-bottom: 5px;">Weekly: $375</p>
<p style="margin-bottom: 5px;">Monthly: $1,500</p>
<p style="margin-bottom: 5px; font-style: italic;">*This is just an example. Your earnings might be more or less than the example.</p>
</div>
`
    : `
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Service Vertical"
          : "Campaign Vertical"
      }:</strong> ${ensureValue(formData?.vertical)}</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health" ? "Service Type" : "Campaign Type"
      }:</strong> ${ensureValue(formData?.type)}</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Service Definition"
          : "Billable Event Definition"
      }:</strong> ${
        formData?.type === "CPL"
          ? `Qualified Call lasting at least ${ensureValue(
              formData?.bufferTime,
            )} seconds (Buffer Time: ${ensureValue(
              formData?.bufferTime,
            )} seconds - the duration Buyer has to speak with the prospect before the Call becomes billable)`
          : formData?.type === "ACA Health"
            ? formData?.acaSubType === "CPL"
              ? `Qualified Call lasting at least ${ensureValue(formData?.acaCplBufferTime)} seconds from a consumer seeking ACA health insurance`
              : formData?.acaSubType === "CPA"
                ? "Verified ACA health insurance enrollment resulting in active policy"
                : "Agent recruitment and ACA health insurance policy sales"
            : "The agreed CPA conversion event"
      }</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health" ? "Payment Structure" : "Payout"
      }:</strong> ${
        formData?.type === "ACA Health"
          ? formData?.acaSubType === "CPL"
            ? `${formatCurrency(formData?.acaCplPayout)} per Qualified Call (${ensureValue(formData?.acaCplBufferTime)}+ seconds)`
            : formData?.acaSubType === "CPA"
              ? `${formatCurrency(formData?.acaCpaPayout)} per Qualified Enrollment`
              : "See ACA Health partnership payment structure detailed in Section 5.7"
          : formData?.type === "CPA"
            ? formData?.vertical === "Final Expense"
              ? formData?.payoutType === "percentage"
                ? `Level: ${formData?.payoutPercentageLevel}% of annual premium, All Other: ${formData?.payoutPercentageAllOther}% of annual premium`
                : `Level: ${formatCurrency(
                    formData?.payoutLevel,
                  )}, All Other: ${formatCurrency(formData?.payoutAllOther)}`
              : `${formatCurrency(formData?.payout)} per Qualified Sale`
            : `${formatCurrency(formData?.payout)} per Qualified Call`
      }</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Agent Licensing Requirements"
          : "Proof of Consent Requirement"
      }:</strong> ${
        formData?.type === "ACA Health"
          ? "All agents must be properly licensed to sell ACA health insurance in their respective states"
          : ensureValue(formData?.proofOfConsent)
      }</p>
${formData?.type === "ACA Health" ? `<p class="no-indent"><strong>Billing Cycle:</strong> ${ensureValue(formData?.acaBillingCycle)}</p>` : ""}
${formData?.type === "ACA Health" ? `<p class="no-indent"><strong>Chargeback Liability Period:</strong> ${ensureValue(formData?.acaChargebackLiability)}</p>` : ""}
${formData?.type === "ACA Health" ? `<p class="no-indent"><strong>Agreement Duration:</strong> ${ensureValue(formData?.acaDuration)} months</p>` : ""}
${formData?.vertical === "Final Expense" && formData?.type === "CPA" ? `<p class="no-indent"><strong>Chargeback Liability:</strong> ${ensureValue(formData?.chargebackLiability)}</p>` : ""}
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Agency Liability"
          : "Broker Liability"
      }:</strong> ${formData?.brokerLiability ? "Accepted" : "Declined"}</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Reporting Requirements"
          : "Export to Sheets"
      }:</strong> ${formData?.exportToSheets ? "Enabled" : "Disabled"}</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Agency Contact"
          : "Primary Routing Destination"
      }:</strong> ${ensureValue(formData?.buyer?.phone)}</p>
<p class="no-indent"><strong>${
        formData?.type === "ACA Health"
          ? "Compliance & Regulatory Requirements"
          : "Compliance & Targeting Requirements"
      }:</strong></p>
<div class="requirements-list" style="margin: 1rem 0; padding: 1rem; border-left: 3px solid #2EAC6D; background: #f8fafc; border-radius: 4px;">
${requirementsSection}
</div>
`
}
</div>
</div>${
    formData?.type === "ACA Health"
      ? formData?.acaSubType === "CPL"
        ? `
<div class="payment-structure">
<h3>ACA Health CPL Payment Structure:</h3>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">Payout per Qualified Call: ${formatCurrency(formData?.acaCplPayout || "Not Provided")}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Minimum Call Duration (Buffer Time): ${ensureValue(formData?.acaCplBufferTime)} seconds</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Billing Cycle: ${ensureValue(formData?.acaBillingCycle)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Chargeback Liability Period: ${ensureValue(formData?.acaChargebackLiability)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Agreement Duration: ${ensureValue(formData?.acaDuration)} months</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Calls below the ${ensureValue(formData?.acaCplBufferTime)}-second threshold are non-billable</li>
</ul>
</div>`
        : formData?.acaSubType === "CPA"
          ? `
<div class="payment-structure">
<h3>ACA Health CPA Payment Structure:</h3>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">Payout per Qualified Enrollment: ${formatCurrency(formData?.acaCpaPayout || "Not Provided")}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Payment contingent on policy being issued and first premium paid</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Billing Cycle: ${ensureValue(formData?.acaBillingCycle)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Chargeback Liability Period: ${ensureValue(formData?.acaChargebackLiability)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Agreement Duration: ${ensureValue(formData?.acaDuration)} months</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Publisher will replace enrollments where insured fails to pay first premium</li>
</ul>
</div>`
          : `
<div class="payment-structure">
<h3>ACA Health Payment Structure:</h3>
<p style="margin-bottom: 15px;">There are two types of recruited agents with different payment structures:</p>

<h4 style="margin-top: 15px; margin-bottom: 10px; font-size: 14px; font-weight: bold;">A. NPN Override Agent:</h4>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">For any policy written under an agent's NPN for the NPN override agents, the agency pays the recruiter ${formatCurrency(
    formData?.acaNpnOverride || "Not Provided",
  )} per month for as long as the policy remains active.</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">If the agency writes a new plan or changes a carrier but the policy remains active, the agency will continue paying the recruiter for as long as they are paid by any carrier, not only the initial carrier.</li>
</ul>

<h4 style="margin-top: 15px; margin-bottom: 10px; font-size: 14px; font-weight: bold;">B. Direct Sales Agent:</h4>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">For any policy written, the agency pays the recruiter a one-time fee of ${formatCurrency(
    formData?.acaPerPolicy || "Not Provided",
  )} on a weekly basis.</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">For any policy written, the agency pays the recruiter ${formatCurrency(
    formData?.acaAgentBonus || "Not Provided",
  )} per month for as long as the policy remains active. If the agency writes a new plan or changes a carrier but the policy remains active, the agency will continue paying the recruiter for as long as they are paid by any carrier, not only the initial carrier.</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">If a Direct Sales Agent writes a plan under the recruiter's agent's NPN number, then the recruiter will be paid a one-time ${formatCurrency(
    formData?.acaPerPolicy || "Not Provided",
  )} fee per policy weekly, plus $10.00 per month for as long as the policy remains active. If the agency writes a new plan or changes a carrier but the policy remains active, the agency will continue paying the recruiter for as long as they are paid by any carrier, not only the initial carrier.</li>
</ul>

<h4 style="margin-top: 15px; margin-bottom: 10px; font-size: 14px; font-weight: bold;">Payment Terms:</h4>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">Billing Cycle: ${ensureValue(formData?.acaBillingCycle)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Chargeback Liability Period: ${ensureValue(formData?.acaChargebackLiability)}</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Agreement Duration: ${ensureValue(formData?.acaDuration)} months</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">All payments contingent on policy being issued and paid by carrier</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Residual payments made "as earned" each month</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Payment timing: Sales before Dec 8 count for January residuals, after Dec 8 for February residuals</li>
</ul>

<h3 style="margin-top: 20px; margin-bottom: 15px; font-size: 16px; font-weight: bold;">Basic Requirements:</h3>
<ul style="margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 8px; line-height: 1.4;">All agents must maintain active insurance licenses</li>
  <li style="margin-bottom: 8px; line-height: 1.4;">Monthly reports on agents recruited and hired</li>
</ul>
</div>`
      : ""
  }

<div class="separator"></div>

<div class="signature-section">
<h2 style="text-align: center; margin-bottom: 30px; font-size: 18px; font-weight: bold;">SIGNATURES</h2>

<div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
  <div style="width: 45%;">
    <div style="margin-bottom: 15px;">
      <div style="border: 1px solid #000; height: 50px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
        ${
          buyerSignatureData
            ? `<img src="${buyerSignatureData}" style="max-height: 40px; max-width: 100%;" />`
            : '<div style="height: 40px;"></div>'
        }
      </div>
      <div style="font-size: 14px; font-weight: bold;">Buyer Signature</div>
    </div>
    <div style="margin-bottom: 15px;">
      <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 10px;"></div>
      <div style="font-size: 12px;">${
        formData?.type === "ACA Health"
          ? "ACA Insurance Agency Authorized Signatory"
          : "Buyer/Broker Authorized Signatory"
      }</div>
    </div>
    <div>
      <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 10px;"></div>
      <div style="font-size: 12px;">Date: _______________</div>
    </div>
  </div>
  
  <div style="width: 45%;">
    <div style="margin-bottom: 15px;">
      <div style="border: 1px solid #000; height: 50px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
        ${
          publisherSignatureData
            ? `<img src="${publisherSignatureData}" style="max-height: 40px; max-width: 100%;" />`
            : '<div style="height: 40px;"></div>'
        }
      </div>
      <div style="font-size: 14px; font-weight: bold;">Publisher Signature</div>
    </div>
    <div style="margin-bottom: 15px;">
      <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 10px;"></div>
      <div style="font-size: 12px;">Publisher Authorized Signatory</div>
    </div>
    <div>
      <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 10px;"></div>
      <div style="font-size: 12px;">Date: _______________</div>
    </div>
  </div>
</div>

<div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
  This document is legally binding upon execution of signatures by both parties.
</div>
</div>

<div class="signature-block">
<p class="signature-label"><strong>${
    formData?.type === "ACA Health"
      ? "Agent Recruiter Authorized Signatory"
      : "Publisher Authorized Signatory"
  }:</strong></p>
<div class="signature-line"></div>
<p class="signature-details"><strong>Printed Name & Title:</strong> _____________________________________________</p>
<p class="signature-details"><strong>Date:</strong> ____________________________________________________________</p>
</div>
</div>

<div class="separator"></div>

END OF AGREEMENT`;
};

const SignatureSection = React.memo(
  ({
    buyerSignature,
    publisherSignature,
    setBuyerSignature,
    setPublisherSignature,
    signatureMode,
    setSignatureMode,
    className = "",
  }) => {
    const buyerPadRef = useRef(null);
    const publisherPadRef = useRef(null);

    const clearSignatures = () => {
      buyerPadRef.current?.clear();
      publisherPadRef.current?.clear();
      setBuyerSignature("");
      setPublisherSignature("");
    };

    const handleModeChange = (mode) => {
      if (mode === signatureMode) {
        return;
      }
      setSignatureMode(mode);
      clearSignatures();
    };

    const handleClear = (role) => {
      if (role === "buyer") {
        buyerPadRef.current?.clear();
        setBuyerSignature("");
      } else {
        publisherPadRef.current?.clear();
        setPublisherSignature("");
      }
    };

    const renderTypedInputs = () => (
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={LABEL_CLASSES}>Buyer / Broker Signature</label>
          <input
            type="text"
            placeholder="Type full legal name"
            className={`${INPUT_BASE_CLASSES} font-serif text-2xl italic tracking-wide`}
            value={buyerSignature}
            onChange={(e) => setBuyerSignature(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASSES}>Publisher Signature</label>
          <input
            type="text"
            placeholder="Type full legal name"
            className={`${INPUT_BASE_CLASSES} font-serif text-2xl italic tracking-wide`}
            value={publisherSignature}
            onChange={(e) => setPublisherSignature(e.target.value)}
          />
        </div>
      </div>
    );

    const renderDrawnPads = () => (
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={LABEL_CLASSES}>Buyer / Broker Signature</label>
          <SignatureCanvas
            ref={buyerPadRef}
            penColor="#000000"
            canvasProps={{
              className:
                "signature-canvas h-48 w-full rounded-lg bg-white shadow-inner",
              style: { maxWidth: "100%" },
            }}
            onEnd={() => {
              const dataUrl = buyerPadRef.current?.toDataURL("image/png");
              setBuyerSignature(dataUrl || "");
            }}
          />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleClear("buyer")}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
            {buyerSignature && (
              <span>Saved ({Math.round(buyerSignature.length / 1000)} KB)</span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASSES}>Publisher Signature</label>
          <SignatureCanvas
            ref={publisherPadRef}
            penColor="#000000"
            canvasProps={{
              className:
                "signature-canvas h-48 w-full rounded-lg bg-white shadow-inner",
              style: { maxWidth: "100%" },
            }}
            onEnd={() => {
              const dataUrl = publisherPadRef.current?.toDataURL("image/png");
              setPublisherSignature(dataUrl || "");
            }}
          />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleClear("publisher")}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
            {publisherSignature && (
              <span>
                Saved ({Math.round(publisherSignature.length / 1000)} KB)
              </span>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <section className={`${CARD_CLASSES} ${className}`.trim()}>
        <h2 className={SECTION_TITLE_CLASSES}>
          <ShieldCheck className="h-5 w-5" style={{ color: "#2EAC6D" }} />{" "}
          Digital Signatures
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleModeChange("typed")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              signatureMode === "typed"
                ? "bg-green-50 text-slate-600 hover:border-slate-300"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
            style={
              signatureMode === "typed"
                ? { borderColor: "#2EAC6D", color: "#263149" }
                : {}
            }
          >
            <FileText className="h-4 w-4" /> Typed Signatures
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("drawn")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              signatureMode === "drawn"
                ? "bg-green-50 text-slate-600 hover-border-slate-300"
                : "border-slate-200 bg-white text-slate-600 hover-border-slate-300"
            }`}
            style={
              signatureMode === "drawn"
                ? { borderColor: "#2EAC6D", color: "#263149" }
                : {}
            }
          >
            <PenSquare className="h-4 w-4" /> Draw Signatures
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Switch modes at any time. Changing modes clears existing signatures to
          prevent mixing styles.
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
          {signatureMode === "typed" ? renderTypedInputs() : renderDrawnPads()}
        </div>

        {signatureMode === "drawn" && (
          <p className="text-xs text-slate-500">
            Draw using your mouse or trackpad. Data is stored as PNG images
            inside your Firestore record.
          </p>
        )}
      </section>
    );
  },
);

const InsertionOrderGenerator = () => {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const [firebaseObjects, setFirebaseObjects] = useState(null);

  const [authStatus, setAuthStatus] = useState("loading");
  const [authError, setAuthError] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [contractText, setContractText] = useState("");
  const [docPath, setDocPath] = useState(null);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [buyerSignature, setBuyerSignature] = useState("");
  const [publisherSignature, setPublisherSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState("typed");
  const [buyerSignatureData, setBuyerSignatureData] = useState(null);
  const [publisherSignatureData, setPublisherSignatureData] = useState(null);

  const [view, setView] = useState("form");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [negotiationMode, setNegotiationMode] = useState(false);
  const [negotiationNote, setNegotiationNote] = useState("");
  const [uiError, setUiError] = useState(null);
  // Contract status tracked internally but not currently displayed
  const [_contractStatus, setContractStatus] = useState("draft");

  // E-Signature state
  const [signingContractId, setSigningContractId] = useState(null);
  const [signingLink, setSigningLink] = useState(null);
  const [signingLinkCopied, setSigningLinkCopied] = useState(false);

  // Detect ?sign= URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signId = params.get("sign");
    if (signId) {
      setSigningContractId(signId);
    }
  }, []);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const buyerFieldsComplete = Object.values(formData.buyer).every((value) =>
    String(value || "").trim(),
  );
  const publisherFieldsComplete = Object.values(formData.publisher).every(
    (value) => String(value || "").trim(),
  );

  // Wizard step definitions
  const WIZARD_STEPS = useMemo(
    () => [
      {
        id: 1,
        title: "Contract Type",
        description: "Select the type of agreement to create",
        component: "ContractType",
      },
      {
        id: 2,
        title: "Party Information",
        description: "Enter buyer and publisher details",
        component: "PartyInfo",
      },
      {
        id: 3,
        title: "Campaign Details",
        description: "Configure campaign type and payout",
        component: "CampaignDetails",
      },
      {
        id: 4,
        title: "Requirements & Compliance",
        description: "Set age requirements and compliance options",
        component: "Requirements",
      },
      {
        id: 5,
        title: "Datapass Configuration",
        description: "Configure datapass settings (if needed)",
        component: "DatapassConfig",
      },
      {
        id: 6,
        title: "Review & Generate",
        description: "Review all details and generate contract",
        component: "ReviewGenerate",
      },
    ],
    [],
  );

  // Check if current step is complete
  const isStepComplete = useCallback(
    (stepId) => {
      switch (stepId) {
        case 1:
          return formData.contractType && formData.contractType !== "";
        case 2:
          // Skip party info for LLC agreements
          if (
            formData.contractType ===
              "Auto Insurance LLC Operating Agreement" ||
            formData.contractType === "LLC Operating Agreement"
          ) {
            return true; // Allow manual navigation, don't auto-advance
          }
          return buyerFieldsComplete && publisherFieldsComplete;
        case 3:
          if (formData.contractType === "Employment Contract") {
            return (
              formData.jobTitle &&
              formData.employmentStatus &&
              formData.compensationType &&
              ((formData.compensationType === "Hourly" &&
                formData.hourlyRate) ||
                (formData.compensationType === "Salary" &&
                  formData.salaryAmount) ||
                (formData.compensationType === "Commission" &&
                  formData.commissionRate) ||
                (formData.compensationType === "Hourly + Commission" &&
                  formData.hourlyRate &&
                  formData.commissionRate))
            );
          }
          if (
            formData.contractType ===
              "Auto Insurance LLC Operating Agreement" ||
            formData.contractType === "LLC Operating Agreement"
          ) {
            return true; // All fields are optional for LLC agreements
          }
          if (
            formData.vertical === "Final Expense" &&
            formData.type === "CPA"
          ) {
            return (
              formData.payoutType &&
              ((formData.payoutType === "flat" &&
                formData.payoutLevel &&
                formData.payoutAllOther) ||
                (formData.payoutType === "percentage" &&
                  formData.payoutPercentageLevel &&
                  formData.payoutPercentageAllOther))
            );
          }
          return (
            formData.vertical &&
            formData.type &&
            (formData.type === "ACA Health"
              ? formData.acaSubType === "Partnership"
                ? formData.acaNpnOverride &&
                  formData.acaPerPolicy &&
                  formData.acaAgentBonus
                : formData.acaSubType === "CPL"
                  ? formData.acaCplPayout
                  : formData.acaSubType === "CPA"
                    ? formData.acaCpaPayout
                    : false
              : formData.contractType === "LLC Operating Agreement" ||
                  formData.contractType ===
                    "Auto Insurance LLC Operating Agreement"
                ? true // No payout required for LLC agreements
                : formData.payout)
          );
        case 4:
          // Skip step 4 (Requirements) for ACA Health campaigns, Employment Contracts, and LLC Operating Agreements
          if (
            formData.type === "ACA Health" ||
            formData.type === "Employment Contract" ||
            formData.type === "Auto Insurance LLC Operating Agreement" ||
            formData.vertical === "LLC Operating Agreement"
          ) {
            return true;
          }
          // Requirements step allows any number of selections (including 0) - user must manually click Next
          return true; // Always return true so step is accessible, but auto-advance is disabled in useEffect
        case 5:
          if (formData.type === "Employment Contract") {
            return formData.startDate && formData.jobDescription;
          }
          if (
            formData.type === "Auto Insurance LLC Operating Agreement" ||
            formData.vertical === "LLC Operating Agreement"
          ) {
            return true; // All financial fields are optional for LLC agreements
          }
          return (
            formData.datapass === "No" ||
            (formData.datapass === "Yes" &&
              formData.datapassPostUrl &&
              formData.datapassFields.length > 0)
          );
        case 6:
          return true; // Review step is always available
        default:
          return false;
      }
    },
    [formData, buyerFieldsComplete, publisherFieldsComplete],
  );

  // Auto-progression effect
  useEffect(() => {
    // Disable auto-advance for Employment Contracts, LLC agreements, Party Information (step 2), Campaign Details (step 3), and Requirements step (step 4) - let user manually navigate
    if (
      formData.type === "Employment Contract" ||
      formData.type === "Auto Insurance LLC Operating Agreement" ||
      formData.vertical === "LLC Operating Agreement" ||
      currentStep === 2 ||
      currentStep === 3 ||
      currentStep === 4
    ) {
      return;
    }

    const maxSteps =
      formData.type === "Auto Insurance LLC Operating Agreement" ||
      formData.vertical === "LLC Operating Agreement"
        ? WIZARD_STEPS.filter((step) => step.id !== 5).length // Adjusted for LLC, step 5 (Datapass) is removed
        : WIZARD_STEPS.length;

    if (isStepComplete(currentStep) && currentStep < maxSteps) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));

        // Skip step 4 (Requirements) if ACA Health is selected
        let nextStep = currentStep + 1;
        if (currentStep === 3 && formData.type === "ACA Health") {
          nextStep = 5; // Skip Requirements, go to Datapass step
        }

        setCurrentStep(nextStep);
      }, 1000); // Auto-advance after 1 second when step is complete

      return () => clearTimeout(timer);
    }
  }, [
    currentStep,
    isStepComplete,
    WIZARD_STEPS,
    formData.type,
    formData.vertical,
  ]);

  useEffect(() => {
    if (firebaseReady || typeof window === "undefined") {
      return;
    }

    try {
      const config = window.__firebase_config;
      if (!config) {
        throw new Error(
          "Missing global `__firebase_config`. Ensure it is injected before mounting the app.",
        );
      }

      const targetName = window.__app_id || undefined;
      let app = null;
      const apps = getApps();
      if (apps.length) {
        app = targetName
          ? apps.find((existing) => existing.name === targetName) || apps[0]
          : apps[0];
      }
      if (!app) {
        app = initializeApp(config, targetName);
      }

      const db = getFirestore(app);
      const auth = getAuth(app);
      setFirebaseObjects({ app, db, auth });
    } catch (error) {
      setFirebaseError(error.message || "Firebase initialization failed");
    } finally {
      setFirebaseReady(true);
    }
  }, [firebaseReady]);

  const auth = firebaseObjects?.auth;
  const db = firebaseObjects?.db;

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    let hasAttemptedCustom = false;
    let hasAttemptedAnonymous = false;
    setAuthStatus("loading");
    setAuthError(null);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthStatus("authed");
        setAuthError(null);
        return;
      }

      if (!hasAttemptedCustom) {
        hasAttemptedCustom = true;
        const token = window.__initial_auth_token;
        if (token) {
          try {
            await signInWithCustomToken(auth, token);
            return;
          } catch (error) {
            console.warn("Custom token authentication failed:", error);
          }
        }
      }

      if (!hasAttemptedAnonymous) {
        hasAttemptedAnonymous = true;
        try {
          await signInAnonymously(auth);
          return;
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }

      setAuthStatus("error");
      setAuthError(
        "Authentication failed. Provide `window.__initial_auth_token` or enable anonymous access.",
      );
    });

    return () => unsubscribe();
  }, [auth]);

  const resetContractState = () => {
    setContractText("");
    setDocPath(null);
    setNegotiationHistory([]);
    setBuyerSignature("");
    setPublisherSignature("");
    setSignatureMode("typed");
    setContractStatus("draft");
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-calculate total monthly costs for LLC agreements
      if (field.startsWith("llcMonthly") && field !== "llcTotalMonthlyCosts") {
        const monthlyFields = [
          "llcMonthlyRent",
          "llcMonthlyUtilities",
          "llcMonthlyInsurance",
          "llcMonthlySoftware",
          "llcMonthlyMarketing",
          "llcMonthlySalaries",
          "llcMonthlyOther",
        ];

        const total = monthlyFields.reduce((sum, fieldName) => {
          const fieldValue = fieldName === field ? value : newData[fieldName];
          return sum + (parseFloat(fieldValue) || 0);
        }, 0);

        newData.llcTotalMonthlyCosts = total.toString();
      }

      return newData;
    });
  };

  const toggleArrayValue = (field, value) => {
    setFormData((prev) => {
      const current = new Set(prev[field]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return {
        ...prev,
        [field]: Array.from(current),
      };
    });
  };

  const handlePartyFieldChange = (party, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        [field]: value,
      },
    }));
  };

  const handleGenerateContract = async () => {
    if (!db || !auth) {
      setUiError("Firebase is not ready. Please verify configuration.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setUiError("No authenticated user. Cannot generate contract.");
      return;
    }

    if (formData.type === "Employment Contract") {
      if (
        !formData.jobTitle ||
        !formData.employmentStatus ||
        !formData.compensationType
      ) {
        setUiError(
          "Please complete all employment contract fields before generating the contract.",
        );
        return;
      }
      if (
        (formData.compensationType === "Hourly" ||
          formData.compensationType === "Hourly + Commission") &&
        !formData.hourlyRate
      ) {
        setUiError(
          "Please provide an hourly rate for the selected compensation type.",
        );
        return;
      }
      if (formData.compensationType === "Salary" && !formData.salaryAmount) {
        setUiError(
          "Please provide a salary amount for the selected compensation type.",
        );
        return;
      }
      if (
        (formData.compensationType === "Commission" ||
          formData.compensationType === "Hourly + Commission") &&
        !formData.commissionRate
      ) {
        setUiError(
          "Please provide a commission rate for the selected compensation type.",
        );
        return;
      }
    } else if (formData.type === "ACA Health") {
      if (formData.acaSubType === "Partnership") {
        if (
          !formData.acaNpnOverride ||
          !formData.acaPerPolicy ||
          !formData.acaAgentBonus
        ) {
          setUiError(
            "Please provide all ACA Partnership payment amounts (NPN Override, Per Policy, Agent Bonus) before generating.",
          );
          return;
        }
      } else if (formData.acaSubType === "CPL") {
        if (!formData.acaCplPayout) {
          setUiError(
            "Please provide the payout per qualified call before generating.",
          );
          return;
        }
      } else if (formData.acaSubType === "CPA") {
        if (!formData.acaCpaPayout) {
          setUiError(
            "Please provide the payout per qualified enrollment before generating.",
          );
          return;
        }
      }
    } else if (
      formData.vertical === "Final Expense" &&
      formData.type === "CPA"
    ) {
      if (!formData.payoutType) {
        setUiError("Please select a payout type (flat amount or percentage).");
        return;
      }
      if (
        formData.payoutType === "flat" &&
        (!formData.payoutLevel || !formData.payoutAllOther)
      ) {
        setUiError("Please provide both Level and All Other payout amounts.");
        return;
      }
      if (
        formData.payoutType === "percentage" &&
        (!formData.payoutPercentageLevel || !formData.payoutPercentageAllOther)
      ) {
        setUiError(
          "Please provide both Level and All Other percentage values.",
        );
        return;
      }
    } else if (
      !formData.payout &&
      formData.vertical !== "LLC Operating Agreement" &&
      formData.type !== "Auto Insurance LLC Operating Agreement"
    ) {
      setUiError(
        "Please provide a payout value before generating the contract.",
      );
      return;
    }

    if (
      formData.contractType !== "Auto Insurance LLC Operating Agreement" &&
      formData.contractType !== "LLC Operating Agreement" &&
      (!buyerFieldsComplete || !publisherFieldsComplete)
    ) {
      setUiError(
        "Complete Buyer and Publisher company details before generating the contract.",
      );
      return;
    }

    setUiError(null);
    setGenerating(true);

    try {
      const generatedText = buildContractTemplate(
        formData,
        buyerSignatureData,
        publisherSignatureData,
      );

      const payload = {
        form: {
          ...formData,
          payout:
            formData.vertical === "Final Expense" &&
            formData.type === "CPA" &&
            formData.payoutType === "percentage"
              ? formData.payoutPercentage
              : Number(formData.payout),
          payoutLevel: formData.payoutLevel,
          payoutAllOther: formData.payoutAllOther,
          payoutPercentageLevel: formData.payoutPercentageLevel,
          payoutPercentageAllOther: formData.payoutPercentageAllOther,
        },
        contractText: generatedText,
        status: "generated",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        negotiationNotes: [],
        brokerLiabilityAcknowledged: formData.brokerLiability,
        overseasPublisherClauseIncluded: true,
        userId: user.uid,
      };

      setSaving(true);

      // Include e-signature metadata directly in the main document
      const unsignedHtml = buildContractTemplate(formData, null, null);
      const partyLabels = formData.type === "ACA Health"
        ? (formData.acaSubType === "CPL" || formData.acaSubType === "CPA"
            ? { buyer: "Buyer", publisher: "Publisher" }
            : { buyer: "ACA Insurance Agency", publisher: "Agent Recruiter" })
        : formData.type === "Employment Contract"
          ? { buyer: "Employer", publisher: "Employee" }
          : { buyer: "Buyer/Broker", publisher: "Publisher" };

      payload.signingData = {
        contractHtml: unsignedHtml,
        status: "awaiting_buyer",
        buyerSignature: null,
        publisherSignature: null,
        partyLabels,
      };

      const docRef = await addDoc(
        collection(db, "users", user.uid, "insertionOrders"),
        payload,
      );
      setDocPath(docRef.path);

      // Signing link uses userId:docId format to reference this user's document
      const link = `${window.location.origin}${window.location.pathname}?sign=${user.uid}:${docRef.id}`;
      setSigningLink(link);

      setContractText(generatedText);
      setNegotiationHistory([]);
      setContractStatus("generated");
      setView("contract");
    } catch (error) {
      setUiError(error.message || "Failed to generate contract");
    } finally {
      setSaving(false);
      setGenerating(false);
    }
  };

  const handlePrintContract = () => {
    window.print();
  };

  const handleDownloadContract = () => {
    if (!contractText) {
      setUiError("Nothing to download yet. Generate a contract first.");
      return;
    }
    const blob = new Blob([contractText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ppc-insertion-order-${
      formData.buyer.companyName || "buyer"
    }-${Date.now()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!contractText) {
      setUiError("Nothing to download yet. Generate a contract first.");
      return;
    }

    // Get the contract content element
    const contractElement = document.querySelector(".contract-body");
    if (!contractElement) {
      setUiError("Contract content not found. Please try again.");
      return;
    }

    // Configure PDF options
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `ppc-insertion-order-${
        formData.buyer.companyName || "buyer"
      }-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    };

    // Generate and download PDF
    html2pdf().set(opt).from(contractElement).save();
  };

  // CSV download function - kept for future use
  const _handleDownloadCsv = () => {
    const headers = [
      "Role",
      "Company Name",
      "Entity Type",
      "Address",
      "Email",
      "Phone",
    ];
    const rows = [
      [
        "Buyer",
        formData.buyer.companyName,
        formData.buyer.entityType,
        formData.buyer.address,
        formData.buyer.email,
        formData.buyer.phone,
      ],
      [
        "Publisher",
        formData.publisher.companyName,
        formData.publisher.entityType,
        formData.publisher.address,
        formData.publisher.email,
        formData.publisher.phone,
      ],
    ];
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ppc-io-contacts-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleRequestNegotiation = async () => {
    if (!docPath || !negotiationNote.trim()) {
      setUiError("Add a negotiation note before requesting revisions.");
      return;
    }
    if (!db) {
      setUiError("Firestore is not ready.");
      return;
    }

    try {
      setSaving(true);
      const noteEntry = {
        note: negotiationNote.trim(),
        createdAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, docPath), {
        status: "negotiation_requested",
        updatedAt: serverTimestamp(),
        negotiationNotes: arrayUnion(noteEntry),
      });
      setNegotiationHistory((prev) => [...prev, noteEntry]);
      setNegotiationNote("");
      setNegotiationMode(false);
      setContractStatus("negotiation_requested");
    } catch (error) {
      setUiError(error.message || "Failed to request negotiation");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!docPath) {
      setUiError("Contract document not found. Generate a contract first.");
      return;
    }

    if (!buyerSignature.trim() || !publisherSignature.trim()) {
      setUiError(
        "Both the Buyer/Broker and Publisher signatures are required to finalize.",
      );
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, docPath), {
        status: "finalized",
        updatedAt: serverTimestamp(),
        signedAt: serverTimestamp(),
        signatures: {
          buyer: buyerSignature.trim(),
          publisher: publisherSignature.trim(),
        },
      });
      setUiError(null);
      setContractStatus("finalized");
    } catch (error) {
      setUiError(error.message || "Failed to finalize contract");
    } finally {
      setSaving(false);
    }
  };

  if (firebaseReady && firebaseError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xl">
          <ShieldCheck className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            Firebase Configuration Error
          </h2>
          <p className="mt-2 text-sm text-slate-600">{firebaseError}</p>
        </div>
      </div>
    );
  }

  if (authStatus === "loading" || !firebaseReady || !firebaseObjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 shadow-lg">
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: "#2EAC6D" }}
          />
          <span className="text-sm font-medium text-slate-700">
            Connecting to secure workspace...
          </span>
        </div>
      </div>
    );
  }

  if (authStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
        <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xl">
          <ShieldCheck className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            Authentication Failed
          </h2>
          <p className="mt-2 text-sm text-slate-600">{authError}</p>
        </div>
      </div>
    );
  }

  // If a signing contract ID is in the URL, render the signing page
  if (signingContractId) {
    return (
      <>
        <style>{GLOBAL_STYLE_BLOCK}</style>
        <ContractSigningPage
          contractId={signingContractId}
          db={db}
          auth={auth}
        />
      </>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <style>{GLOBAL_STYLE_BLOCK}</style>
      <div className="flex-1 flex flex-col">
        {/* Header - HIDDEN for contract view */}
        {view === "form" && (
          <div className="flex-shrink-0 text-center py-2">
            <img
              src="/pvnvoice.png"
              alt="PVNVoice"
              style={{ height: "36px", margin: "0 auto 4px" }}
            />
            <h1 className="mt-1 text-lg font-black text-slate-900">
              Agreement Generator
            </h1>
            <p className="text-xs text-slate-600">
              Create compliant contracts in 5 simple steps
            </p>
          </div>
        )}

        {uiError && (
          <div className="flex-shrink-0 mx-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {uiError}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {view === "form" ? (
            <WizardInterface
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              completedSteps={completedSteps}
              setCompletedSteps={setCompletedSteps}
              wizardSteps={
                formData.contractType ===
                  "Auto Insurance LLC Operating Agreement" ||
                formData.contractType === "LLC Operating Agreement"
                  ? WIZARD_STEPS.map((step) => {
                      if (step.id === 2) {
                        return {
                          ...step,
                          title: "LLC Formation",
                          description:
                            "Configure LLC details and member information",
                        };
                      } else if (step.id === 3) {
                        return {
                          ...step,
                          title: "Financial Structure",
                          description:
                            "Set financial terms and performance metrics",
                        };
                      } else if (step.id === 4) {
                        return {
                          ...step,
                          title: "Review & Generate",
                          description: "Review details and generate contract",
                        };
                      }
                      return step;
                    }).filter((step) => step.id !== 5) // Remove Datapass step for LLC
                  : WIZARD_STEPS
              }
              formData={formData}
              onFieldChange={handleFieldChange}
              onToggleArray={toggleArrayValue}
              onPartyFieldChange={handlePartyFieldChange}
              generating={generating}
              saving={saving}
              onGenerate={handleGenerateContract}
              buyerComplete={buyerFieldsComplete}
              publisherComplete={publisherFieldsComplete}
              isStepComplete={isStepComplete}
            />
          ) : (
            <ContractView
              formData={formData}
              contractText={contractText}
              negotiationHistory={negotiationHistory}
              negotiationMode={negotiationMode}
              negotiationNote={negotiationNote}
              setNegotiationMode={setNegotiationMode}
              setNegotiationNote={setNegotiationNote}
              buyerSignatureData={buyerSignatureData}
              publisherSignatureData={publisherSignatureData}
              onRequestNegotiation={handleRequestNegotiation}
              onFinalize={handleFinalize}
              generating={generating}
              saving={saving}
              buyerSignature={buyerSignature}
              publisherSignature={publisherSignature}
              setBuyerSignature={setBuyerSignature}
              setPublisherSignature={setPublisherSignature}
              setBuyerSignatureData={setBuyerSignatureData}
              setPublisherSignatureData={setPublisherSignatureData}
              signatureMode={signatureMode}
              setSignatureMode={setSignatureMode}
              signingLink={signingLink}
              signingLinkCopied={signingLinkCopied}
              setSigningLinkCopied={setSigningLinkCopied}
              onReset={() => {
                resetContractState();
                setView("form");
                setCurrentStep(1);
                setCompletedSteps(new Set());
              }}
              onPrint={handlePrintContract}
              onDownload={handleDownloadContract}
              onDownloadPDF={handleDownloadPDF}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Wizard Interface Component
const WizardInterface = ({
  currentStep,
  setCurrentStep,
  completedSteps,
  setCompletedSteps,
  wizardSteps,
  formData,
  onFieldChange,
  onToggleArray,
  onPartyFieldChange,
  generating,
  saving,
  onGenerate,
  buyerComplete,
  publisherComplete,
  isStepComplete,
}) => {
  const currentStepData = wizardSteps.find((step) => step.id === currentStep);

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        {wizardSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isAccessible =
            step.id <= currentStep || completedSteps.has(step.id);

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                  flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all
                  ${
                    isCompleted
                      ? "text-white"
                      : isCurrent
                        ? "text-white"
                        : isAccessible
                          ? "border-slate-300 bg-white text-slate-600"
                          : "border-slate-200 bg-slate-100 text-slate-400"
                  }
                `}
                  style={
                    isCompleted
                      ? { borderColor: "#143B5E", backgroundColor: "#143B5E" }
                      : isCurrent
                        ? { borderColor: "#2EAC6D", backgroundColor: "#2EAC6D" }
                        : {}
                  }
                >
                  {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : step.id}
                </div>
                <div className="mt-0.5 text-center">
                  <div
                    className={`text-xs font-medium ${
                      isCurrent ? "" : "text-slate-600"
                    }`}
                    style={isCurrent ? { color: "#2EAC6D" } : {}}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
              {index < wizardSteps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-8 ${
                    isCompleted ? "" : "bg-slate-200"
                  }`}
                  style={isCompleted ? { backgroundColor: "#143B5E" } : {}}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ContractTypeStep formData={formData} onFieldChange={onFieldChange} />
        );
      case 2:
        // Skip party info for LLC agreements
        if (
          formData.contractType === "Auto Insurance LLC Operating Agreement" ||
          formData.contractType === "LLC Operating Agreement"
        ) {
          return (
            <LLCFormationStep
              formData={formData}
              onFieldChange={onFieldChange}
            />
          );
        }
        return (
          <PartyInfoStep
            formData={formData}
            onPartyFieldChange={onPartyFieldChange}
          />
        );
      case 3:
        // For LLC agreements, step 3 is Financial Structure (DatapassConfig)
        if (
          formData.contractType === "Auto Insurance LLC Operating Agreement" ||
          formData.contractType === "LLC Operating Agreement"
        ) {
          return (
            <DatapassConfigStep
              formData={formData}
              onFieldChange={onFieldChange}
              onToggleArray={onToggleArray}
            />
          );
        }
        return (
          <CampaignDetailsStep
            formData={formData}
            onFieldChange={onFieldChange}
          />
        );
      case 4:
        // For LLC agreements, step 4 is Review & Generate
        if (
          formData.contractType === "Auto Insurance LLC Operating Agreement" ||
          formData.contractType === "LLC Operating Agreement"
        ) {
          return (
            <ReviewGenerateStep
              formData={formData}
              onGenerate={onGenerate}
              generating={generating}
              saving={saving}
              buyerComplete={buyerComplete}
              publisherComplete={publisherComplete}
            />
          );
        }
        return (
          <RequirementsStep
            formData={formData}
            onToggleArray={onToggleArray}
            onFieldChange={onFieldChange}
          />
        );
      case 5:
        return (
          <DatapassConfigStep
            formData={formData}
            onFieldChange={onFieldChange}
            onToggleArray={onToggleArray}
          />
        );
      case 6:
        return (
          <ReviewGenerateStep
            formData={formData}
            onGenerate={onGenerate}
            generating={generating}
            saving={saving}
            buyerComplete={buyerComplete}
            publisherComplete={publisherComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-2">
        <ProgressIndicator />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-lg mx-2 flex flex-col">
          <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {currentStepData.title}
            </h2>
            <p className="text-xs text-slate-600">
              {currentStepData.description}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            {renderStepContent()}
          </div>

          {/* Navigation - ALWAYS VISIBLE */}
          <div
            className="flex-shrink-0 flex items-center justify-between border-t-2 px-4 py-3"
            style={{ borderColor: "#5BC894", backgroundColor: "#F0FAF5" }}
          >
            <button
              type="button"
              onClick={() => {
                // Smart back navigation based on contract type
                let prevStep = Math.max(1, currentStep - 1);
                if (
                  currentStep === 3 &&
                  (formData.contractType ===
                    "Auto Insurance LLC Operating Agreement" ||
                    formData.contractType === "LLC Operating Agreement")
                ) {
                  prevStep = 1; // Skip back to Contract Type for LLC
                } else if (
                  currentStep === 4 &&
                  (formData.type === "Employment Contract" ||
                    formData.type ===
                      "Auto Insurance LLC Operating Agreement" ||
                    formData.vertical === "LLC Operating Agreement")
                ) {
                  prevStep = 2; // Skip back to Party Info for non-ACA types
                } else if (
                  currentStep === 4 &&
                  formData.type === "ACA Health"
                ) {
                  prevStep = 3; // Go back to Campaign Details for ACA Health
                } else if (
                  currentStep === 3 &&
                  (formData.type === "ACA Health" ||
                    formData.type === "Employment Contract" ||
                    formData.type ===
                      "Auto Insurance LLC Operating Agreement" ||
                    formData.vertical === "LLC Operating Agreement")
                ) {
                  prevStep = 1; // Skip back to Party Info
                } else if (
                  currentStep === 4 &&
                  formData.type !== "ACA Health" &&
                  formData.type !== "Employment Contract" &&
                  formData.type !== "Auto Insurance LLC Operating Agreement" &&
                  formData.vertical !== "LLC Operating Agreement"
                ) {
                  prevStep = 3; // Go back to Requirements step for regular campaigns
                }
                setCurrentStep(prevStep);
              }}
              disabled={false}
              className="inline-flex items-center gap-2 rounded-lg border-2 bg-white px-4 py-2 text-sm font-bold shadow-lg transition"
              style={{ borderColor: "#5BC894", color: "#143B5E" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#F0FAF5")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
            >
              <ArrowLeft className="h-5 w-5" />
              PREVIOUS
            </button>

            <div className="text-sm font-bold" style={{ color: "#143B5E" }}>
              Step {currentStep} of {wizardSteps.length}
            </div>

            {currentStep < wizardSteps.length && (
              <button
                type="button"
                onClick={() => {
                  if (isStepComplete(currentStep)) {
                    setCompletedSteps(
                      (prev) => new Set([...prev, currentStep]),
                    );

                    // Skip step 3 for Employment Contracts only, step 4 (Requirements) for ACA Health
                    let nextStep = currentStep + 1;
                    if (
                      currentStep === 2 &&
                      formData.type === "Employment Contract"
                    ) {
                      nextStep = 4; // Skip Campaign Details for Employment Contracts
                    } else if (
                      currentStep === 3 &&
                      formData.type === "ACA Health"
                    ) {
                      nextStep = 5; // Skip Requirements for ACA Health (go to Datapass)
                    }

                    setCurrentStep(nextStep);
                  }
                }}
                disabled={!isStepComplete(currentStep)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#143B5E" }}
                onMouseEnter={(e) =>
                  !e.target.disabled &&
                  (e.target.style.backgroundColor = "#142D49")
                }
                onMouseLeave={(e) =>
                  !e.target.disabled &&
                  (e.target.style.backgroundColor = "#143B5E")
                }
              >
                NEXT
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
const ContractTypeStep = ({ formData, onFieldChange }) => {
  const contractTypes = [
    {
      value: "Auto Insurance LLC Operating Agreement",
      label: "Auto Insurance LLC Operating Agreement",
      description: "LLC operating agreements for auto insurance agencies",
      featured: true,
    },
    {
      value: "Employment Contract",
      label: "Employment Agreement",
      description: "Employee contracts and agreements",
    },
    {
      value: "ACA Health",
      label: "ACA Health Insurance",
      description: "Health insurance recruitment agreements",
    },
    {
      value: "CPL",
      label: "Cost Per Lead (CPL)",
      description: "Pay per lead generation campaigns",
    },
    {
      value: "CPA",
      label: "Cost Per Acquisition (CPA)",
      description: "Pay per completed sale campaigns",
    },
  ];

  return (
    <div className="h-full flex flex-col max-h-full overflow-y-auto">
      <div className="flex-shrink-0 text-center mb-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Select Contract Type
        </h3>
        <p className="text-xs text-slate-600">
          Choose the type of agreement you want to create
        </p>
      </div>

      <div className="flex-1">
        <div className="grid gap-1.5">
          {contractTypes.map((type) => (
            <div
              key={type.value}
              className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                formData.contractType === type.value
                  ? ""
                  : type.featured
                    ? "hover:bg-slate-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              style={
                formData.contractType === type.value
                  ? { borderColor: "#2EAC6D", backgroundColor: "#F0FAF5" }
                  : type.featured
                    ? { borderColor: "#5BC894", backgroundColor: "#F0FAF5" }
                    : {}
              }
              onClick={() => {
                onFieldChange("contractType", type.value);
                // Also set the legacy fields for backward compatibility
                if (type.value === "Auto Insurance LLC Operating Agreement") {
                  onFieldChange(
                    "type",
                    "Auto Insurance LLC Operating Agreement",
                  );
                  onFieldChange("vertical", "LLC Operating Agreement");
                } else if (type.value === "Employment Contract") {
                  onFieldChange("type", "Employment Contract");
                } else if (type.value === "ACA Health") {
                  onFieldChange("type", "ACA Health");
                } else {
                  onFieldChange("type", type.value);
                }
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      formData.contractType === type.value
                        ? ""
                        : "border-slate-300"
                    }`}
                    style={
                      formData.contractType === type.value
                        ? { borderColor: "#2EAC6D", backgroundColor: "#2EAC6D" }
                        : {}
                    }
                  >
                    {formData.contractType === type.value && (
                      <div className="w-1 h-1 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h4 className="font-medium text-slate-900 text-xs">
                      {type.label}
                    </h4>
                    {type.featured && (
                      <span
                        className="px-1.5 py-0.5 text-xs font-bold text-white rounded-full"
                        style={{ backgroundColor: "#2EAC6D" }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PartyInfoStep = ({ formData, onPartyFieldChange }) => {
  const makePartyInputId = (party, field) => `${party}-${field}`;

  const renderPartySection = (partyKey, label) => {
    const partyData = formData[partyKey];
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Company Name
            </label>
            <input
              id={makePartyInputId(partyKey, "companyName")}
              type="text"
              required
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={partyData.companyName}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "companyName", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Entity Type
            </label>
            <select
              id={makePartyInputId(partyKey, "entityType")}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={partyData.entityType}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "entityType", e.target.value)
              }
            >
              {ENTITY_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address
            </label>
            <input
              id={makePartyInputId(partyKey, "address")}
              type="text"
              required
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={partyData.address}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "address", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id={makePartyInputId(partyKey, "email")}
              type="email"
              required
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={partyData.email}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "email", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              id={makePartyInputId(partyKey, "phone")}
              type="tel"
              required
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={partyData.phone}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "phone", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderPartySection(
        "buyer",
        formData?.type === "ACA Health"
          ? "ACA Insurance Agency Information"
          : "Buyer / Broker Information",
      )}
      {renderPartySection(
        "publisher",
        formData?.type === "ACA Health"
          ? "Agent Recruiter Information"
          : "Publisher Information",
      )}
    </div>
  );
};

const LLCFormationStep = ({ formData, onFieldChange }) => {
  return (
    <div className="space-y-4 max-h-full overflow-y-auto">
      <div className="rounded border border-green-200 bg-green-50 p-3">
        <h4 className="font-semibold text-sm" style={{ color: "#263149" }}>
          LLC Formation Details
        </h4>
        <p className="text-xs" style={{ color: "#263149" }}>
          Enter the basic LLC formation information. All fields are optional.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Company Name
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcCompanyName || ""}
            onChange={(e) => onFieldChange("llcCompanyName", e.target.value)}
            placeholder="[Company Name]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            State of Formation
          </label>
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcState || ""}
            onChange={(e) => onFieldChange("llcState", e.target.value)}
          >
            <option value="">Select state</option>
            {LLC_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Formation Date
          </label>
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcFormationDate || ""}
            onChange={(e) => onFieldChange("llcFormationDate", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Registered Address
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcRegisteredAddress || ""}
            onChange={(e) =>
              onFieldChange("llcRegisteredAddress", e.target.value)
            }
            placeholder="[Full Address]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-semibold text-slate-700 text-sm">
          Member Information
        </h5>
        <p className="text-xs text-slate-600">Enter member names and roles</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Investor Name
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcInvestorName || ""}
            onChange={(e) => onFieldChange("llcInvestorName", e.target.value)}
            placeholder="[Investor Name]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Investor Contribution ($)
          </label>
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcInvestorContribution || ""}
            onChange={(e) =>
              onFieldChange("llcInvestorContribution", e.target.value)
            }
            placeholder="[Amount]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 1 Name
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember1Name || ""}
            onChange={(e) => onFieldChange("llcMember1Name", e.target.value)}
            placeholder="[Member 1 Name]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 1 Contribution ($)
          </label>
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember1Contribution || ""}
            onChange={(e) =>
              onFieldChange("llcMember1Contribution", e.target.value)
            }
            placeholder="[Amount]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 1 Role
          </label>
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember1Role || ""}
            onChange={(e) => onFieldChange("llcMember1Role", e.target.value)}
          >
            <option value="">Select role</option>
            {LLC_MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 2 Name
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember2Name || ""}
            onChange={(e) => onFieldChange("llcMember2Name", e.target.value)}
            placeholder="[Member 2 Name]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 2 Contribution ($)
          </label>
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember2Contribution || ""}
            onChange={(e) =>
              onFieldChange("llcMember2Contribution", e.target.value)
            }
            placeholder="[Amount]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Member 2 Role
          </label>
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcMember2Role || ""}
            onChange={(e) => onFieldChange("llcMember2Role", e.target.value)}
          >
            <option value="">Select role</option>
            {LLC_MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const CampaignDetailsStep = ({ formData, onFieldChange }) => {
  return (
    <div className="space-y-3 max-h-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Vertical
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.vertical}
            onChange={(e) => onFieldChange("vertical", e.target.value)}
          >
            {VERTICALS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.type}
            onChange={(e) => onFieldChange("type", e.target.value)}
          >
            {CAMPAIGN_TYPES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {formData.type === "Auto Insurance LLC Operating Agreement" ||
      formData.vertical === "LLC Operating Agreement" ? (
        <div className="space-y-2">
          <div className="rounded border border-green-200 bg-green-50 p-2">
            <h4 className="font-semibold text-sm" style={{ color: "#263149" }}>
              Auto Insurance LLC Operating Agreement
            </h4>
            <p className="text-xs" style={{ color: "#263149" }}>
              Configure LLC formation and member information.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                LLC Company Name *
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.llcCompanyName}
                onChange={(e) =>
                  onFieldChange("llcCompanyName", e.target.value)
                }
                placeholder="ABC Insurance Agency LLC"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                State of Formation
              </label>
              <select
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.llcState}
                onChange={(e) => onFieldChange("llcState", e.target.value)}
              >
                {LLC_STATES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Formation Date
              </label>
              <input
                type="date"
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.llcFormationDate}
                onChange={(e) =>
                  onFieldChange("llcFormationDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Registered Address
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.llcRegisteredAddress}
                onChange={(e) =>
                  onFieldChange("llcRegisteredAddress", e.target.value)
                }
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-slate-700 text-sm">
              Member Information
            </h5>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Investor Name
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcInvestorName}
                  onChange={(e) =>
                    onFieldChange("llcInvestorName", e.target.value)
                  }
                  placeholder="Ikram"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Ownership %
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcInvestorOwnership}
                  onChange={(e) =>
                    onFieldChange("llcInvestorOwnership", e.target.value)
                  }
                >
                  {LLC_OWNERSHIP_PERCENTAGES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Contribution ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcInvestorContribution}
                  onChange={(e) =>
                    onFieldChange("llcInvestorContribution", e.target.value)
                  }
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Member 1 Name
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember1Name}
                  onChange={(e) =>
                    onFieldChange("llcMember1Name", e.target.value)
                  }
                  placeholder="James Kelly"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Ownership %
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember1Ownership}
                  onChange={(e) =>
                    onFieldChange("llcMember1Ownership", e.target.value)
                  }
                >
                  {LLC_OWNERSHIP_PERCENTAGES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Contribution ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember1Contribution}
                  onChange={(e) =>
                    onFieldChange("llcMember1Contribution", e.target.value)
                  }
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Member 2 Name
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember2Name}
                  onChange={(e) =>
                    onFieldChange("llcMember2Name", e.target.value)
                  }
                  placeholder="Nasir"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Ownership %
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember2Ownership}
                  onChange={(e) =>
                    onFieldChange("llcMember2Ownership", e.target.value)
                  }
                >
                  {LLC_OWNERSHIP_PERCENTAGES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Contribution ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.llcMember2Contribution}
                  onChange={(e) =>
                    onFieldChange("llcMember2Contribution", e.target.value)
                  }
                  placeholder="25000"
                />
              </div>
            </div>
          </div>
        </div>
      ) : formData.type === "Employment Contract" ? (
        <div className="space-y-1">
          <div className="rounded border border-green-200 bg-green-50 p-1">
            <h4 className="font-semibold text-xs" style={{ color: "#263149" }}>
              Employment Agreement
            </h4>
            <p className="text-xs" style={{ color: "#263149" }}>
              Configure employment terms, compensation, and job details.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Job Title
              </label>
              <select
                className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                value={formData.jobTitle}
                onChange={(e) => onFieldChange("jobTitle", e.target.value)}
              >
                {JOB_TITLES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Employment Status
              </label>
              <select
                className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                value={formData.employmentStatus}
                onChange={(e) =>
                  onFieldChange("employmentStatus", e.target.value)
                }
              >
                {EMPLOYMENT_STATUS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.jobTitle === "Other" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Custom Job Title
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.jobTitleOther}
                onChange={(e) => onFieldChange("jobTitleOther", e.target.value)}
                placeholder="Enter custom job title"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Compensation Type
            </label>
            <select
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.compensationType}
              onChange={(e) =>
                onFieldChange("compensationType", e.target.value)
              }
            >
              {COMPENSATION_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {(formData.compensationType === "Hourly" ||
              formData.compensationType === "Hourly + Commission") && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                  value={formData.hourlyRate}
                  onChange={(e) => onFieldChange("hourlyRate", e.target.value)}
                  placeholder="25.00"
                />
              </div>
            )}

            {formData.compensationType === "Salary" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Annual Salary ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                  value={formData.salaryAmount}
                  onChange={(e) =>
                    onFieldChange("salaryAmount", e.target.value)
                  }
                  placeholder="75000"
                />
              </div>
            )}

            {(formData.compensationType === "Commission" ||
              formData.compensationType === "Hourly + Commission") && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    onFieldChange("commissionRate", e.target.value)
                  }
                  placeholder="5.0"
                />
              </div>
            )}
          </div>

          {(formData.compensationType === "Commission" ||
            formData.compensationType === "Hourly + Commission") && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Commission Structure
              </label>
              <textarea
                className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                rows="2"
                value={formData.commissionStructure}
                onChange={(e) =>
                  onFieldChange("commissionStructure", e.target.value)
                }
                placeholder="Describe how commissions are calculated, when they are paid, and any minimum thresholds..."
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Benefits Package
            </label>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {BENEFITS_OPTIONS.map((benefit) => (
                <label key={benefit} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.benefits?.includes(benefit) || false}
                    onChange={(e) => {
                      const currentBenefits = formData.benefits || [];
                      if (e.target.checked) {
                        onFieldChange("benefits", [
                          ...currentBenefits,
                          benefit,
                        ]);
                      } else {
                        onFieldChange(
                          "benefits",
                          currentBenefits.filter((b) => b !== benefit),
                        );
                      }
                    }}
                  />
                  <span className="text-xs text-slate-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Work Schedule
            </label>
            <select
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.workSchedule}
              onChange={(e) => onFieldChange("workSchedule", e.target.value)}
            >
              {WORK_SCHEDULE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      ) : formData.type === "ACA Health" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold" style={{ color: "#263149" }}>
              ACA Insurance Agency Agreement
            </h4>
            <p className="mt-2 text-sm" style={{ color: "#263149" }}>
              Select agreement type and configure payment structure.
            </p>
          </div>

          {/* ACA Sub-Type Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Agreement Type
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ACA_SUB_TYPES.map((subType) => (
                <label
                  key={subType.value}
                  className={`flex flex-col gap-1 rounded-lg border-2 px-3 py-2 cursor-pointer transition ${
                    formData.acaSubType === subType.value
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acaSubType"
                      value={subType.value}
                      checked={formData.acaSubType === subType.value}
                      onChange={(e) => onFieldChange("acaSubType", e.target.value)}
                      className="h-4 w-4 text-green-600"
                    />
                    <span className="text-sm font-bold" style={{ color: "#263149" }}>
                      {subType.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 ml-6">{subType.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Partnership Fields */}
          {formData.acaSubType === "Partnership" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  NPN Override Amount ($/month)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.acaNpnOverride}
                  onChange={(e) =>
                    onFieldChange("acaNpnOverride", e.target.value)
                  }
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Per Policy Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.acaPerPolicy}
                  onChange={(e) => onFieldChange("acaPerPolicy", e.target.value)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Agent Bonus ($/month)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.acaAgentBonus}
                  onChange={(e) => onFieldChange("acaAgentBonus", e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          )}

          {/* CPL Fields */}
          {formData.acaSubType === "CPL" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Payout per Qualified Call ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.acaCplPayout}
                  onChange={(e) => onFieldChange("acaCplPayout", e.target.value)}
                  placeholder="45"
                />
                <p className="text-xs text-slate-500">
                  Amount paid per call that meets or exceeds the duration threshold.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Call Duration / Buffer Time (seconds)
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.acaCplBufferTime}
                  onChange={(e) => onFieldChange("acaCplBufferTime", e.target.value)}
                >
                  {BUFFER_TIMES.map((option) => (
                    <option key={option} value={option}>
                      {option} seconds
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Minimum call duration to qualify for payout.
                </p>
              </div>
            </div>
          )}

          {/* CPA Fields */}
          {formData.acaSubType === "CPA" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Payout per Qualified Enrollment ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.acaCpaPayout}
                onChange={(e) => onFieldChange("acaCpaPayout", e.target.value)}
                placeholder="150"
              />
              <p className="text-xs text-slate-500">
                Amount paid per verified ACA health insurance enrollment/policy sale.
              </p>
            </div>
          )}

          {/* Shared fields for all ACA sub-types */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Billing Cycle
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.acaBillingCycle}
                onChange={(e) =>
                  onFieldChange("acaBillingCycle", e.target.value)
                }
              >
                {BILLING_CYCLES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Chargeback Liability Period
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.acaChargebackLiability}
                onChange={(e) =>
                  onFieldChange("acaChargebackLiability", e.target.value)
                }
              >
                {CHARGEBACK_LIABILITY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Time period the recruiter is liable for policy
                chargebacks/lapses.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Agreement Duration (months)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.acaDuration}
                onChange={(e) =>
                  onFieldChange("acaDuration", e.target.value)
                }
                placeholder="12"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.brokerLiability}
              onChange={(e) =>
                onFieldChange("brokerLiability", e.target.checked)
              }
            />
            <label className="text-sm text-slate-700">
              Agency accepts liability for payment if carrier defaults
            </label>
          </div>
        </div>

      ) : formData.vertical === "Final Expense" && formData.type === "CPA" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Payout Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  formData.payoutType === "flat"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="payoutType"
                  value="flat"
                  checked={formData.payoutType === "flat"}
                  onChange={(e) => onFieldChange("payoutType", e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                Flat Dollar Amount
              </label>
              <label
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  formData.payoutType === "percentage"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="payoutType"
                  value="percentage"
                  checked={formData.payoutType === "percentage"}
                  onChange={(e) => onFieldChange("payoutType", e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                Percentage of Premium
              </label>
            </div>
          </div>

          {formData.payoutType === "flat" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Level Payout ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.payoutLevel}
                  onChange={(e) => onFieldChange("payoutLevel", e.target.value)}
                  placeholder="Level amount"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  All Other Payout ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.payoutAllOther}
                  onChange={(e) =>
                    onFieldChange("payoutAllOther", e.target.value)
                  }
                  placeholder="All other amount"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Level Payout (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.payoutPercentageLevel}
                  onChange={(e) =>
                    onFieldChange("payoutPercentageLevel", e.target.value)
                  }
                  placeholder="Level %"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  All Other Payout (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.payoutPercentageAllOther}
                  onChange={(e) =>
                    onFieldChange("payoutPercentageAllOther", e.target.value)
                  }
                  placeholder="All other %"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Chargeback Liability Period
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.chargebackLiability}
              onChange={(e) =>
                onFieldChange("chargebackLiability", e.target.value)
              }
            >
              {CHARGEBACK_LIABILITY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Time period the publisher is liable for chargebacks/lapses.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Payout ($ per billable event)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.payout}
            onChange={(e) => onFieldChange("payout", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Billing Cycle
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.billingCycle}
            onChange={(e) => onFieldChange("billingCycle", e.target.value)}
          >
            {BILLING_CYCLES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        {formData.type === "CPL" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Buffer Time (seconds)
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.bufferTime}
              onChange={(e) => onFieldChange("bufferTime", e.target.value)}
            >
              {BUFFER_TIMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={formData.brokerLiability}
          onChange={(e) => onFieldChange("brokerLiability", e.target.checked)}
        />
        <label className="text-sm text-slate-700">
          Broker accepts liability for call costs if end-user defaults on
          payment
        </label>
      </div>
    </div>
  );
};

const RequirementsStep = ({ formData, onToggleArray, onFieldChange }) => {
  return (
    <div className="space-y-3 max-h-full overflow-y-auto">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Age Requirements
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {REQUIREMENTS_OPTIONS.map((requirement) => {
            const id = `req-${requirement}`;
            return (
              <label
                key={requirement}
                htmlFor={id}
                className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 hover:bg-slate-100"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.requirements.includes(requirement)}
                  onChange={() => onToggleArray("requirements", requirement)}
                />
                <span className="text-xs">{requirement}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Compliance Options
        </h3>

        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Proof of Consent
            </label>
            <div className="grid grid-cols-3 gap-1">
              {PROOF_OF_CONSENT_OPTIONS.map((option) => {
                const id = `proof-${option}`;
                return (
                  <label
                    key={option}
                    htmlFor={id}
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition ${
                      formData.proofOfConsent === option
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="proof"
                      className="h-3 w-3 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.proofOfConsent === option}
                      onChange={() => onFieldChange("proofOfConsent", option)}
                    />
                    <span className="text-xs">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Datapass
            </label>
            <div className="grid grid-cols-2 gap-1">
              {["Yes", "No"].map((option) => {
                const id = `datapass-${option}`;
                return (
                  <label
                    key={option}
                    htmlFor={id}
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition ${
                      formData.datapass === option
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="datapass"
                      className="h-3 w-3 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.datapass === option}
                      onChange={() => onFieldChange("datapass", option)}
                    />
                    <span className="text-xs">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatapassConfigStep = ({ formData, onFieldChange, onToggleArray }) => {
  if (
    formData.type === "Auto Insurance LLC Operating Agreement" ||
    formData.vertical === "LLC Operating Agreement"
  ) {
    return (
      <div className="space-y-3 overflow-y-auto">
        <div className="rounded border border-green-200 bg-green-50 p-3">
          <h4 className="font-semibold text-sm" style={{ color: "#263149" }}>
            Financial Structure & Performance Metrics
          </h4>
          <p className="text-xs" style={{ color: "#263149" }}>
            Configure working capital, recovery terms, and performance targets.
            All fields are optional.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Max Working Capital ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMaxWorkingCapital}
              onChange={(e) =>
                onFieldChange("llcMaxWorkingCapital", e.target.value)
              }
              placeholder="500000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Min Cash Reserves ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMinReserves}
              onChange={(e) => onFieldChange("llcMinReserves", e.target.value)}
              placeholder="100000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Interest Rate
            </label>
            <select
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcInterestRate}
              onChange={(e) => onFieldChange("llcInterestRate", e.target.value)}
            >
              {LLC_INTEREST_RATES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Recovery Percentage
            </label>
            <select
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcRecoveryPercentage}
              onChange={(e) =>
                onFieldChange("llcRecoveryPercentage", e.target.value)
              }
            >
              {LLC_RECOVERY_PERCENTAGES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-slate-700 text-sm">
            Performance Metrics
          </h5>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Min Carriers
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMinCarriers}
              onChange={(e) => onFieldChange("llcMinCarriers", e.target.value)}
              placeholder="5"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Agent Retention %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcAgentRetention}
              onChange={(e) =>
                onFieldChange("llcAgentRetention", e.target.value)
              }
              placeholder="85"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Quarterly Targets ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcQuarterlyTargets}
              onChange={(e) =>
                onFieldChange("llcQuarterlyTargets", e.target.value)
              }
              placeholder="500000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Min Leads/Month
            </label>
            <input
              type="number"
              min="0"
              step="10"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMinLeads}
              onChange={(e) => onFieldChange("llcMinLeads", e.target.value)}
              placeholder="1000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Conversion Rate %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcConversionRate}
              onChange={(e) =>
                onFieldChange("llcConversionRate", e.target.value)
              }
              placeholder="15.5"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Max CPA ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMaxCPA}
              onChange={(e) => onFieldChange("llcMaxCPA", e.target.value)}
              placeholder="150"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-slate-700 text-sm">
            Authority Limits
          </h5>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Operational Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcOperationalLimit}
              onChange={(e) =>
                onFieldChange("llcOperationalLimit", e.target.value)
              }
              placeholder="10000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Marketing Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMarketingLimit}
              onChange={(e) =>
                onFieldChange("llcMarketingLimit", e.target.value)
              }
              placeholder="15000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Financial Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcFinancialLimit}
              onChange={(e) =>
                onFieldChange("llcFinancialLimit", e.target.value)
              }
              placeholder="25000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              E&O Coverage ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcEOCoverage}
              onChange={(e) => onFieldChange("llcEOCoverage", e.target.value)}
              placeholder="1000000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Bonus Percentage %
            </label>
            <select
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcBonusPercentage}
              onChange={(e) =>
                onFieldChange("llcBonusPercentage", e.target.value)
              }
            >
              <option value="">Select percentage</option>
              {LLC_PERCENTAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Management Fee %
            </label>
            <select
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcManagementFeePercentage}
              onChange={(e) =>
                onFieldChange("llcManagementFeePercentage", e.target.value)
              }
            >
              <option value="">Select percentage</option>
              {LLC_PERCENTAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-slate-700 text-sm">
            Monthly Cost Tracking
          </h5>
          <p className="text-xs text-slate-600">
            Track estimated monthly operating costs that the investor will cover
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Rent ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlyRent}
              onChange={(e) => onFieldChange("llcMonthlyRent", e.target.value)}
              placeholder="3000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Utilities ($)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlyUtilities}
              onChange={(e) =>
                onFieldChange("llcMonthlyUtilities", e.target.value)
              }
              placeholder="500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Insurance ($)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlyInsurance}
              onChange={(e) =>
                onFieldChange("llcMonthlyInsurance", e.target.value)
              }
              placeholder="200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Software ($)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlySoftware}
              onChange={(e) =>
                onFieldChange("llcMonthlySoftware", e.target.value)
              }
              placeholder="800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Marketing ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlyMarketing}
              onChange={(e) =>
                onFieldChange("llcMonthlyMarketing", e.target.value)
              }
              placeholder="5000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Monthly Salaries ($)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlySalaries}
              onChange={(e) =>
                onFieldChange("llcMonthlySalaries", e.target.value)
              }
              placeholder="15000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Other Monthly Costs ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcMonthlyOther}
              onChange={(e) => onFieldChange("llcMonthlyOther", e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Total Monthly Costs ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none bg-slate-50"
              value={formData.llcTotalMonthlyCosts}
              onChange={(e) =>
                onFieldChange("llcTotalMonthlyCosts", e.target.value)
              }
              placeholder="25000"
              readOnly
            />
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-slate-700 text-sm">
            Investor Return Planning
          </h5>
          <p className="text-xs text-slate-600">
            Define clear plan for investor return and exit strategy
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Expected Monthly Revenue ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcExpectedMonthlyRevenue}
              onChange={(e) =>
                onFieldChange("llcExpectedMonthlyRevenue", e.target.value)
              }
              placeholder="40000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Break-Even Timeline (Months)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcBreakEvenMonths}
              onChange={(e) =>
                onFieldChange("llcBreakEvenMonths", e.target.value)
              }
              placeholder="12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Investor Return Timeline (Months)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcInvestorReturnTimeline}
              onChange={(e) =>
                onFieldChange("llcInvestorReturnTimeline", e.target.value)
              }
              placeholder="36"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Liquidation Preference
            </label>
            <select
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcLiquidationPreference}
              onChange={(e) =>
                onFieldChange("llcLiquidationPreference", e.target.value)
              }
            >
              <option value="">Select Preference</option>
              <option value="1x">1x (Par)</option>
              <option value="1.5x">1.5x</option>
              <option value="2x">2x</option>
              <option value="3x">3x</option>
              <option value="Non-participating">Non-participating</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Exit Strategy
          </label>
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcExitStrategy}
            onChange={(e) => onFieldChange("llcExitStrategy", e.target.value)}
          >
            <option value="">Select Exit Strategy</option>
            <option value="IPO">Initial Public Offering (IPO)</option>
            <option value="Acquisition">Strategic Acquisition</option>
            <option value="Management Buyout">Management Buyout</option>
            <option value="Dividend Distribution">Dividend Distribution</option>
            <option value="Asset Sale">Asset Sale</option>
            <option value="Liquidation">Liquidation</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Jurisdiction
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcJurisdiction}
            onChange={(e) => onFieldChange("llcJurisdiction", e.target.value)}
            placeholder="State of Delaware"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Amendment Notice (Days)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcAmendmentNoticePeriod}
              onChange={(e) =>
                onFieldChange("llcAmendmentNoticePeriod", e.target.value)
              }
              placeholder="30"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Payment Period (Years)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcPaymentPeriod}
              onChange={(e) =>
                onFieldChange("llcPaymentPeriod", e.target.value)
              }
              placeholder="5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Execution Date
            </label>
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcExecutionDate}
              onChange={(e) =>
                onFieldChange("llcExecutionDate", e.target.value)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              County
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.llcCounty}
              onChange={(e) => onFieldChange("llcCounty", e.target.value)}
              placeholder="New Castle County"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Notary Expiration Date
          </label>
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.llcNotaryExpiration}
            onChange={(e) =>
              onFieldChange("llcNotaryExpiration", e.target.value)
            }
          />
        </div>
      </div>
    );
  }

  if (formData.type === "Employment Contract") {
    return (
      <div className="space-y-1">
        <div className="rounded border border-green-200 bg-green-50 p-1">
          <h4 className="font-semibold text-xs" style={{ color: "#263149" }}>
            Job Details & Requirements
          </h4>
          <p className="text-xs" style={{ color: "#263149" }}>
            Specify job description, start date, and employment details.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.startDate}
              onChange={(e) => onFieldChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Reporting Manager
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              value={formData.reportingManager}
              onChange={(e) =>
                onFieldChange("reportingManager", e.target.value)
              }
              placeholder="Manager's name"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Department
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.department}
            onChange={(e) => onFieldChange("department", e.target.value)}
            placeholder="Sales, Marketing, Operations, etc."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Job Description
          </label>
          <textarea
            className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            rows="2"
            value={formData.jobDescription}
            onChange={(e) => onFieldChange("jobDescription", e.target.value)}
            placeholder="Describe the key responsibilities, duties, and expectations for this position..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Performance Metrics
          </label>
          <textarea
            className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            rows="1"
            value={formData.performanceMetrics}
            onChange={(e) =>
              onFieldChange("performanceMetrics", e.target.value)
            }
            placeholder="Define how performance will be measured (sales targets, KPIs, etc.)..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Probationary Period
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
            value={formData.probationaryPeriod}
            onChange={(e) =>
              onFieldChange("probationaryPeriod", e.target.value)
            }
            placeholder="e.g., 90 days, 6 months, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Training Requirements
            </label>
            <textarea
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              rows="1"
              value={formData.trainingRequirements}
              onChange={(e) =>
                onFieldChange("trainingRequirements", e.target.value)
              }
              placeholder="Specify any required training, certifications, or onboarding requirements..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Travel Requirements
            </label>
            <textarea
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              rows="1"
              value={formData.travelRequirements}
              onChange={(e) =>
                onFieldChange("travelRequirements", e.target.value)
              }
              placeholder="Describe any travel expectations or requirements..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Equipment Provided
            </label>
            <textarea
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              rows="1"
              value={formData.equipmentProvided}
              onChange={(e) =>
                onFieldChange("equipmentProvided", e.target.value)
              }
              placeholder="List equipment, tools, or resources that will be provided..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Remote Work Policy
            </label>
            <textarea
              className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-indigo-500 focus:outline-none"
              rows="1"
              value={formData.remoteWorkPolicy}
              onChange={(e) =>
                onFieldChange("remoteWorkPolicy", e.target.value)
              }
              placeholder="Describe remote work arrangements, if applicable..."
            />
          </div>
        </div>
      </div>
    );
  }

  if (formData.datapass !== "Yes") {
    return (
      <div className="text-center py-8">
        <div className="text-slate-500">
          Datapass configuration is not needed for this campaign.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Platform
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.datapassPlatform}
            onChange={(e) => onFieldChange("datapassPlatform", e.target.value)}
          >
            {DATAPASS_PLATFORM_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        {formData.datapassPlatform === "Other" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Custom Platform Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.datapassOtherPlatform}
              onChange={(e) =>
                onFieldChange("datapassOtherPlatform", e.target.value)
              }
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            POST URL
          </label>
          <input
            type="url"
            placeholder="https://"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={formData.datapassPostUrl}
            onChange={(e) => onFieldChange("datapassPostUrl", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Required Fields
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DATAPASS_FIELDS.map((field) => {
            const id = `field-${field}`;
            return (
              <label
                key={field}
                htmlFor={id}
                className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.datapassFields.includes(field)}
                  onChange={() => onToggleArray("datapassFields", field)}
                />
                <span>{field}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ReviewGenerateStep = ({
  formData,
  onGenerate,
  generating,
  saving,
  buyerComplete,
  publisherComplete,
}) => {
  return (
    <div className="space-y-4 max-h-full overflow-y-auto">
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "#F0FAF5", borderColor: "#5BC894" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6" style={{ color: "#2EAC6D" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#263149" }}>
            Ready to Generate Contract
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "#263149" }}>
          All required information has been collected. The AI will generate a
          compliant insertion order with overseas publisher fairness clauses and
          broker liability language based on your selections.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium" style={{ color: "#263149" }}>
              Campaign Summary
            </h4>
            <div className="text-sm space-y-1" style={{ color: "#263149" }}>
              <div>
                <strong>Vertical:</strong> {formData.vertical}
              </div>
              <div>
                <strong>Type:</strong> {formData.type}
              </div>
              {formData.type === "ACA Health" ? (
                <>
                  <div>
                    <strong>Agreement Type:</strong> ACA {formData.acaSubType}
                  </div>
                  {formData.acaSubType === "Partnership" && (
                    <>
                      <div>
                        <strong>NPN Override:</strong> ${formData.acaNpnOverride}
                        /month
                      </div>
                      <div>
                        <strong>Per Policy:</strong> ${formData.acaPerPolicy}
                      </div>
                      <div>
                        <strong>Agent Bonus:</strong> ${formData.acaAgentBonus}
                        /month
                      </div>
                    </>
                  )}
                  {formData.acaSubType === "CPL" && (
                    <>
                      <div>
                        <strong>Payout per Call:</strong> ${formData.acaCplPayout}
                      </div>
                      <div>
                        <strong>Buffer Time:</strong> {formData.acaCplBufferTime} seconds
                      </div>
                    </>
                  )}
                  {formData.acaSubType === "CPA" && (
                    <div>
                      <strong>Payout per Enrollment:</strong> ${formData.acaCpaPayout}
                    </div>
                  )}
                  <div>
                    <strong>Billing Cycle:</strong> {formData.acaBillingCycle}
                  </div>
                  <div>
                    <strong>Chargeback Liability:</strong>{" "}
                    {formData.acaChargebackLiability}
                  </div>
                  <div>
                    <strong>Duration:</strong> {formData.acaDuration} months
                  </div>
                  <div>
                    <strong>Agency Liability:</strong>{" "}
                    {formData.brokerLiability ? "Accepted" : "Declined"}
                  </div>
                </>
              ) : (
                <div>
                  <strong>Payout:</strong> ${formData.payout} per event
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium" style={{ color: "#263149" }}>
              Parties
            </h4>
            <div className="text-sm space-y-1" style={{ color: "#263149" }}>
              <div>
                <strong>Buyer:</strong> {formData.buyer.companyName}
              </div>
              <div>
                <strong>Publisher:</strong> {formData.publisher.companyName}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={
            generating ||
            saving ||
            (formData.contractType !==
              "Auto Insurance LLC Operating Agreement" &&
              formData.contractType !== "LLC Operating Agreement" &&
              (!buyerComplete || !publisherComplete))
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg transition disabled:cursor-not-allowed"
          style={{
            backgroundColor:
              generating ||
              saving ||
              (formData.contractType !==
                "Auto Insurance LLC Operating Agreement" &&
                formData.contractType !== "LLC Operating Agreement" &&
                (!buyerComplete || !publisherComplete))
                ? "#9ca3af"
                : "#143B5E",
          }}
          onMouseEnter={(e) =>
            !e.target.disabled && (e.target.style.backgroundColor = "#142D49")
          }
          onMouseLeave={(e) =>
            !e.target.disabled && (e.target.style.backgroundColor = "#143B5E")
          }
          onMouseDown={(e) =>
            !e.target.disabled && (e.target.style.backgroundColor = "#142D49")
          }
          onMouseUp={(e) =>
            !e.target.disabled && (e.target.style.backgroundColor = "#143B5E")
          }
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {generating ? "Generating Contract..." : "Generate Contract"}
        </button>
      </div>
    </div>
  );
};

const FormView = ({
  formData,
  onFieldChange,
  onToggleArray,
  onPartyFieldChange,
  generating,
  saving,
  onGenerate,
  buyerComplete,
  publisherComplete,
}) => {
  const makePartyInputId = (party, field) => `${party}-${field}`;
  const renderPartySection = (partyKey, label) => {
    const partyData = formData[partyKey];
    return (
      <section className={CARD_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>
          <PenSquare className="h-5 w-5 text-indigo-600" /> {label}
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Company Name</label>
            <input
              id={makePartyInputId(partyKey, "companyName")}
              type="text"
              required
              className={INPUT_BASE_CLASSES}
              value={partyData.companyName}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "companyName", e.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Legal Entity Type</label>
            <select
              id={makePartyInputId(partyKey, "entityType")}
              className={INPUT_BASE_CLASSES}
              value={partyData.entityType}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "entityType", e.target.value)
              }
            >
              {ENTITY_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Address</label>
            <input
              id={makePartyInputId(partyKey, "address")}
              type="text"
              required
              className={INPUT_BASE_CLASSES}
              value={partyData.address}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "address", e.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Primary Email</label>
            <input
              id={makePartyInputId(partyKey, "email")}
              type="email"
              required
              className={INPUT_BASE_CLASSES}
              value={partyData.email}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "email", e.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Primary Phone</label>
            <input
              id={makePartyInputId(partyKey, "phone")}
              type="tel"
              required
              className={INPUT_BASE_CLASSES}
              value={partyData.phone}
              onChange={(e) =>
                onPartyFieldChange(partyKey, "phone", e.target.value)
              }
            />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {renderPartySection(
        "buyer",
        formData?.type === "ACA Health"
          ? "ACA Insurance Agency Information"
          : "Buyer / Broker Information",
      )}
      {renderPartySection(
        "publisher",
        formData?.type === "ACA Health"
          ? "Agent Recruiter Information"
          : "Publisher Information",
      )}

      <section className={CARD_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>
          <ShieldCheck className="h-5 w-5 text-indigo-600" /> Campaign Core
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Vertical</label>
            <select
              className={INPUT_BASE_CLASSES}
              value={formData.vertical}
              onChange={(e) => onFieldChange("vertical", e.target.value)}
            >
              {VERTICALS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Type</label>
            <select
              className={INPUT_BASE_CLASSES}
              value={formData.type}
              onChange={(e) => onFieldChange("type", e.target.value)}
            >
              {CAMPAIGN_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>
              Payout ($ per billable event)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={INPUT_BASE_CLASSES}
              value={formData.payout}
              onChange={(e) => onFieldChange("payout", e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.brokerLiability}
              onChange={(e) =>
                onFieldChange("brokerLiability", e.target.checked)
              }
            />
            Broker accepts liability for call costs if end-user defaults on
            payment
          </label>
        </div>
      </section>

      {formData.type === "ACA Health" && (
        <section className={CARD_CLASSES}>
          <h2 className={SECTION_TITLE_CLASSES}>
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> ACA Health
            Campaign Details
          </h2>
          <div className="space-y-4">
            <div
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm"
              style={{ color: "#263149" }}
            >
              <p className="font-semibold">
                ACA Insurance Agency Recruitment Agreement:
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  Ã¢â‚¬Â¢ Recruiter hires two types of agents for the ACA Insurance
                  Agency
                </li>
                <li>
                  Ã¢â‚¬Â¢ NPN Override Agents: Provide NPN numbers for agency to
                  contract under
                </li>
                <li>
                  Ã¢â‚¬Â¢ Direct Sales Agents: Sell ACA health insurance policies
                  directly
                </li>
                <li>
                  Ã¢â‚¬Â¢ Agency provides inbound calls and transfers to recruited
                  agents
                </li>
                <li>
                  Ã¢â‚¬Â¢ All payments contingent on policy being issued and paid by
                  carrier
                </li>
                <li>Ã¢â‚¬Â¢ Residual payments made "as earned" each month</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>
                NPN Override Amount ($ per month per policy)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className={INPUT_BASE_CLASSES}
                value={formData.acaNpnOverride}
                onChange={(e) =>
                  onFieldChange("acaNpnOverride", e.target.value)
                }
                placeholder="Enter dollar amount (e.g., 25)"
              />
              <p className="text-xs text-slate-500">
                Monthly residual payment for each policy sold under recruited
                agent's NPN number
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>
                Per Policy Amount ($ per sale)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className={INPUT_BASE_CLASSES}
                value={formData.acaPerPolicy}
                onChange={(e) => onFieldChange("acaPerPolicy", e.target.value)}
                placeholder="Enter dollar amount (e.g., 20)"
              />
              <p className="text-xs text-slate-500">
                Weekly payment for each ACA policy sale made by recruited agents
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>
                Agent Bonus Amount ($ per month per policy)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className={INPUT_BASE_CLASSES}
                value={formData.acaAgentBonus}
                onChange={(e) => onFieldChange("acaAgentBonus", e.target.value)}
                placeholder="Enter dollar amount (e.g., 5)"
              />
              <p className="text-xs text-slate-500">
                Additional monthly residual payment for recruited agents who
                sell ACA policies
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>Billing Cycle</label>
              <select
                className={INPUT_BASE_CLASSES}
                value={formData.acaBillingCycle}
                onChange={(e) =>
                  onFieldChange("acaBillingCycle", e.target.value)
                }
              >
                {BILLING_CYCLES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>
                Chargeback Liability Period
              </label>
              <select
                className={INPUT_BASE_CLASSES}
                value={formData.acaChargebackLiability}
                onChange={(e) =>
                  onFieldChange("acaChargebackLiability", e.target.value)
                }
              >
                {CHARGEBACK_LIABILITY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Time period the recruiter is liable for policy
                chargebacks/lapses.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>
                Agreement Duration (months)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className={INPUT_BASE_CLASSES}
                value={formData.acaDuration}
                onChange={(e) =>
                  onFieldChange("acaDuration", e.target.value)
                }
                placeholder="12"
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={formData.brokerLiability}
                onChange={(e) =>
                  onFieldChange("brokerLiability", e.target.checked)
                }
              />
              Agency accepts liability for payment if carrier defaults
            </label>
          </div>
        </section>
      )}

      <section className={CARD_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>
          <FileText className="h-5 w-5 text-indigo-600" /> Billing &amp; Terms
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Billing Cycle</label>
            <select
              className={INPUT_BASE_CLASSES}
              value={formData.billingCycle}
              onChange={(e) => onFieldChange("billingCycle", e.target.value)}
            >
              {BILLING_CYCLES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          {formData.type === "CPL" && (
            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>Buffer Time (seconds)</label>
              <select
                className={INPUT_BASE_CLASSES}
                value={formData.bufferTime}
                onChange={(e) => onFieldChange("bufferTime", e.target.value)}
              >
                {BUFFER_TIMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.exportToSheets}
              onChange={(e) =>
                onFieldChange("exportToSheets", e.target.checked)
              }
            />
            Export captured leads to Google Sheets
          </label>
        </div>
      </section>

      <section className={CARD_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>
          <PenSquare className="h-5 w-5 text-indigo-600" /> Compliance &amp;
          Targeting
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASSES}>Requirements</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REQUIREMENTS_OPTIONS.map((option) => {
                const id = `req-${option}`;
                return (
                  <label
                    key={option}
                    htmlFor={id}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.requirements.includes(option)}
                      onChange={() => onToggleArray("requirements", option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className={LABEL_CLASSES}>Proof of Consent</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PROOF_OF_CONSENT_OPTIONS.map((option) => {
                const id = `proof-${option}`;
                return (
                  <label
                    key={option}
                    htmlFor={id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition focus-within:ring-2 ${
                      formData.proofOfConsent === option
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="proof"
                      className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.proofOfConsent === option}
                      onChange={() => onFieldChange("proofOfConsent", option)}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className={LABEL_CLASSES}>Datapass</span>
            <div className="grid grid-cols-2 gap-2">
              {["Yes", "No"].map((option) => {
                const id = `datapass-${option}`;
                return (
                  <label
                    key={option}
                    htmlFor={id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition focus-within:ring-2 ${
                      formData.datapass === option
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="datapass"
                      className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.datapass === option}
                      onChange={() => onFieldChange("datapass", option)}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {formData.datapass === "Yes" && (
        <section className={CARD_CLASSES}>
          <h2 className={SECTION_TITLE_CLASSES}>
            <Send className="h-5 w-5 text-indigo-600" /> Datapass API Specs
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>Platform</label>
              <select
                className={INPUT_BASE_CLASSES}
                value={formData.datapassPlatform}
                onChange={(e) =>
                  onFieldChange("datapassPlatform", e.target.value)
                }
              >
                {DATAPASS_PLATFORM_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            {formData.datapassPlatform === "Other" && (
              <div className="space-y-1.5">
                <label className={LABEL_CLASSES}>Custom Platform Name</label>
                <input
                  type="text"
                  className={INPUT_BASE_CLASSES}
                  value={formData.datapassOtherPlatform}
                  onChange={(e) =>
                    onFieldChange("datapassOtherPlatform", e.target.value)
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>POST URL</label>
              <input
                type="url"
                placeholder="https://"
                className={INPUT_BASE_CLASSES}
                value={formData.datapassPostUrl}
                onChange={(e) =>
                  onFieldChange("datapassPostUrl", e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASSES}>Required Fields</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DATAPASS_FIELDS.map((field) => {
                  const id = `field-${field}`;
                  return (
                    <label
                      key={field}
                      htmlFor={id}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.datapassFields.includes(field)}
                        onChange={() => onToggleArray("datapassFields", field)}
                      />
                      <span>{field}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="lg:col-span-2">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">
                Ready to generate the contract?
              </h3>
              <p className="text-sm text-indigo-800">
                The Gemini AI contract will automatically include overseas
                publisher fairness clauses and broker liability language based
                on your selections.
              </p>
            </div>
            <button
              type="button"
              onClick={onGenerate}
              disabled={
                generating ||
                saving ||
                (formData.contractType !==
                  "Auto Insurance LLC Operating Agreement" &&
                  formData.contractType !== "LLC Operating Agreement" &&
                  (!buyerComplete || !publisherComplete)) ||
                (formData.type === "ACA Health"
                  ? !formData.acaNpnOverride ||
                    !formData.acaPerPolicy ||
                    !formData.acaAgentBonus
                  : !formData.payout)
              }
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Contract"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const ContractView = ({
  contractText,
  setBuyerSignature,
  setPublisherSignature,
  setBuyerSignatureData,
  setPublisherSignatureData,
  onReset,
  onPrint,
  onDownloadPDF,
  buyerSignatureData,
  publisherSignatureData,
  signingLink,
  signingLinkCopied,
  setSigningLinkCopied,
}) => {
  const buyerPadRef = useRef(null);
  const publisherPadRef = useRef(null);

  const [buyerSigned, setBuyerSigned] = useState(false);
  const [publisherSigned, setPublisherSigned] = useState(false);
  const [buyerSignDate, setBuyerSignDate] = useState(null);
  const [publisherSignDate, setPublisherSignDate] = useState(null);
  const [buyerPrintedName, setBuyerPrintedName] = useState("");
  const [publisherPrintedName, setPublisherPrintedName] = useState("");

  const [zoomLevel, setZoomLevel] = useState(100);

  const bothSigned = buyerSigned && publisherSigned;

  // Build the contract HTML with signatures embedded
  const contractWithSignatures = useMemo(() => {
    if (!contractText) return "";
    let html = contractText;

    // Replace buyer signature placeholder
    if (buyerSignatureData && buyerSigned) {
      html = html.replace(
        /(<div style="border: 1px solid #000; height: 50px;[^"]*display: flex; align-items: center; justify-content: center;">)\s*(<div style="height: 40px;"><\/div>)\s*(<\/div>\s*<div style="font-size: 14px; font-weight: bold;">Buyer Signature)/s,
        `$1<img src="${buyerSignatureData}" style="max-height: 45px; max-width: 95%;" />$3`
      );
    }

    if (publisherSignatureData && publisherSigned) {
      html = html.replace(
        /(<div style="border: 1px solid #000; height: 50px;[^"]*display: flex; align-items: center; justify-content: center;">)\s*(<div style="height: 40px;"><\/div>)\s*(<\/div>\s*<div style="font-size: 14px; font-weight: bold;">Publisher Signature)/s,
        `$1<img src="${publisherSignatureData}" style="max-height: 45px; max-width: 95%;" />$3`
      );
    }

    // Replace date placeholders
    if (buyerSignDate) {
      html = html.replace(
        "Date: _______________",
        `Date: ${buyerSignDate}`
      );
    }

    if (publisherSignDate) {
      html = html.replace(
        "Date: _______________",
        `Date: ${publisherSignDate}`
      );
    }

    return html;
  }, [contractText, buyerSignatureData, publisherSignatureData, buyerSigned, publisherSigned, buyerSignDate, publisherSignDate]);

  const handleBuyerSign = () => {
    if (!buyerPadRef.current || buyerPadRef.current.isEmpty()) return;
    const dataUrl = buyerPadRef.current.toDataURL("image/png");
    setBuyerSignatureData(dataUrl);
    setBuyerSignature("signed");
    setBuyerSigned(true);
    setBuyerSignDate(new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    }));
  };

  const handlePublisherSign = () => {
    if (!publisherPadRef.current || publisherPadRef.current.isEmpty()) return;
    const dataUrl = publisherPadRef.current.toDataURL("image/png");
    setPublisherSignatureData(dataUrl);
    setPublisherSignature("signed");
    setPublisherSigned(true);
    setPublisherSignDate(new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    }));
  };

  const handleClearBuyer = () => {
    if (buyerSigned) return;
    buyerPadRef.current?.clear();
  };

  const handleClearPublisher = () => {
    if (publisherSigned) return;
    publisherPadRef.current?.clear();
  };

  // PDF download that includes signatures
  const handleSignedPDF = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = contractWithSignatures;
    tempDiv.className = "contract-body";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    document.body.appendChild(tempDiv);

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `signed-insertion-order-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    };

    html2pdf().set(opt).from(tempDiv).save().then(() => {
      document.body.removeChild(tempDiv);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {bothSigned ? "\u2713 Fully Executed Agreement" : "Agreement \u2014 Pending Signatures"}
          </h2>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Zoom:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs hover:bg-slate-50"
              >
                -
              </button>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
              <button
                type="button"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs hover:bg-slate-50"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FileText className="h-3 w-3" /> Print
            </button>
            <button
              type="button"
              onClick={bothSigned ? handleSignedPDF : onDownloadPDF}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FileText className="h-3 w-3" /> {bothSigned ? "Download Signed PDF" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Share for Signing Banner */}
      {signingLink && (
        <div className="flex-shrink-0 mx-2 mt-1">
          <div className="rounded-lg border px-4 py-2.5 flex items-center justify-between gap-3" style={{ borderColor: "#5BC894", backgroundColor: "#F0FAF5" }}>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 flex-shrink-0" style={{ color: "#143B5E" }} />
              <div>
                <span className="text-xs font-bold" style={{ color: "#143B5E" }}>Share for E-Signature</span>
                <p className="text-[10px] text-slate-500">Send this link to each party so they can sign electronically</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={signingLink}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 w-64"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(signingLink);
                  setSigningLinkCopied(true);
                  setTimeout(() => setSigningLinkCopied(false), 3000);
                }}
                className="rounded-lg px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap transition-all"
                style={{ backgroundColor: signingLinkCopied ? "#2EAC6D" : "#143B5E" }}
              >
                {signingLinkCopied ? "âœ“ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Content */}
      <div className="flex-1 flex flex-col min-h-0 mx-2 mt-1">
        <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-lg flex flex-col">
          <div
            className="contract-body overflow-y-scroll p-3"
            style={{
              height: "calc(100vh - 380px)",
              maxHeight: "calc(100vh - 380px)",
            }}
          >
            <div
              className="prose prose-slate max-w-none text-xs leading-relaxed"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
                width: `${100 / (zoomLevel / 100)}%`,
              }}
              dangerouslySetInnerHTML={{ __html: contractWithSignatures }}
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex-shrink-0 mx-2 mt-2 mb-1">
        <div className="rounded-lg border-2 bg-white shadow-lg p-4" style={{ borderColor: bothSigned ? "#2EAC6D" : "#5BC894" }}>
          {/* Status Banner */}
          <div
            className="rounded-lg px-4 py-2 mb-3 text-center text-sm font-bold"
            style={{
              backgroundColor: bothSigned ? "#f0fdf4" : "#F0FAF5",
              color: bothSigned ? "#166534" : "#143B5E",
              border: `1px solid ${bothSigned ? "#bbf7d0" : "#5BC894"}`,
            }}
          >
            {!buyerSigned && !publisherSigned && "Both parties must sign below to execute this agreement"}
            {buyerSigned && !publisherSigned && "\u2713 Buyer has signed \u2014 Awaiting Publisher signature"}
            {!buyerSigned && publisherSigned && "\u2713 Publisher has signed \u2014 Awaiting Buyer signature"}
            {bothSigned && "\u2705 Agreement fully executed by both parties \u2014 Ready for download"}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* BUYER SIGNATURE */}
            <div className={`rounded-lg border-2 p-3 ${buyerSigned ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: "#143B5E" }}>
                  Buyer / Agency Signature
                </span>
                {buyerSigned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                )}
              </div>

              {buyerSigned ? (
                <div className="space-y-2">
                  <div className="h-20 rounded border border-green-300 bg-white flex items-center justify-center">
                    {buyerSignatureData && (
                      <img src={buyerSignatureData} alt="Buyer Signature" style={{ maxHeight: "70px", maxWidth: "90%" }} />
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Printed Name:</strong> {buyerPrintedName || "\u2014"}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Date Signed:</strong> {buyerSignDate}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded border-2 border-dashed border-slate-300 bg-white" style={{ height: "80px" }}>
                    <SignatureCanvas
                      ref={buyerPadRef}
                      penColor="#000000"
                      canvasProps={{
                        className: "w-full h-full",
                        style: { width: "100%", height: "80px", borderRadius: "4px" },
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Type full legal name"
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                    value={buyerPrintedName}
                    onChange={(e) => setBuyerPrintedName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleBuyerSign}
                      disabled={!buyerPrintedName.trim()}
                      className="flex-1 rounded py-2 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#143B5E" }}
                    >
                      Submit Buyer Signature
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBuyer}
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Draw your signature above, type your legal name, then click Submit.
                  </p>
                </div>
              )}
            </div>

            {/* PUBLISHER SIGNATURE */}
            <div className={`rounded-lg border-2 p-3 ${publisherSigned ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: "#143B5E" }}>
                  Publisher / Recruiter Signature
                </span>
                {publisherSigned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                )}
              </div>

              {publisherSigned ? (
                <div className="space-y-2">
                  <div className="h-20 rounded border border-green-300 bg-white flex items-center justify-center">
                    {publisherSignatureData && (
                      <img src={publisherSignatureData} alt="Publisher Signature" style={{ maxHeight: "70px", maxWidth: "90%" }} />
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Printed Name:</strong> {publisherPrintedName || "\u2014"}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Date Signed:</strong> {publisherSignDate}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded border-2 border-dashed border-slate-300 bg-white" style={{ height: "80px" }}>
                    <SignatureCanvas
                      ref={publisherPadRef}
                      penColor="#000000"
                      canvasProps={{
                        className: "w-full h-full",
                        style: { width: "100%", height: "80px", borderRadius: "4px" },
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Type full legal name"
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                    value={publisherPrintedName}
                    onChange={(e) => setPublisherPrintedName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePublisherSign}
                      disabled={!publisherPrintedName.trim()}
                      className="flex-1 rounded py-2 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#143B5E" }}
                    >
                      Submit Publisher Signature
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPublisher}
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Draw your signature above, type your legal name, then click Submit.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Download Buttons when fully signed */}
          {bothSigned && (
            <div className="mt-3 flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleSignedPDF}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg"
                style={{ backgroundColor: "#2EAC6D" }}
              >
                <FileText className="h-4 w-4" />
                Download Fully Signed PDF
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-lg border-2 px-6 py-2.5 text-sm font-bold shadow-lg"
                style={{ borderColor: "#143B5E", color: "#143B5E" }}
              >
                Print Signed Agreement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow"
          style={{ backgroundColor: "#143B5E" }}
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO EDITOR
        </button>
        <div className="text-xs text-slate-500">
          {bothSigned
            ? "Agreement fully executed"
            : `${(buyerSigned ? 1 : 0) + (publisherSigned ? 1 : 0)} of 2 signatures collected`}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow"
          style={{ backgroundColor: "#143B5E" }}
        >
          START NEW CONTRACT
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
// ContractSigningPage â€” Standalone signing view for shareable links
// Loads contract from Firestore, displays it, and allows each party to sign independently
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
const ContractSigningPage = ({ contractId, db }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [signingAs, setSigningAs] = useState(null); // "buyer" | "publisher" | null
  const [printedName, setPrintedName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const sigPadRef = useRef(null);

  // Parse userId:docId from contractId
  const [userId, docId] = contractId.includes(":")
    ? contractId.split(":")
    : [null, null];

  // Load contract from Firestore
  useEffect(() => {
    if (!db || !userId || !docId) {
      setError("Invalid signing link format.");
      setLoading(false);
      return;
    }
    const loadContract = async () => {
      try {
        setLoading(true);
        const docSnap = await getDoc(doc(db, "users", userId, "insertionOrders", docId));
        if (!docSnap.exists()) {
          setError("Contract not found. The link may be invalid or expired.");
          return;
        }
        const data = docSnap.data();
        if (!data.signingData) {
          setError("This contract does not have signing data.");
          return;
        }
        // Flatten signingData into a convenient shape for the component
        setContractData({
          ...data.signingData,
          formData: data.form,
        });
      } catch (err) {
        setError(err.message || "Failed to load contract.");
      } finally {
        setLoading(false);
      }
    };
    loadContract();
  }, [db, userId, docId]);

  // Determine which party needs to sign
  useEffect(() => {
    if (!contractData) return;
    if (!contractData.buyerSignature && !contractData.publisherSignature) {
      setSigningAs("buyer");
    } else if (contractData.buyerSignature && !contractData.publisherSignature) {
      setSigningAs("publisher");
    } else if (!contractData.buyerSignature && contractData.publisherSignature) {
      setSigningAs("buyer");
    } else {
      setSigningAs(null); // fully signed
    }
  }, [contractData]);

  // Build contract HTML with any existing signatures
  const contractHtmlWithSigs = useMemo(() => {
    if (!contractData?.contractHtml) return "";
    let html = contractData.contractHtml;

    // Inject buyer signature if present
    if (contractData.buyerSignature?.data) {
      html = html.replace(
        /(<div style="border: 1px solid #000; height: 50px;[^"]*display: flex; align-items: center; justify-content: center;">\s*)(<div style="height: 40px;"><\/div>\s*)(<\/div>\s*<div style="font-size: 14px; font-weight: bold;">Buyer Signature)/s,
        `$1<img src="${contractData.buyerSignature.data}" style="max-height: 45px; max-width: 95%;" />$3`
      );
      // Replace first date placeholder
      if (contractData.buyerSignature.signedAt) {
        const buyerDate = contractData.buyerSignature.signedAt?.toDate
          ? contractData.buyerSignature.signedAt.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : new Date(contractData.buyerSignature.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        html = html.replace(
          "Date: _______________",
          `Date: ${buyerDate}`
        );
      }
    }

    // Inject publisher signature if present
    if (contractData.publisherSignature?.data) {
      html = html.replace(
        /(<div style="border: 1px solid #000; height: 50px;[^"]*display: flex; align-items: center; justify-content: center;">\s*)(<div style="height: 40px;"><\/div>\s*)(<\/div>\s*<div style="font-size: 14px; font-weight: bold;">Publisher Signature)/s,
        `$1<img src="${contractData.publisherSignature.data}" style="max-height: 45px; max-width: 95%;" />$3`
      );
      if (contractData.publisherSignature.signedAt) {
        const pubDate = contractData.publisherSignature.signedAt?.toDate
          ? contractData.publisherSignature.signedAt.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : new Date(contractData.publisherSignature.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        html = html.replace(
          "Date: _______________",
          `Date: ${pubDate}`
        );
      }
    }

    return html;
  }, [contractData]);

  const handleSign = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setError("Please draw your signature before submitting.");
      return;
    }
    if (!printedName.trim()) {
      setError("Please type your full legal name.");
      return;
    }

    setError(null);
    setSigning(true);

    try {
      const signatureData = sigPadRef.current.toDataURL("image/png");
      const signedAt = new Date().toISOString();

      const sigObj = {
        data: signatureData,
        mode: "drawn",
        signedAt,
        signerName: printedName.trim(),
      };

      const buyerAlreadySigned = !!contractData.buyerSignature;
      const publisherAlreadySigned = !!contractData.publisherSignature;

      let newStatus;
      if (signingAs === "buyer") {
        newStatus = publisherAlreadySigned ? "fully_signed" : "awaiting_publisher";
      } else {
        newStatus = buyerAlreadySigned ? "fully_signed" : "awaiting_buyer";
      }

      await updateDoc(doc(db, "users", userId, "insertionOrders", docId), {
        [`signingData.${signingAs}Signature`]: sigObj,
        ["signingData.status"]: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setContractData(prev => ({
        ...prev,
        [`${signingAs}Signature`]: { ...sigObj, signedAt },
        status: newStatus,
      }));

      setSigned(true);
    } catch (err) {
      setError(err.message || "Failed to save signature.");
    } finally {
      setSigning(false);
    }
  };

  const handleClearPad = () => {
    sigPadRef.current?.clear();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?sign=${contractId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    });
  };

  const handleDownloadPDF = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = contractHtmlWithSigs;
    tempDiv.className = "contract-body";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    document.body.appendChild(tempDiv);

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `signed-agreement-${contractId.slice(0, 8)}-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(tempDiv).save().then(() => {
      document.body.removeChild(tempDiv);
    });
  };

  const handleGoHome = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  const isFullySigned = contractData?.status === "fully_signed" ||
    (contractData?.buyerSignature && contractData?.publisherSignature);

  const buyerLabel = contractData?.partyLabels?.buyer || "Buyer";
  const publisherLabel = contractData?.partyLabels?.publisher || "Publisher";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #143B5E 50%, #0f172a 100%)" }}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto" style={{ width: "80px", height: "80px" }}>
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white">Loading Agreement</h2>
          <p className="text-sm text-slate-400">Retrieving contract for signing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !contractData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #143B5E 50%, #0f172a 100%)" }}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unable to Load Agreement</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "#143B5E" }}
          >
            <ArrowLeft className="h-4 w-4" /> Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      {/* Top Header Bar */}
      <header className="flex-shrink-0 border-b shadow-sm" style={{ backgroundColor: "#143B5E" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pvnvoice.png" alt="PVNVoice" style={{ height: "28px" }} />
            <div>
              <h1 className="text-base font-bold text-white">PVNVoice Legal</h1>
              <p className="text-xs text-slate-300">Secure Electronic Signature</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: isFullySigned ? "#dcfce7" : "#fef3c7",
                color: isFullySigned ? "#166534" : "#92400e",
              }}
            >
              {isFullySigned ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Fully Executed</>
              ) : contractData?.buyerSignature ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Awaiting {publisherLabel}</>
              ) : contractData?.publisherSignature ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Awaiting {buyerLabel}</>
              ) : (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Awaiting Signatures</>
              )}
            </span>
            <button
              onClick={handleGoHome}
              className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 hover:text-white transition"
            >
              <ArrowLeft className="h-3 w-3 inline mr-1" /> Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-4">
        {/* Contract Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">Agreement Preview</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Zoom:</span>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              >
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
              </select>
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div
              className="contract-body overflow-y-auto p-4"
              style={{ height: "calc(100vh - 200px)" }}
            >
              <div
                className="prose prose-slate max-w-none text-xs leading-relaxed"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top left",
                  width: `${100 / (zoomLevel / 100)}%`,
                }}
                dangerouslySetInnerHTML={{ __html: contractHtmlWithSigs }}
              />
            </div>
          </div>
        </div>

        {/* Signature Panel */}
        <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
          {/* Signing Progress */}
          <div className="rounded-xl border-2 bg-white p-5 shadow-lg" style={{ borderColor: isFullySigned ? "#2EAC6D" : "#5BC894" }}>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: "#2EAC6D" }} />
              Signature Status
            </h3>

            {/* Buyer Status */}
            <div className={`rounded-lg p-3 mb-2 border ${contractData?.buyerSignature ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{buyerLabel}</span>
                {contractData?.buyerSignature ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Pending</span>
                )}
              </div>
              {contractData?.buyerSignature && (
                <div className="mt-2 space-y-1">
                  <div className="h-12 rounded border border-green-200 bg-white flex items-center justify-center">
                    <img src={contractData.buyerSignature.data} alt="Buyer Signature" style={{ maxHeight: "40px", maxWidth: "90%" }} />
                  </div>
                  <p className="text-[10px] text-slate-500"><strong>Name:</strong> {contractData.buyerSignature.signerName}</p>
                  <p className="text-[10px] text-slate-500">
                    <strong>Date:</strong> {
                      contractData.buyerSignature.signedAt?.toDate
                        ? contractData.buyerSignature.signedAt.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : new Date(contractData.buyerSignature.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Publisher Status */}
            <div className={`rounded-lg p-3 border ${contractData?.publisherSignature ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{publisherLabel}</span>
                {contractData?.publisherSignature ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Pending</span>
                )}
              </div>
              {contractData?.publisherSignature && (
                <div className="mt-2 space-y-1">
                  <div className="h-12 rounded border border-green-200 bg-white flex items-center justify-center">
                    <img src={contractData.publisherSignature.data} alt="Publisher Signature" style={{ maxHeight: "40px", maxWidth: "90%" }} />
                  </div>
                  <p className="text-[10px] text-slate-500"><strong>Name:</strong> {contractData.publisherSignature.signerName}</p>
                  <p className="text-[10px] text-slate-500">
                    <strong>Date:</strong> {
                      contractData.publisherSignature.signedAt?.toDate
                        ? contractData.publisherSignature.signedAt.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : new Date(contractData.publisherSignature.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Signing Pad â€” only shown if there's still a party that needs to sign */}
          {signingAs && !signed && (
            <div className="rounded-xl border-2 border-blue-300 bg-white p-5 shadow-lg">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <PenSquare className="h-4 w-4" style={{ color: "#143B5E" }} />
                Sign as {signingAs === "buyer" ? buyerLabel : publisherLabel}
              </h3>
              <p className="text-[10px] text-slate-500 mb-3">
                Draw your signature below, type your legal name, and click Submit to execute.
              </p>

              {error && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* Signature Canvas */}
              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 mb-3" style={{ height: "120px" }}>
                <SignatureCanvas
                  ref={sigPadRef}
                  penColor="#000000"
                  canvasProps={{
                    className: "w-full h-full",
                    style: { width: "100%", height: "120px", borderRadius: "8px", background: "#fff" },
                  }}
                />
              </div>

              {/* Printed Name */}
              <input
                type="text"
                placeholder="Type your full legal name"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={printedName}
                onChange={(e) => setPrintedName(e.target.value)}
              />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSign}
                  disabled={signing || !printedName.trim()}
                  className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: "#2EAC6D" }}
                >
                  {signing ? (
                    <><Loader2 className="h-4 w-4 inline animate-spin mr-1" /> Signing...</>
                  ) : (
                    <><PenSquare className="h-4 w-4 inline mr-1" /> Submit Signature</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClearPad}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Post-signing success message */}
          {signed && !isFullySigned && (
            <div className="rounded-xl border-2 border-green-400 bg-green-50 p-5 shadow-lg text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-sm font-bold text-green-800">Signature Submitted!</h3>
              <p className="text-xs text-green-700">
                Share this link with the other party to complete the signing:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?sign=${contractId}`}
                  className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs text-slate-700"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white"
                  style={{ backgroundColor: "#143B5E" }}
                >
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Share Link â€” shown right after initial load when buyer has signed */}
          {!signed && contractData?.buyerSignature && !contractData?.publisherSignature && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Send className="h-3 w-3" /> Share Signing Link
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?sign=${contractId}`}
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-white transition"
                  style={{ backgroundColor: "#143B5E" }}
                >
                  {linkCopied ? "âœ“ Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          )}

          {/* Download Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Download
            </h4>
            <button
              onClick={handleDownloadPDF}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-all shadow"
              style={{ backgroundColor: isFullySigned ? "#2EAC6D" : "#143B5E" }}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              {isFullySigned ? "Download Fully Signed PDF" : "Download Current PDF"}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              {isFullySigned
                ? "This PDF contains all signatures and is the final executed agreement."
                : "Current PDF will show only signatures collected so far."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-slate-200 bg-white py-3">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Powered by PVNVoice Legal &bull; Secure Electronic Signing
          </p>
          <p className="text-xs text-slate-400">
            Contract ID: {contractId.slice(0, 12)}...
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InsertionOrderGenerator;

