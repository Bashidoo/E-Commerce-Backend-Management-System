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

    public ShippingController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("generate-label")]
    public async Task<IActionResult> GenerateLabel([FromBody] JsonElement payload, [FromHeader(Name = "x-api-key")] string? apiKey)
    {
        // Security Upgrade: 
        // 1. Check if frontend provided a key (Legacy/Dev mode)
        // 2. If not, check server-side Environment Variable (Secure/Production mode)
        var finalApiKey = !string.IsNullOrWhiteSpace(apiKey) 
            ? apiKey 
            : _configuration["SENDIFY_API_KEY"];

        if (string.IsNullOrWhiteSpace(finalApiKey))
        {
            return Unauthorized(new { message = "Sendify API Key is missing. Please configure 'SENDIFY_API_KEY' in Backend Environment Variables or Client Settings." });
        }

        try 
        {
            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://app.sendify.se/external/v1/shipments/print");
            
            request.Headers.Add("x-api-key", finalApiKey);
            request.Content = new StringContent(payload.ToString(), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal Backend Proxy Error", details = ex.Message });
        }
    }
}