using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/shipping")]
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

    [HttpGet("test")]
    public IActionResult TestConnection()
    {
        // Simple 200 OK to verify connectivity
        return Ok(new
        {
            message = "Shipping Controller is Active",
            time = DateTime.UtcNow,
            sendifyKeyConfigured = !string.IsNullOrEmpty(_configuration["SENDIFY_API_KEY"])
        });
    }

    [HttpPost("generate-label")]
    public async Task<IActionResult> GenerateLabel([FromBody] JsonElement payload, [FromHeader(Name = "x-api-key")] string? apiKey)
    {
        // 1. Resolve API Key
        var envKey = _configuration["SENDIFY_API_KEY"];
        var finalApiKey = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : envKey;

        // 2. Resolve Sendify URL
        var sendifyUrl = _configuration["SendifySettings:ApiUrl"]
                         ?? _configuration["SENDIFY_API_URL"]
                         ?? "https://app.sendify.se/external/v1/shipments/print";

        _logger.LogInformation(">>> Generating Label Request");
        _logger.LogInformation("Target URL: {Url}", sendifyUrl);

        if (string.IsNullOrWhiteSpace(finalApiKey))
        {
            return Unauthorized(new { message = "Sendify API Key is missing on Server." });
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
                _logger.LogError("Upstream Sendify Error: {StatusCode} - {Content}", response.StatusCode, content);

                // IMPORTANT: If Sendify returns 404, we return 502 (Bad Gateway) to distinguish 
                // between "Our Backend Route Missing" (404) and "Sendify Shipment Not Found" (404).
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return StatusCode(502, new
                    {
                        error = "Upstream Sendify Resource Not Found",
                        details = "The Shipment ID sent to Sendify was not found.",
                        upstream_response = content
                    });
                }

                // Proxy other errors as 502
                return StatusCode(502, new
                {
                    error = $"Upstream API Error ({response.StatusCode})",
                    details = content
                });
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Internal Backend Proxy Exception");
            return StatusCode(500, new { message = "Internal Backend Proxy Error", details = ex.Message });
        }
    }
}