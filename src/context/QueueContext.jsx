import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialQueueState, sampleTickets } from '../data/queueData';

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [queues, setQueues] = useState(() => {
    try {
      const saved = localStorage.getItem('qless_queues');
      return saved ? JSON.parse(saved) : initialQueueState;
    } catch {
      return initialQueueState;
    }
  });

  const [tickets, setTickets] = useState(() => {
    try {
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
      nik: data.nik ? `${data.nik.slice(0, 4)}********${data.nik.slice(-4)}` : "3171********0001",
      phone: data.phone,
      doctorName: data.doctorName,
      doctorId: data.doctorId,
      clinicName: data.clinicName,
      clinicId: data.clinicId,
      room: data.room || "Ruang Konsultasi Terpadu",
      date: data.date || "Hari Ini",
      timeSlot: data.timeSlot,
      estimatedCall: formattedEstTime,
      status: "waiting", // 'waiting' | 'called' | 'serving' | 'completed'
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

  return (
    <QueueContext.Provider value={{
      queues,
      tickets,
      bookAppointment,
      findTicket,
      advanceClinicQueue
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
