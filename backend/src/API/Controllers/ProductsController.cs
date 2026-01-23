using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IGenericRepository<Product> _repository;

    public ProductsController(IProductService productService, IGenericRepository<Product> repository)
    {
        _productService = productService;
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetProducts();
        return Ok(products);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        await _repository.AddAsync(product);
        return CreatedAtAction(nameof(GetAll), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Product product)
    {
        if (id != product.Id) return BadRequest();
        await _repository.UpdateAsync(product);
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Soft delete logic handled in service or here
        var product = await _repository.GetByIdAsync(id);
        if (product == null) return NotFound();
        
        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;
        
        await _repository.UpdateAsync(product);
        return NoContent();
    }
}