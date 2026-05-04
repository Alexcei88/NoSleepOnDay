var builder = WebApplication.CreateBuilder(args);

const string AngularDevCorsPolicy = "AllowAngularDev";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors(AngularDevCorsPolicy);
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();

public partial class Program;
