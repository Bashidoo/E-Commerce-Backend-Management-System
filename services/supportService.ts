import { SupportTicket } from '../types';
import { mockTickets } from './mockData';

class SupportService {
  private tickets: SupportTicket[] = [...mockTickets];

  async getAllTickets(): Promise<SupportTicket[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.tickets]);
      }, 500);
    });
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTicket: SupportTicket = {
          id: Math.max(...this.tickets.map(t => t.id), 0) + 1,
          ticketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          userId: ticket.userId || 1,
          subject: ticket.subject || 'No Subject',
          description: ticket.description || '',
          status: 'Open',
          priority: ticket.priority || 'Medium',
          orderId: ticket.orderId || null,
          orderNumber: ticket.orderNumber || undefined,
          createdAt: new Date().toISOString(),
          ...ticket,
        } as SupportTicket;

        this.tickets.unshift(newTicket);
        resolve(newTicket);
      }, 600);
    });
  }

  async resolveTicket(ticketId: number): Promise<SupportTicket> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
          const updated = {
            ...this.tickets[index],
            status: 'Resolved' as const,
            lastUpdated: new Date().toISOString()
          };
          this.tickets[index] = updated;
          resolve(updated);
        } else {
          reject(new Error("Ticket not found"));
        }
      }, 400);
    });
  }
}

export const supportService = new SupportService();