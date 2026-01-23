using Application.DTOs;
using FluentValidation;

namespace Application.Validators;

public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("Order must contain at least one item.");
        RuleFor(x => x.ShippingAddress).NotEmpty();
        RuleFor(x => x.Country).NotEmpty();
        
        RuleForEach(x => x.Items).ChildRules(items => 
        {
            items.RuleFor(i => i.ProductId).GreaterThan(0);
            items.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}