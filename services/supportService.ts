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

    // Try standard snake_case table first
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        users (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("SupportService: Failed to fetch from 'support_tickets', trying legacy 'SupportTickets'...", error.message);
      return this.getAllTicketsLegacy();
    }

    return (data || []).map((t: any) => this.mapDBTicketToDomain(t));
  }

  private async getAllTicketsLegacy(): Promise<SupportTicket[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('SupportTickets')
      .select(`*, User:Users(*)`)
      .order('CreatedAt', { ascending: false });

    if (error) {
        console.error("SupportService Legacy Fetch Error:", error);
        return [];
    }
    return (data || []).map((t: any) => this.mapDBTicketToDomain(t));
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    const supabase = this.getClient();
    const generatedNum = `TKT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    // Try standard snake_case insert
    const payload = {
      user_id: ticket.userId,
      subject: ticket.subject,
      description: ticket.description,
      status: 'Open',
      priority: ticket.priority,
      order_id: ticket.orderId,
      order_number: ticket.orderNumber,
      ticket_number: generatedNum
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert(payload)
      .select(`*, users(*)`)
      .single();

    if (error) {
        // Legacy Fallback
        const legacyPayload = {
            UserId: ticket.userId,
            Subject: ticket.subject,
            Description: ticket.description,
            Status: 'Open',
            Priority: ticket.priority,
            OrderId: ticket.orderId,
            OrderNumber: ticket.orderNumber,
            TicketNumber: generatedNum
        };
        const { data: legacyData, error: legacyError } = await supabase
            .from('SupportTickets')
            .insert(legacyPayload)
            .select(`*, User:Users(*)`)
            .single();
            
        if (legacyError) throw legacyError;
        return this.mapDBTicketToDomain(legacyData);
    }

    return this.mapDBTicketToDomain(data);
  }

  async resolveTicket(ticketId: number): Promise<SupportTicket> {
    const supabase = this.getClient();
    const updates = { 
        status: 'Resolved',
        last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select(`*, users(*)`)
      .single();

    if (error) {
        // Legacy Fallback
        const legacyUpdates = { 
            Status: 'Resolved',
            LastUpdated: new Date().toISOString()
        };
        const { data: legacyData, error: legacyError } = await supabase
            .from('SupportTickets')
            .update(legacyUpdates)
            .eq('Id', ticketId)
            .select(`*, User:Users(*)`)
            .single();

        if (legacyError) throw legacyError;
        return this.mapDBTicketToDomain(legacyData);
    }

    return this.mapDBTicketToDomain(data);
  }

  // --- Mappers ---
  private mapDBTicketToDomain(dbItem: any): SupportTicket {
    const rawUser = dbItem.users || dbItem.User || dbItem.user;
    let user: User | undefined;
    
    if (rawUser) {
        user = {
            id: rawUser.id || rawUser.Id,
            email: rawUser.email || rawUser.Email,
            firstName: rawUser.first_name || rawUser.FirstName,
            lastName: rawUser.last_name || rawUser.LastName,
            address: rawUser.address || rawUser.Address,
            role: rawUser.role || rawUser.Role
        };
    }

    return {
      id: dbItem.id || dbItem.Id,
      userId: dbItem.user_id || dbItem.UserId,
      user,
      ticketNumber: dbItem.ticket_number || dbItem.TicketNumber,
      subject: dbItem.subject || dbItem.Subject,
      description: dbItem.description || dbItem.Description,
      status: dbItem.status || dbItem.Status,
      priority: dbItem.priority || dbItem.Priority,
      orderId: dbItem.order_id || dbItem.OrderId,
      orderNumber: dbItem.order_number || dbItem.OrderNumber,
      createdAt: dbItem.created_at || dbItem.CreatedAt,
      lastUpdated: dbItem.last_updated || dbItem.LastUpdated
    };
  }
}

export const supportService = new SupportService();