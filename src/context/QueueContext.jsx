import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialQueueState, sampleTickets } from '../data/queueData';

const QueueContext = createContext(null);

// Bump this when demo data changes to auto-reset stale localStorage
const DATA_VERSION = 'v2.0-2026';

export function QueueProvider({ children }) {
  const [queues, setQueues] = useState(() => {
    try {
      const version = localStorage.getItem('qless_data_version');
      if (version !== DATA_VERSION) {
        localStorage.removeItem('qless_queues');
        localStorage.removeItem('qless_tickets');
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

  useEffect(() => {
    localStorage.setItem('qless_queues', JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem('qless_tickets', JSON.stringify(tickets));
  }, [tickets]);

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
   * Reset data back to demo default
   */
  const resetDemoData = () => {
    setQueues(initialQueueState);
    setTickets(sampleTickets);
    localStorage.removeItem('qless_queues');
    localStorage.removeItem('qless_tickets');
  };

  return (
    <QueueContext.Provider value={{
      queues,
      tickets,
      bookAppointment,
      findTicket,
      acceptTicket,
      callPatient,
      completeTicket,
      cancelTicket,
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
