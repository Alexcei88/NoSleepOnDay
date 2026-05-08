using NoSleepOnDay.Api.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

const string AngularDevCorsPolicy = "AllowAngularDev";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularDevCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 4096;
});

builder.Services.AddSingleton<IRegionCatalog, RegionCatalog>();
builder.Services.AddSingleton<ISunCalculator, SunCalculator>();
builder.Services.AddSingleton<IDaylightAnalysisService, DaylightAnalysisService>();
builder.Services.AddSingleton<IHeatmapService, HeatmapService>();
builder.Services.AddHostedService<HeatmapWarmupHostedService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "No Sleep On Day API";
        options.Theme = ScalarTheme.BluePlanet;
    });
    app.UseCors(AngularDevCorsPolicy);
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();

public partial class Program;
