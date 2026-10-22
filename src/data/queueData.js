export const initialQueueState = [
  {
    clinicId: "penyakit-dalam",
    clinicName: "Poli Penyakit Dalam",
    prefix: "A",
    counter: "Loket 01",
    currentNumber: "A-024",
    nextNumber: "A-025",
    totalWaiting: 6,
    avgServiceTimeMinutes: 12,
    activeDoctor: "dr. Adrian Pratama, Sp.PD",
    status: "serving", // 'serving' | 'paused' | 'closed'
    lastCalledAt: "10:14 WIB"
  },
  {
    clinicId: "anak",
    clinicName: "Poli Anak",
    prefix: "B",
    counter: "Loket 02",
    currentNumber: "B-012",
    nextNumber: "B-013",
    totalWaiting: 3,
    avgServiceTimeMinutes: 8,
    activeDoctor: "dr. Anisa Larasati, Sp.A",
    status: "serving",
    lastCalledAt: "10:18 WIB"
  },
  {
    clinicId: "gigi",
    clinicName: "Poli Gigi & Mulut",
    prefix: "C",
    counter: "Loket 03",
    currentNumber: "C-008",
    nextNumber: "C-009",
    totalWaiting: 4,
    avgServiceTimeMinutes: 15,
    activeDoctor: "drg. Rayhan Wirawan, Sp.KG",
    status: "serving",
    lastCalledAt: "10:05 WIB"
  },
  {
    clinicId: "jantung",
    clinicName: "Poli Jantung & Pembuluh Darah",
    prefix: "D",
    counter: "Loket 04",
    currentNumber: "D-005",
    nextNumber: "D-006",
    totalWaiting: 2,
    avgServiceTimeMinutes: 14,
    activeDoctor: "dr. Farhan Baskoro, Sp.JP",
    status: "serving",
    lastCalledAt: "10:10 WIB"
  },
  {
    clinicId: "mata",
    clinicName: "Poli Mata",
    prefix: "E",
    counter: "Loket 05",
    currentNumber: "E-015",
    nextNumber: "E-016",
    totalWaiting: 5,
    avgServiceTimeMinutes: 10,
    activeDoctor: "dr. Nadia Kusuma, Sp.M",
    status: "serving",
    lastCalledAt: "10:16 WIB"
  },
  {
    clinicId: "farmasi",
    clinicName: "Apotek & Pengambilan Obat",
    prefix: "F",
    counter: "Loket Farmasi 1-3",
    currentNumber: "F-102",
    nextNumber: "F-103",
    totalWaiting: 9,
    avgServiceTimeMinutes: 5,
    activeDoctor: "Tim Farmasi Klinis",
    status: "serving",
    lastCalledAt: "10:20 WIB"
  }
];

export const sampleTickets = [
  {
    bookingCode: "QLS-8821",
    ticketNumber: "A-027",
    patientName: "Bambang Sudarmono",
    nik: "3171************",
    doctorName: "dr. Adrian Pratama, Sp.PD, K-GEH",
    clinicName: "Poli Penyakit Dalam",
    clinicId: "penyakit-dalam",
    room: "Ruang 202, Lantai 2",
    date: "Hari Ini, 23 Oktober 2026",
    timeSlot: "10:30 - 11:00 WIB",
    estimatedCall: "10:38 WIB",
    status: "waiting", // 'called' | 'serving' | 'waiting' | 'completed' | 'cancelled'
    peopleAhead: 2,
    paymentMethod: "BPJS Kesehatan",
    notes: "Kontrol rutin asam lambung"
  },
  {
    bookingCode: "QLS-4412",
    ticketNumber: "B-015",
    patientName: "Mikhaela Putri (Anak)",
    nik: "3172************",
    doctorName: "dr. Anisa Larasati, Sp.A, M.Biomed",
    clinicName: "Poli Anak",
    clinicId: "anak",
    room: "Ruang 209 (Kids Corner), Lantai 2",
    date: "Hari Ini, 23 Oktober 2026",
    timeSlot: "11:00 - 11:30 WIB",
    estimatedCall: "11:05 WIB",
    status: "waiting",
    peopleAhead: 2,
    paymentMethod: "Asuransi Swasta",
    notes: "Imunisasi DPT Booster & Tumbuh Kembang"
  }
];
