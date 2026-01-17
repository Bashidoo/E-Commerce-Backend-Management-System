import { SupportTicket, User } from '../types';
import { getSupabase } from '../lib/supabaseClient';

class SupportService {
  
  private getClient() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database not configured.");
    return supabase;
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('SupportTickets')
      .select(`
        *,
        User:Users(*)
      `)
      .order('CreatedAt', { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }

    return (data || []).map((t: any) => this.mapDBTicketToDomain(t));
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    const supabase = this.getClient();

    const dbPayload = {
      UserId: ticket.userId,
      Subject: ticket.subject,
      Description: ticket.description,
      Status: 'Open',
      Priority: ticket.priority,
      OrderId: ticket.orderId,
      OrderNumber: ticket.orderNumber,
      // Create random Ticket Number if not handled by DB trigger
      TicketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
    };

    const { data, error } = await supabase
      .from('SupportTickets')
      .insert(dbPayload)
      .select(`*, User:Users(*)`)
      .single();

    if (error) throw error;
    return this.mapDBTicketToDomain(data);
  }

  async resolveTicket(ticketId: number): Promise<SupportTicket> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('SupportTickets')
      .update({ 
        Status: 'Resolved',
        LastUpdated: new Date().toISOString()
      })
      .eq('Id', ticketId)
      .select(`*, User:Users(*)`)
      .single();

    if (error) throw error;
    return this.mapDBTicketToDomain(data);
  }

  // --- Mappers ---

  private mapDBTicketToDomain(dbItem: any): SupportTicket {
    let user: User | undefined;
    if (dbItem.User) {
        user = {
            id: dbItem.User.Id,
            email: dbItem.User.Email,
            firstName: dbItem.User.FirstName,
            lastName: dbItem.User.LastName,
            address: dbItem.User.Address,
            role: dbItem.User.Role
        };
    }

    return {
      id: dbItem.Id,
      userId: dbItem.UserId,
      user,
      ticketNumber: dbItem.TicketNumber,
      subject: dbItem.Subject,
      description: dbItem.Description,
      status: dbItem.Status,
      priority: dbItem.Priority,
      orderId: dbItem.OrderId,
      orderNumber: dbItem.OrderNumber,
      createdAt: dbItem.CreatedAt,
      lastUpdated: dbItem.LastUpdated
    };
  }
}

export const supportService = new SupportService();
