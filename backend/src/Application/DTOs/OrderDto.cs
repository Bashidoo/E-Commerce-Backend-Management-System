namespace Application.DTOs;

public record OrderDto(
    int Id,
    string OrderNumber,
    decimal TotalAmount,
    string Status,
    DateTime OrderDate,
    bool IsLabelPrinted,
    List<OrderItemDto> OrderItems
);

public record OrderItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice);