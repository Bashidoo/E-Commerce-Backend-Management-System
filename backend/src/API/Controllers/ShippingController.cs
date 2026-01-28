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
        return Ok(new
        {
            message = "Shipping Controller is Active",
            time = DateTime.UtcNow,
            sendifyKeyConfigured = !string.IsNullOrEmpty(_configuration["SENDIFY_API_KEY"])
        });
    }

    [HttpPost("book")]
    public async Task<IActionResult> BookShipment([FromBody] BookShipmentRequest request, [FromHeader(Name = "x-api-key")] string? apiKey)
    {
        // 1. Check for Test Mode immediately
        if (request.IsTest)
        {
            return Ok(new
            {
                label_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                shipment_id = "test_simulated_" + Guid.NewGuid().ToString().Substring(0, 8),
                warning = "SIMULATION: No data sent to Sendify. No charge incurred."
            });
        }

        var finalApiKey = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : _configuration["SENDIFY_API_KEY"];

        // 2. Validate API Key
        if (string.IsNullOrWhiteSpace(finalApiKey))
        {
            return Ok(new
            {
                label_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                shipment_id = "mock_no_key_" + Guid.NewGuid().ToString().Substring(0, 8),
                warning = "Running in Mock Mode (No API Key provided on Backend)"
            });
        }

        // 3. Construct Real Sendify Payload
        var sendifyUrl = _configuration["SendifySettings:ApiUrl"]?.Replace("/print", "") // Base URL
                         ?? "https://app.sendify.se/external/v1/shipments";

        var payload = new
        {
            sender = new
            {
                name = "Warehouse 1",
                email = "shipping@store.com",
                address = new
                {
                    address1 = "Industrial Way 1",
                    city = "Stockholm",
                    country = "SE",
                    postal_code = "10000"
                }
            },
            receiver = new
            {
                name = request.Name,
                email = request.Email,
                address = new
                {
                    address1 = request.AddressLine,
                    city = request.City,
                    country = request.Country,
                    postal_code = request.PostalCode
                }
            },
            parcels = new[] {
                new { weight = 1.0, length = 10, width = 10, height = 10, type = "parcel" }
            },
            carrier = "dhl" // Defaulting to DHL
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            var reqMsg = new HttpRequestMessage(HttpMethod.Post, sendifyUrl);
            reqMsg.Headers.Add("x-api-key", finalApiKey);
            reqMsg.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(reqMsg);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                var id = root.GetProperty("id").GetString();

                return Ok(new
                {
                    label_url = $"https://app.sendify.se/external/v1/shipments/{id}/print",
                    shipment_id = id
                });
            }
            else
            {
                _logger.LogWarning("Sendify Booking Failed: {Status} - {Content}.", response.StatusCode, content);
                return StatusCode(502, new { error = "Sendify Booking Failed", details = content });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Booking Exception");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("generate-label")]
    public async Task<IActionResult> GenerateLabel([FromBody] JsonElement payload, [FromHeader(Name = "x-api-key")] string? apiKey)
    {
        var finalApiKey = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : _configuration["SENDIFY_API_KEY"];
        var sendifyUrl = _configuration["SendifySettings:ApiUrl"]
                         ?? "https://app.sendify.se/external/v1/shipments/print";

        if (string.IsNullOrWhiteSpace(finalApiKey))
        {
            return Ok(new { output_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" });
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
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return StatusCode(502, new
                    {
                        error = "Shipment Not Found",
                        details = "The ID provided does not exist in Sendify. Try booking the shipment first."
                    });
                }
                return StatusCode(502, new { error = "Upstream API Error", details = content });
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal Proxy Error", details = ex.Message });
        }
    }
}

public class BookShipmentRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string AddressLine { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public string PostalCode { get; set; }
    public bool IsTest { get; set; } // New Flag
}
