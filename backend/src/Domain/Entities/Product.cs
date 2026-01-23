namespace Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public string InspiredBy { get; set; } = string.Empty;
    public string Gender { get; set; } = "Unisex";
    public decimal? OriginalPrice { get; set; }
    public bool IsOnSale { get; set; }
    public bool IsNew { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}