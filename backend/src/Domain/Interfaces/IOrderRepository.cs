using Domain.Entities;

namespace Domain.Interfaces;

public interface IOrderRepository : IGenericRepository<Order>
{
    Task<IEnumerable<Order>> GetOrdersByUserIdAsync(int userId);
    Task<Order?> GetOrderWithDetailsAsync(int id);
}