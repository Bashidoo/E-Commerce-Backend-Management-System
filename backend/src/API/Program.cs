using API.Infrastructure;
using Application.Interfaces;
using Application.Mappings;
using Application.Services;
using Application.Validators;
using Domain.Interfaces;
using FluentValidation;
using Infrastructure.Authentication;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// DEBUGGING & CONFIGURATION CHECK
// =========================================================================
Console.WriteLine(">>> STARTING APPLICATION (DEBUG MODE) <<<");
var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
Console.WriteLine($"Environment: {env}");

// 1. Get Connection String with Robust Fallback
// ASP.NET Core usually maps "ConnectionStrings__DefaultConnection" -> "ConnectionStrings:DefaultConnection"
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Fallback: Check environment variable directly if Configuration didn't pick it up
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.WriteLine("Warning: ConnectionString not found in Configuration. Checking Environment Variables directly...");
    connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
}

// CRITICAL FIX: Fail Fast. 
// If we don't have a connection string, we cannot start the app. 
// Throwing here prevents the "No database provider has been configured" error later.
if (string.IsNullOrWhiteSpace(connectionString))
{
    var msg = "CRITICAL ERROR: ConnectionString 'DefaultConnection' is NULL or EMPTY. The application cannot start.";
    Console.WriteLine(msg);
    // This exception will be visible in Cloud Run logs
    throw new InvalidOperationException(msg);
}
else
{
    var masked = System.Text.RegularExpressions.Regex.Replace(connectionString, "Password=[^;]*", "Password=******");
    Console.WriteLine($"Connection String Found: {masked}");
}

// 2. Serilog Configuration
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

// Cloud Run Port Configuration
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

// 3. Database Registration
// We use the validated connectionString from above.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // FIX: Unconditional registration. We already checked string validity above.
    options.UseNpgsql(connectionString);
});

// 4. DI - Repositories
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// 5. DI - Services & Infrastructure
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddHttpClient();

// 6. AutoMapper & Validators
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddValidatorsFromAssemblyContaining<CreateOrderValidator>();

// 7. Global Exception Handler
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// 8. Authentication (JWT)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? Environment.GetEnvironmentVariable("JwtSettings__Secret");

if (!string.IsNullOrEmpty(secretKey))
{
    builder.Services.AddAuthentication(defaultScheme: JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
            };
        });
}
else
{
    Console.WriteLine("WARNING: JWT Secret is missing. Authentication will fail.");
}

// 9. Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "OrderFlow API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// 10. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler();

// Enable Swagger in ALL environments (including Production) for debugging purposes
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();