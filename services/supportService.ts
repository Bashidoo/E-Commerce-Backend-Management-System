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

    // Query "SupportTickets" (PascalCase)
    // Changed sort to 'Id' to ensure safety if CreatedAt column is missing or named differently
    const { data, error } = await supabase
      .from('SupportTickets')
      .select(`
        *,
        Users (*)
      `)
      .order('Id', { ascending: false });

    if (error) {
      console.error("SupportService Fetch Error:", error);
      return [];
    }

    return (data || []).map((t: any) => this.mapDBTicketToDomain(t));
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    const supabase = this.getClient();
    const generatedNum = `TKT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    const payload = {
        UserId: ticket.userId,
        Subject: ticket.subject,
        Description: ticket.description,
        Status: 'Open',
        Priority: ticket.priority,
        OrderId: ticket.orderId,
        OrderNumber: ticket.orderNumber,
        TicketNumber: generatedNum,
        CreatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('SupportTickets')
        .insert(payload)
        .select(`*, Users(*)`)
        .single();
        
    if (error) {
        console.error("SupportService Create Error:", error);
        throw error;
    }

    return this.mapDBTicketToDomain(data);
  }

  async resolveTicket(ticketId: number): Promise<SupportTicket> {
    const supabase = this.getClient();
    const updates = { 
        Status: 'Resolved',
        LastUpdated: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('SupportTickets')
        .update(updates)
        .eq('Id', ticketId)
        .select(`*, Users(*)`)
        .single();

    if (error) {
        console.error("SupportService Resolve Error:", error);
        throw error;
    }

    return this.mapDBTicketToDomain(data);
  }

  private mapDBTicketToDomain(dbItem: any): SupportTicket {
    // Handle potential casing issues in FK relation result
    const rawUser = dbItem.Users || dbItem.users;
    let user: User | undefined;
    
    if (rawUser) {
        user = {
            id: rawUser.Id,
            email: rawUser.Email,
            firstName: rawUser.FirstName,
            lastName: rawUser.LastName,
            address: rawUser.Address,
            role: rawUser.Role
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