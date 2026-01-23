namespace Application.DTOs;

public record CreateOrderItemDto(int ProductId, int Quantity);

public record CreateOrderDto(
    int? UserId,
    List<CreateOrderItemDto> Items,
    string ShippingAddress,
    string City,
    string Country,
    string PostalCode,
    string? State,
    string? Phone
);