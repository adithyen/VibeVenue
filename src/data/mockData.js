// ============================================================
//  CAMPUSCORE — AUTHENTIC COLLEGIATE EVENT DATASET
//  Rich Technical Symposium, Hackathons & Operations Data
// ============================================================

// ---------- Event Categories ----------
export const CATEGORIES = [
  { id: 'all',          label: 'All Domains',   color: '#6366F1', icon: '✦' },
  { id: 'ai-ml',        label: 'AI & Intelligence', color: '#8B5CF6', icon: '🤖' },
  { id: 'web-dev',      label: 'Web & Cloud',      color: '#6366F1', icon: '🌐' },
  { id: 'cybersecurity',label: 'Cyber & CTF',      color: '#F43F5E', icon: '🛡️' },
  { id: 'robotics',     label: 'Robotics & IoT',   color: '#F59E0B', icon: '🦾' },
  { id: 'hackathon',    label: 'Hackathons',       color: '#10B981', icon: '⚡' },
  { id: 'design',       label: 'Design & UI/UX',   color: '#06B6D4', icon: '🎨' },
  { id: 'workshop',     label: 'Hands-on Labs',    color: '#EC4899', icon: '🔧' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[1];

// ---------- Faculty & Student Organizers ----------
export const ORGANIZERS = [
  {
    id: 'org-1',
    name: 'Dr. Priya Sharma',
    role: 'Faculty Convener & HOD',
    department: 'Computer Science & Engineering',
    email: 'p.sharma@campus.edu',
    phone: '+91 98401 23456',
    office: 'Block A, Faculty Wing 302',
    initials: 'PS',
  },
  {
    id: 'org-2',
    name: 'Prof. Arjun Mehta',
    role: 'IEEE Branch Counselor',
    department: 'Electronics & Communication',
    email: 'arjun.mehta@campus.edu',
    phone: '+91 97890 34567',
    office: 'Block B, VLSI Center 104',
    initials: 'AM',
  },
  {
    id: 'org-3',
    name: 'Dr. Rahul Verma',
    role: 'AI Research Lab Lead',
    department: 'Artificial Intelligence & Data Science',
    email: 'rahul.verma@campus.edu',
    phone: '+91 94451 89012',
    office: 'Block E, Turing Center 401',
    initials: 'RV',
  },
  {
    id: 'org-4',
    name: 'Ms. Kavitha Nair',
    role: 'CSI Student Branch Advisor',
    department: 'Information Technology',
    email: 'kavitha.n@campus.edu',
    phone: '+91 98840 56789',
    office: 'Block C, Cyber Lab 201',
    initials: 'KN',
  },
  {
    id: 'org-5',
    name: 'Siddharth Iyer',
    role: 'Lead Student Coordinator',
    department: 'Computer Science & Engineering',
    email: 'siddharth.iyer@student.campus.edu',
    phone: '+91 90031 45678',
    office: 'Student Council Room',
    initials: 'SI',
  },
];

// ---------- Campus Student Participant Generator ----------
const FIRST_NAMES = [
  'Aarav','Aditya','Akash','Ananya','Anjali','Arjun','Aryan','Deepika','Dhruv','Divya',
  'Gaurav','Harini','Ishaan','Kavya','Kiran','Lakshmi','Manav','Meera','Mihir','Nandita',
  'Nikhil','Pooja','Pranav','Priya','Rahul','Riya','Rohit','Sanjay','Shruti','Siddharth',
  'Sneha','Suresh','Tanvi','Uday','Vaishnavi','Vijay','Yash','Zara','Amruta','Bhavesh',
  'Karthik','Keerthi','Rohan','Samhita','Varun','Swathi','Tejas','Ritika','Manoj','Abhishek'
];

const LAST_NAMES = [
  'Sharma','Patel','Nair','Mehta','Iyer','Reddy','Kumar','Singh','Joshi','Gupta',
  'Verma','Mishra','Rao','Pillai','Bhat','Desai','Jain','Shah','Tiwari','Pandey',
  'Chauhan','Srivastava','Dubey','Kapoor','Malhotra','Agarwal','Chopra','Arora','Bansal','Saxena'
];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Data Science',
  'Information Technology',
  'Electronics & Communication',
  'Cybersecurity & Forensics',
  'Robotics & Automation',
  'Design Engineering',
  'Mechanical Engineering'
];

const STATUS_POOL = ['confirmed', 'confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'];

let participantCounter = 1000;

export const generateParticipant = (eventId, overrides = {}) => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const yearNum = Math.floor(Math.random() * 4) + 1;
  const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
  const status = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
  const rollYear = 2026 - yearNum;
  const roll = `${dept.split(' ')[0].toUpperCase()}${String(rollYear).slice(2)}${String(Math.floor(Math.random() * 900) + 100)}`;
  const ticketId = `TCK-${Math.floor(Math.random() * 899999 + 100000)}`;
  const regTimestamp = new Date(Date.now() - Math.random() * 24 * 24 * 60 * 60 * 1000);

  return {
    id: `reg-${eventId}-${participantCounter++}`,
    ticketId,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 89 + 10)}@student.campus.edu`,
    phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
    studentId: roll,
    department: dept,
    year: `${yearNum}${['st','nd','rd','th'][yearNum - 1]} Year B.Tech`,
    status,
    checkInStatus: status === 'confirmed' && Math.random() > 0.4 ? 'Checked In' : 'Not Checked In',
    registeredAt: regTimestamp.toISOString(),
    eventId,
    initials: `${firstName[0]}${lastName[0]}`,
    ...overrides,
  };
};

// ---------- Live Telemetry Trend Data ----------
export const generateRegistrationTrend = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const baseline = 24 + Math.floor(Math.sin(i / 3) * 12) + Math.floor(Math.random() * 15);
    data.push({
      date: label,
      registrations: Math.max(8, baseline + (i < 5 ? 18 : 0)),
      checkins: Math.floor(Math.max(4, (baseline * 0.75))),
    });
  }
  return data;
};

// ---------- Raw Events List ----------
const RAW_EVENTS = [
  {
    id: 'evt-001',
    name: 'Nexus AI Summit 2026',
    description: 'The premier annual intelligence symposium exploring Frontier Large Language Models, Multi-agent autonomous architectures, Edge AI, and Quantum ML. Features distinguished keynote addresses, deep-dive architectural workshops, and industry research demos.',
    shortDescription: 'Flagship annual intelligence symposium with keynotes, multi-agent panels, and research tracks.',
    category: 'ai-ml',
    date: '2026-09-15',
    time: '09:00 AM',
    endTime: '05:30 PM',
    venue: 'APJ Abdul Kalam Auditorium, Block A',
    organizerId: 'org-1',
    maxParticipants: 500,
    status: 'upcoming',
    fee: 'Free (ID Required)',
    tags: ['ai','llm','multi-agent','quantum-ml','keynote'],
    schedule: [
      { time: '09:00 AM', title: 'Delegate Check-in & Breakfast Networking', speaker: 'Student Host Team', room: 'Main Concourse', duration: '45 min' },
      { time: '09:45 AM', title: 'Inaugural Address: Frontiers of Autonomous Systems', speaker: 'Dr. Priya Sharma', room: 'Main Auditorium', duration: '60 min' },
      { time: '11:00 AM', title: 'Panel: Scalable AI Infrastructure in Production', speaker: 'Visiting Tech Leads', room: 'Main Auditorium', duration: '50 min' },
      { time: '12:00 PM', title: 'Deep-Dive: Fine-Tuning SLMs on Edge Silicon', speaker: 'Dr. Rahul Verma', room: 'Turing Computing Lab 1', duration: '90 min' },
      { time: '01:30 PM', title: 'Networking Luncheon & Poster Presentations', speaker: null, room: 'Faculty Dining Annex', duration: '60 min' },
      { time: '02:30 PM', title: 'Live Demonstration: Robotic Vision & Reinforcement Learning', speaker: 'Research Scholars', room: 'Robotics Arena', duration: '75 min' },
      { time: '04:00 PM', title: 'Q&A, Project Awards & Valedictory Session', speaker: 'Deans Council', room: 'Main Auditorium', duration: '60 min' },
    ],
  },
  {
    id: 'evt-002',
    name: 'CodeCraft 36h Hackathon',
    description: '36-hour non-stop hackathon challenging student engineers to build high-impact production solutions. Tracks include Decentralized Systems, Healthcare Tech, Green Energy AI, and Public Infrastructure. Over ₹2,00,000 in bounties.',
    shortDescription: '36-hour marathon building production-grade software for national grand challenges.',
    category: 'hackathon',
    date: '2026-09-22',
    time: '08:30 AM',
    endTime: '09:00 PM (+1d)',
    venue: 'Innovation & Incubation Center, Block C',
    organizerId: 'org-5',
    maxParticipants: 220,
    status: 'upcoming',
    fee: '₹250 / Team',
    tags: ['hackathon','36hours','bounties','fullstack','ai'],
    schedule: [
      { time: '08:30 AM', title: 'Team Check-in & Hardware Kit Issuance', speaker: 'Organizing Comm.', room: 'Innovation Lobby', duration: '45 min' },
      { time: '09:30 AM', title: 'Problem Statements Release & API Keys Reveal', speaker: 'Sponsor Leads', room: 'Main Arena', duration: '45 min' },
      { time: '10:30 AM', title: 'Hacking Commences (T-36:00:00)', speaker: null, room: 'Co-working Pods', duration: '36 hrs' },
      { time: '06:00 PM', title: 'Mentor Checkpoint 1 & Architecture Audit', speaker: 'Industry Mentors', room: 'Huddle Rooms', duration: '120 min' },
      { time: '08:00 PM (+1d)', title: 'Code Freeze & Final GitHub Pull Request Submissions', speaker: null, room: 'Online Portal', duration: '30 min' },
      { time: '09:00 PM (+1d)', title: 'Top 10 Live Pitch & Grand Award Ceremony', speaker: 'Jury Panel', room: 'Innovation Arena', duration: '90 min' },
    ],
  },
  {
    id: 'evt-003',
    name: 'CyberShield Red vs Blue CTF',
    description: 'Capture The Flag cybersecurity combat featuring real-world jeopardy and attack-defense scenarios. Covers zero-day web vulnerabilities, reverse engineering, binary exploitation, network forensics, and cryptography.',
    shortDescription: 'National-level jeopardy & attack-defense cybersecurity championship.',
    category: 'cybersecurity',
    date: '2026-09-28',
    time: '10:00 AM',
    endTime: '06:00 PM',
    venue: 'Cyber Range & Security Operations Lab, Block B',
    organizerId: 'org-4',
    maxParticipants: 160,
    status: 'upcoming',
    fee: 'Free',
    tags: ['ctf','infosec','pwn','crypto','forensics'],
    schedule: [
      { time: '10:00 AM', title: 'Briefing & VPN Token Distribution', speaker: 'CSI Core Team', room: 'Cyber Lab', duration: '30 min' },
      { time: '10:30 AM', title: 'Scoreboard Live: Jeopardy Challenges Released', speaker: null, room: 'Cyber Range', duration: '5 hrs' },
      { time: '03:30 PM', title: 'Attack-Defense Live Round', speaker: null, room: 'Range Matrix', duration: '90 min' },
      { time: '05:00 PM', title: 'Scoreboard Freeze & Challenge Write-up Review', speaker: 'Admin Jury', room: 'Auditorium B', duration: '45 min' },
      { time: '05:45 PM', title: 'Certificates & Shield Presentation', speaker: 'Faculty Advisor', room: 'Auditorium B', duration: '30 min' },
    ],
  },
  {
    id: 'evt-004',
    name: 'RoboWars Combat Championship',
    description: 'Spectacular combat robotics tournament in a reinforced steel hazard arena. High-RPM spinners, pneumatic flippers, and autonomous tactical wedge robots compete in 15kg and 8kg weight categories.',
    shortDescription: 'Heavyweight combat robotics championship with custom steel battle arena.',
    category: 'robotics',
    date: '2026-10-04',
    time: '09:30 AM',
    endTime: '06:30 PM',
    venue: 'Open Mechanical Quadrangle & Steel Arena',
    organizerId: 'org-2',
    maxParticipants: 90,
    status: 'upcoming',
    fee: '₹400 / Bot',
    tags: ['robotics','combat','hardware','motors','championship'],
    schedule: [
      { time: '09:30 AM', title: 'Safety Inspection, Weigh-in & Failsafe Test', speaker: 'Safety Marshals', room: 'Pit Bay', duration: '60 min' },
      { time: '10:45 AM', title: '8kg Lightweight Preliminary Elimination Heats', speaker: null, room: 'Steel Arena', duration: '120 min' },
      { time: '01:00 PM', title: 'Lunch & Pit Repair Window', speaker: null, room: 'Pit Workshop', duration: '60 min' },
      { time: '02:00 PM', title: '15kg Heavyweight Knockout Rounds', speaker: null, room: 'Steel Arena', duration: '150 min' },
      { time: '04:45 PM', title: 'Grand Championship Finals & Destruction Derby', speaker: null, room: 'Steel Arena', duration: '75 min' },
    ],
  },
  {
    id: 'evt-005',
    name: 'DesignPulse: Product & UI/UX Jam',
    description: 'Sprint-based product design competition focused on solving complex workflow problems. Learn high-fidelity prototyping in Figma, design system token architecture, motion micro-interactions, and accessibility standards.',
    shortDescription: 'High-craft design sprint solving complex UX workflows in Figma.',
    category: 'design',
    date: '2026-10-11',
    time: '09:00 AM',
    endTime: '04:30 PM',
    venue: 'Design Studio 204, Block D',
    organizerId: 'org-1',
    maxParticipants: 60,
    status: 'upcoming',
    fee: 'Free',
    tags: ['ui-ux','figma','design-systems','prototyping'],
    schedule: [
      { time: '09:00 AM', title: 'Masterclass: 2026 Interface Craft & Micro-interactions', speaker: 'Guest Product Designer', room: 'Studio 204', duration: '60 min' },
      { time: '10:15 AM', title: 'Design Prompt Release: Complex Enterprise Workflows', speaker: 'Jury', room: 'Studio 204', duration: '15 min' },
      { time: '10:30 AM', title: 'Wireframing, Component Architecture & Prototyping', speaker: null, room: 'Design Pods', duration: '210 min' },
      { time: '02:30 PM', title: 'Critique & Design System Reviews', speaker: 'Senior Designers', room: 'Studio 204', duration: '90 min' },
    ],
  },
  {
    id: 'evt-006',
    name: 'CloudMatrix: Kubernetes & Distributed Systems',
    description: 'Architecting resilient, distributed backend microservices on Kubernetes, Terraform, Prometheus, and AWS. Includes hands-on chaos engineering simulations and zero-downtime rolling deploys.',
    shortDescription: 'Production Kubernetes masterclass: Chaos engineering, GitOps, and microservices.',
    category: 'web-dev',
    date: '2026-10-18',
    time: '10:00 AM',
    endTime: '04:00 PM',
    venue: 'Computer Science Lab 4, Block A',
    organizerId: 'org-1',
    maxParticipants: 45,
    status: 'upcoming',
    fee: 'Free',
    tags: ['k8s','devops','aws','docker','distributed-systems'],
    schedule: [
      { time: '10:00 AM', title: 'Container Internals & K8s Control Plane Architecture', speaker: 'Dr. Priya Sharma', room: 'Lab 4', duration: '90 min' },
      { time: '11:45 AM', title: 'Hands-on: Helm Charts & GitOps CI/CD Pipelines', speaker: 'TA Team', room: 'Lab 4', duration: '75 min' },
      { time: '01:00 PM', title: 'Lunch Break', speaker: null, room: 'Cafeteria', duration: '45 min' },
      { time: '01:45 PM', title: 'Chaos Engineering: Simulating Network Partitions & Pod Kills', speaker: 'Dr. Priya Sharma', room: 'Lab 4', duration: '90 min' },
    ],
  },
  {
    id: 'evt-007',
    name: 'AlgoRush: Competitive Coding Cup',
    description: 'ACM-ICPC format algorithms tournament. Complex graph theory, dynamic programming, combinatorics, and geometry puzzles under strict time limits. Individual and team tracks with live projected telemetry.',
    shortDescription: 'ACM-ICPC format algorithmic sprint with live leaderboard telemetry.',
    category: 'hackathon',
    date: '2026-10-25',
    time: '09:00 AM',
    endTime: '02:00 PM',
    venue: 'Aryabhatta Computing Center, Block A',
    organizerId: 'org-3',
    maxParticipants: 120,
    status: 'upcoming',
    fee: 'Free',
    tags: ['algorithms','competitive-programming','data-structures','icpc'],
    schedule: [],
  },
  {
    id: 'evt-008',
    name: 'Hardware Hack: Embedded Rust & RISC-V',
    description: 'Bare-metal firmware development on RISC-V microcontrollers using modern Embedded Rust. Memory safety without garbage collection, real-time interrupt handling, and custom hardware peripheral drivers.',
    shortDescription: 'Bare-metal embedded firmware engineering on RISC-V with Rust.',
    category: 'workshop',
    date: '2026-11-02',
    time: '10:00 AM',
    endTime: '05:00 PM',
    venue: 'Embedded Systems Research Lab, Block B',
    organizerId: 'org-2',
    maxParticipants: 35,
    status: 'upcoming',
    fee: '₹150 (Hardware Provided)',
    tags: ['rust','riscv','embedded','firmware','iot'],
    schedule: [],
  },
  {
    id: 'evt-009',
    name: 'TechFest Grand Inauguration 2026',
    description: 'The monumental opening ceremony of the annual inter-college symposium. Unveiling of the 2026 championship trophy, tech exhibition demo zones, keynote addresses by industry leaders, and live orchestra.',
    shortDescription: 'Grand campus opening gala, championship unveiling, and tech exhibition.',
    category: 'cultural',
    date: '2026-11-10',
    time: '05:00 PM',
    endTime: '08:30 PM',
    venue: 'Open Air Amphitheatre & Central Plaza',
    organizerId: 'org-5',
    maxParticipants: 1200,
    status: 'upcoming',
    fee: 'Open to All',
    tags: ['inauguration','symposium','keynote','cultural'],
    schedule: [],
  },
  {
    id: 'evt-010',
    name: 'Web3 Protocol Architecture Sprint',
    description: 'Decentralized protocol design, EVM smart contract formal verification, zero-knowledge proofs, and decentralized storage networks using Solidity and Foundry.',
    shortDescription: 'Smart contract formal verification, ZK-rollups, and protocol design.',
    category: 'web-dev',
    date: '2026-11-17',
    time: '09:30 AM',
    endTime: '04:30 PM',
    venue: 'Seminar Hall 3, Block B',
    organizerId: 'org-4',
    maxParticipants: 75,
    status: 'upcoming',
    fee: 'Free',
    tags: ['solidity','web3','zk-proofs','blockchain'],
    schedule: [],
  },
  {
    id: 'evt-011',
    name: 'Autonomous Drone Swarm Showcase',
    description: 'Demonstration of decentralized drone swarm mesh communication, optical flow indoor positioning, and obstacle avoidance algorithms developed by collegiate robotics teams.',
    shortDescription: 'Decentralized drone swarm flight tests and indoor mesh navigation.',
    category: 'robotics',
    date: '2026-08-10',
    time: '11:00 AM',
    endTime: '04:00 PM',
    venue: 'Indoor Sports Complex & Flight Zone',
    organizerId: 'org-2',
    maxParticipants: 140,
    status: 'completed',
    fee: 'Free',
    tags: ['drones','swarms','robotics','mesh-networking'],
    schedule: [],
  },
  {
    id: 'evt-012',
    name: 'Full-Stack Next.js 15 & Server Actions Lab',
    description: 'Completed hands-on masterclass on building high-performance modern web apps with Next.js 15, React Server Components, Tailwind CSS, and Edge Databases.',
    shortDescription: 'Completed workshop on Next.js 15, Server Components, and Edge deployment.',
    category: 'web-dev',
    date: '2026-08-05',
    time: '10:00 AM',
    endTime: '05:00 PM',
    venue: 'Computing Lab 2, Block A',
    organizerId: 'org-1',
    maxParticipants: 40,
    status: 'completed',
    fee: 'Free',
    tags: ['nextjs','react','typescript','cloud'],
    schedule: [],
  }
];

// Participant counts to simulate realistic capacity distributions
const ATTENDEE_COUNTS = {
  'evt-001': 438,
  'evt-002': 214,
  'evt-003': 152,
  'evt-004': 88,
  'evt-005': 58,
  'evt-006': 45,
  'evt-007': 115,
  'evt-008': 32,
  'evt-009': 1080,
  'evt-010': 64,
  'evt-011': 140,
  'evt-012': 40,
};

const compileMockEvents = () => {
  return RAW_EVENTS.map((evt) => {
    const targetCount = ATTENDEE_COUNTS[evt.id] || 25;
    const participants = Array.from({ length: targetCount }, () =>
      generateParticipant(evt.id)
    );
    return {
      ...evt,
      participants,
      registrationCount: targetCount,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

export const MOCK_EVENTS = compileMockEvents();

// ---------- Live Telemetry & Stats Computations ----------
export const getDashboardStats = (events) => {
  const upcomingList = (events || []).filter((e) => e.status === 'upcoming' || e.status === 'ongoing');
  const upcoming = upcomingList.length;
  const totalRegs = upcomingList.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
  const totalSeats = upcomingList.reduce((sum, e) => sum + (e.maxParticipants || 0), 0);
  const available = Math.max(0, totalSeats - totalRegs);
  const avgOccupancy = totalSeats > 0 ? Math.round((totalRegs / totalSeats) * 100) : 0;

  return {
    totalEvents: (events || []).length,
    upcomingEvents: upcoming,
    totalRegistrations: totalRegs,
    availableSeats: available,
    avgOccupancy,
  };
};

export const getRecentRegistrations = (events, limit = 8) => {
  const flat = events.flatMap((evt) =>
    evt.participants.map((p) => ({
      ...p,
      eventName: evt.name,
      eventCategory: evt.category,
      eventDate: evt.date,
    }))
  );
  return flat
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .slice(0, limit);
};

export const REGISTRATION_TREND = generateRegistrationTrend();
