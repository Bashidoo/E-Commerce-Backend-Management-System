using Application.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using FluentValidation;

namespace Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IMapper _mapper;
    private readonly IValidator<CreateOrderDto> _validator;

    public OrderService(
        IOrderRepository orderRepository, 
        IGenericRepository<Product> productRepository,
        IMapper mapper, 
        IValidator<CreateOrderDto> validator)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _mapper = mapper;
        _validator = validator;
    }

    public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await _orderRepository.GetAllAsync();
        // Note: Real implementation might need eager loading in GetAllAsync or a separate specific repo method
        return _mapper.Map<IEnumerable<OrderDto>>(orders);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        var order = await _orderRepository.GetOrderWithDetailsAsync(id);
        return order == null ? null : _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderDto dto)
    {
        var validationResult = await _validator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var order = new Order
        {
            UserId = dto.UserId,
            OrderDate = DateTime.UtcNow,
            OrderNumber = $"ORD-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
            Status = "Pending",
            ShippingAddressSnapshot = dto.ShippingAddress,
            ShippingCitySnapshot = dto.City,
            ShippingCountrySnapshot = dto.Country,
            ShippingPostalCodeSnapshot = dto.PostalCode,
            ShippingStateSnapshot = dto.State,
            ShippingPhoneSnapshot = dto.Phone,
            OrderItems = new List<OrderItem>()
        };

        decimal totalAmount = 0;

        foreach (var itemDto in dto.Items)
        {
            var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
            if (product == null)
                throw new Exception($"Product {itemDto.ProductId} not found");

            if (product.StockQuantity < itemDto.Quantity)
                throw new Exception($"Insufficient stock for {product.Name}");

            // Deduct stock
            product.StockQuantity -= itemDto.Quantity;
            await _productRepository.UpdateAsync(product);

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = product.Price 
            };

            order.OrderItems.Add(orderItem);
            totalAmount += (orderItem.Quantity * orderItem.UnitPrice);
        }

        order.TotalAmount = totalAmount;

        await _orderRepository.AddAsync(order);
        return _mapper.Map<OrderDto>(order);
    }
}