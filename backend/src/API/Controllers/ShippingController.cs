using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ShippingController> _logger;

    public ShippingController(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<ShippingController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("generate-label")]
    public async Task<IActionResult> GenerateLabel([FromBody] JsonElement payload, [FromHeader(Name = "x-api-key")] string? apiKey)
    {
        // Check for 'SENDIFY_API_KEY' which matches the GitHub Secret name provided by user
        var envKey = _configuration["SENDIFY_API_KEY"];
        
        // Use Header Key (Dev Override) OR Server Env Key
        var finalApiKey = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : envKey;

        // Logging for debugging (Masking key)
        var keyStatus = string.IsNullOrWhiteSpace(finalApiKey) ? "MISSING" : $"PRESENT (Starts with {finalApiKey.Substring(0, Math.Min(4, finalApiKey.Length))}...)";
        _logger.LogInformation("Generating Label. API Key Status: {KeyStatus}. Source: {Source}", 
            keyStatus, 
            !string.IsNullOrWhiteSpace(apiKey) ? "Client Header" : "Server Env (SENDIFY_API_KEY)");

        // Configurable URL (Defaults to Production if missing)
        var sendifyUrl = _configuration["SendifySettings:ApiUrl"] 
                         ?? _configuration["SENDIFY_API_URL"] 
                         ?? "https://app.sendify.se/external/v1/shipments/print";

        _logger.LogInformation("Target Sendify URL: {Url}", sendifyUrl);

        if (string.IsNullOrWhiteSpace(finalApiKey))
        {
            return Unauthorized(new { message = "Sendify API Key is missing. Please configure 'SENDIFY_API_KEY' in Backend Environment Variables." });
        }

        try 
        {
            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, sendifyUrl);
            
            request.Headers.Add("x-api-key", finalApiKey);
            request.Content = new StringContent(payload.ToString(), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Sendify API Error: {StatusCode} - {Content}", response.StatusCode, content);
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Internal Backend Proxy Error");
            return StatusCode(500, new { message = "Internal Backend Proxy Error", details = ex.Message });
        }
    }
}