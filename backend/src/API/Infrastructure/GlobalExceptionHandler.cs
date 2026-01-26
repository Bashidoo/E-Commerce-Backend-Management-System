using Application.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace API.Infrastructure;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Exception occurred: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path
        };

        switch (exception)
        {
            case ValidationException validationEx:
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                problemDetails.Title = "Validation Error";
                problemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
                problemDetails.Detail = "One or more validation errors occurred.";
                problemDetails.Extensions["errors"] = validationEx.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                break;

            case NotFoundException notFoundEx:
                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                problemDetails.Title = "Not Found";
                problemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4";
                problemDetails.Detail = notFoundEx.Message;
                break;

            case UnauthorizedException unauthorizedEx:
                httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                problemDetails.Title = "Unauthorized";
                problemDetails.Type = "https://tools.ietf.org/html/rfc7235#section-3.1";
                problemDetails.Detail = unauthorizedEx.Message;
                break;

            default:
                // DEBUGGING MODE: Exposing internal errors to the client to identify Cloud Run issues
                httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
                problemDetails.Title = "Internal Server Error";
                problemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1";
                problemDetails.Detail = $"Error: {exception.Message}";
                
                // Add StackTrace and Inner Exception for deep debugging
                problemDetails.Extensions["innerError"] = exception.InnerException?.Message;
                problemDetails.Extensions["stackTrace"] = exception.StackTrace;
                break;
        }

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}