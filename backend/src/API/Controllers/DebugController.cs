using Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public DebugController(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpGet("db-check")]
    public async Task<IActionResult> CheckDatabase()
    {
        try
        {
            // 1. Can we connect?
            var canConnect = await _context.Database.CanConnectAsync();
            if (!canConnect) 
                return BadRequest(new { Message = "CanConnectAsync returned FALSE. Database unreachable." });
            
            // 2. Can we query?
            var productCount = await _context.Products.CountAsync();
            
            return Ok(new 
            { 
                Status = "Success", 
                Message = "Connected to Database", 
                ProductCount = productCount, 
                Provider = _context.Database.ProviderName 
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                Status = "Failure", 
                Error = ex.Message, 
                InnerError = ex.InnerException?.Message,
                StackTrace = ex.StackTrace 
            });
        }
    }

    [HttpGet("config-check")]
    public IActionResult CheckConfig()
    {
        var connStr = _config.GetConnectionString("DefaultConnection") 
                      ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        
        var hasConn = !string.IsNullOrEmpty(connStr);
        var maskedConn = hasConn 
            ? System.Text.RegularExpressions.Regex.Replace(connStr!, "Password=[^;]*", "Password=******") 
            : "NULL";

        return Ok(new 
        { 
            HasConnectionString = hasConn, 
            ConnectionStringPreview = maskedConn,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Not Set",
            SendifyKeyConfigured = !string.IsNullOrEmpty(_config["SENDIFY_API_KEY"] ?? Environment.GetEnvironmentVariable("SENDIFY_API_KEY"))
        });
    }
}