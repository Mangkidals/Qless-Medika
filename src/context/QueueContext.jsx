import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialQueueState, sampleTickets } from '../data/queueData';
import { doctorsList } from '../data/doctorsData';

const QueueContext = createContext(null);

// Bump this when demo data changes to auto-reset stale localStorage
const DATA_VERSION = 'v2.1-2026';

export function QueueProvider({ children }) {
  const [queues, setQueues] = useState(() => {
    try {
      const version = localStorage.getItem('qless_data_version');
      if (version !== DATA_VERSION) {
        localStorage.removeItem('qless_queues');
        localStorage.removeItem('qless_tickets');
        localStorage.removeItem('qless_doctors');
        localStorage.setItem('qless_data_version', DATA_VERSION);
        return initialQueueState;
      }
      const saved = localStorage.getItem('qless_queues');
      return saved ? JSON.parse(saved) : initialQueueState;
    } catch {
      return initialQueueState;
    }
  });

  const [tickets, setTickets] = useState(() => {
    try {
      const version = localStorage.getItem('qless_data_version');
      if (version !== DATA_VERSION) {
        return sampleTickets;
      }
      const saved = localStorage.getItem('qless_tickets');
      return saved ? JSON.parse(saved) : sampleTickets;
    } catch {
      return sampleTickets;
    }
  });

  const [doctors, setDoctors] = useState(() => {
    try {
      const version = localStorage.getItem('qless_data_version');
      if (version !== DATA_VERSION) {
        return doctorsList;
      }
      const saved = localStorage.getItem('qless_doctors');
      return saved ? JSON.parse(saved) : doctorsList;
    } catch {
      return doctorsList;
    }
  });

  useEffect(() => {
    localStorage.setItem('qless_queues', JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem('qless_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('qless_doctors', JSON.stringify(doctors));
  }, [doctors]);

  /**
   * Book a new appointment & generate an instant digital queue ticket
   * Starts with status: "pending" so the admin/counter staff can accept it!
   */
  const bookAppointment = (data) => {
    const randomCodeNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `QLS-${randomCodeNum}`;
    
    // Find clinic prefix
    const clinic = queues.find(q => q.clinicId === data.clinicId) || queues[0];
    const prefix = clinic ? clinic.prefix : "A";
    
    // Calculate new ticket number
    const currentTicketCount = tickets.filter(t => t.clinicId === data.clinicId).length;
    const ticketSequence = (clinic ? parseInt(clinic.currentNumber.split('-')[1], 10) : 20) + currentTicketCount + 1;
    const ticketNumber = `${prefix}-${String(ticketSequence).padStart(3, '0')}`;
    
    // Calculate estimated time
    const waitingAhead = clinic ? clinic.totalWaiting + 1 : 3;
    const estimatedMinutesWait = waitingAhead * (clinic ? clinic.avgServiceTimeMinutes : 12);
    
    const now = new Date();
    const estTime = new Date(now.getTime() + estimatedMinutesWait * 60000);
    const formattedEstTime = `${String(estTime.getHours()).padStart(2, '0')}:${String(estTime.getMinutes()).padStart(2, '0')} WIB`;

    const newTicket = {
      bookingCode,
      ticketNumber,
      patientName: data.patientName,
      nik: data.nik || "3171052408900001",
      phone: data.phone,
      doctorName: data.doctorName,
      doctorId: data.doctorId,
      clinicName: data.clinicName,
      clinicId: data.clinicId,
      room: data.room || "Ruang Konsultasi Terpadu",
      date: data.date || "Hari Ini",
      timeSlot: data.timeSlot,
      estimatedCall: formattedEstTime,
      status: "pending", // Starts as 'pending' so Admin/Petugas can accept it!
      peopleAhead: waitingAhead - 1,
      paymentMethod: data.paymentMethod || "Umum / Mandiri",
      notes: data.complaint || "Pemeriksaan dan konsultasi dokter",
      createdAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);

    // Update queue totalWaiting
    setQueues(prev => prev.map(q => {
      if (q.clinicId === data.clinicId) {
        return {
          ...q,
          totalWaiting: q.totalWaiting + 1
        };
      }
      return q;
    }));

    return newTicket;
  };

  /**
   * Admin / Staff Action: Accept a pending queue ticket
   */
  const acceptTicket = (bookingCode) => {
    setTickets(prev => prev.map(t => {
      if (t.bookingCode === bookingCode) {
        return {
          ...t,
          status: 'waiting',
          acceptedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        };
      }
      return t;
    }));
  };

  /**
   * Admin / Staff Action: Call a patient into the counter / consultation room
   */
  const callPatient = (bookingCode) => {
    const ticket = tickets.find(t => t.bookingCode === bookingCode);
    if (!ticket) return;

    // Update ticket status to serving
    setTickets(prev => prev.map(t => {
      if (t.bookingCode === bookingCode) {
        return {
          ...t,
          status: 'serving',
          calledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        };
      }
      return t;
    }));

    // Update clinic queue active display
    setQueues(prev => prev.map(clinic => {
      if (clinic.clinicId === ticket.clinicId) {
        const curNum = parseInt(ticket.ticketNumber.split('-')[1], 10);
        const nextNum = curNum + 1;
        const newNext = `${clinic.prefix}-${String(nextNum).padStart(3, '0')}`;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

        return {
          ...clinic,
          currentNumber: ticket.ticketNumber,
          nextNumber: newNext,
          totalWaiting: Math.max(0, clinic.totalWaiting - 1),
          lastCalledAt: timeStr
        };
      }
      return clinic;
    }));

    // Audio chime / voice announcement simulation
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(
          `Nomor antrean, ${ticket.ticketNumber.replace('-', ' ')}, silakan menuju ${ticket.room}`
        );
        utterance.lang = 'id-ID';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback silently if speech synthesis not permitted
      }
    }
  };

  /**
   * Admin / Staff Action: Mark consultation as completed
   */
  const completeTicket = (bookingCode) => {
    setTickets(prev => prev.map(t => {
      if (t.bookingCode === bookingCode) {
        return {
          ...t,
          status: 'completed',
          completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        };
      }
      return t;
    }));
  };

  /**
   * Admin / Staff Action: Cancel or skip ticket
   */
  const cancelTicket = (bookingCode, reason = 'Pasien tidak hadir setelah 3 kali panggilan') => {
    setTickets(prev => prev.map(t => {
      if (t.bookingCode === bookingCode) {
        return {
          ...t,
          status: 'cancelled',
          cancelReason: reason
        };
      }
      return t;
    }));
  };

  /**
   * Find ticket by booking code or ticket number
   */
  const findTicket = (searchQuery) => {
    if (!searchQuery) return null;
    const q = searchQuery.trim().toUpperCase();
    return tickets.find(t => 
      t.bookingCode.toUpperCase() === q || 
      t.ticketNumber.toUpperCase() === q
    ) || null;
  };

  /**
   * Advance clinic queue for demo interactivity
   */
  const advanceClinicQueue = (clinicId) => {
    setQueues(prev => prev.map(clinic => {
      if (clinic.clinicId === clinicId) {
        const curNum = parseInt(clinic.currentNumber.split('-')[1], 10);
        const nextNum = curNum + 1;
        const newCur = `${clinic.prefix}-${String(nextNum).padStart(3, '0')}`;
        const newNext = `${clinic.prefix}-${String(nextNum + 1).padStart(3, '0')}`;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

        return {
          ...clinic,
          currentNumber: newCur,
          nextNumber: newNext,
          totalWaiting: Math.max(0, clinic.totalWaiting - 1),
          lastCalledAt: timeStr
        };
      }
      return clinic;
    }));
  };

  /**
   * Delete an existing ticket permanently
   */
  const deleteTicket = (bookingCode) => {
    setTickets(prev => prev.filter(t => t.bookingCode !== bookingCode));
  };

  /**
   * Admin: Add a new Doctor
   */
  const addDoctor = (doctorData) => {
    const newId = `doc-${Date.now()}`;
    const newDoctor = {
      id: newId,
      name: doctorData.name,
      title: doctorData.title || `Spesialis ${doctorData.specialty}`,
      specialty: doctorData.specialty,
      specialtyId: doctorData.specialtyId || doctorData.specialty.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      rating: 5.0,
      reviewsCount: 1,
      experience: doctorData.experience || "5 Tahun",
      education: doctorData.education || "Fakultas Kedokteran Spesialis Terpadu",
      strNumber: doctorData.strNumber || `STR-31.1.${Math.floor(1000 + Math.random() * 9000)}.2026`,
      photo: doctorData.photo || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80",
      fee: doctorData.fee || "Rp 250.000",
      days: doctorData.days && doctorData.days.length > 0 ? doctorData.days : ["Senin", "Rabu", "Jumat"],
      clinicRoom: doctorData.clinicRoom || "Ruang 201, Lantai 2",
      totalQuota: parseInt(doctorData.totalQuota, 10) || 20,
      timeSlots: doctorData.timeSlots && doctorData.timeSlots.length > 0 ? doctorData.timeSlots : [
        { time: "08:30 - 09:00", available: true, quotaRemaining: 3 },
        { time: "09:00 - 09:30", available: true, quotaRemaining: 3 },
        { time: "10:00 - 10:30", available: true, quotaRemaining: 3 },
        { time: "11:00 - 11:30", available: true, quotaRemaining: 3 },
        { time: "13:30 - 14:00", available: true, quotaRemaining: 4 },
        { time: "14:00 - 14:30", available: true, quotaRemaining: 4 }
      ],
      bio: doctorData.bio || "Dokter spesialis berpengalaman di RS Qless Medika."
    };

    setDoctors(prev => [newDoctor, ...prev]);
    return newDoctor;
  };

  /**
   * Admin: Delete a Doctor
   */
  const deleteDoctor = (id) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  /**
   * Reset data back to demo default
   */
  const resetDemoData = () => {
    setQueues(initialQueueState);
    setTickets(sampleTickets);
    setDoctors(doctorsList);
    localStorage.removeItem('qless_queues');
    localStorage.removeItem('qless_tickets');
    localStorage.removeItem('qless_doctors');
  };

  return (
    <QueueContext.Provider value={{
      queues,
      tickets,
      doctors,
      bookAppointment,
      findTicket,
      acceptTicket,
      callPatient,
      completeTicket,
      cancelTicket,
      deleteTicket,
      addDoctor,
      deleteDoctor,
      advanceClinicQueue,
      resetDemoData
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
