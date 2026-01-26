using Domain.Entities;

namespace Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<Product>> GetProducts();
}