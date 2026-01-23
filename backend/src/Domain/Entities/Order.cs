namespace Domain.Entities;

public class Order : BaseEntity
{
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string? OrderNumber { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public bool IsLabelPrinted { get; set; } = false;
    public DateTime? LabelPrintedDate { get; set; }

    // Address Snapshot
    public string? ShippingAddressSnapshot { get; set; }
    public string? ShippingCitySnapshot { get; set; }
    public string? ShippingCountrySnapshot { get; set; }
    public string? ShippingPostalCodeSnapshot { get; set; }
    public string? ShippingPhoneSnapshot { get; set; }
    public string? ShippingStateSnapshot { get; set; }
    public string? ShippingZipSnapshot { get; set; }

    public string Status { get; set; } = "Pending";

    public int? UserId { get; set; }
    public User? User { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}