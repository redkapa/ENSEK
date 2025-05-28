using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<Database>(options =>
    options
        .UseInMemoryDatabase("database")
        .UseSeeding((context, _) =>
        {
            using var reader = new StreamReader("Test_Accounts.csv");
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var records = csv.GetRecords<Account>();

            foreach (var record in records)
            {
                context.Set<Account>().Add(record);
            }
            context.SaveChanges();
        }));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Add your React app's URL
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<Database>();
    db.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
//app.UseHttpsRedirection();
app.UseCors("AllowLocalhost");

app.MapGet("/accounts", (Database db) =>
{
    return db.Accounts.ToList();
});

app.MapGet("/meter-reading-uploads", (Database db) =>
{
    return db.MeterReadings.ToList();
});

app.MapPost("/meter-reading-uploads", (IFormFile file, Database db) =>
{
    if (file is null)
    {
        return Results.BadRequest("file is null");
    }
    try
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null
        };
        using var reader = new StreamReader(file.OpenReadStream());
        using var csv = new CsvReader(reader, config);
        {
            var records = csv.GetRecords<MeterReadingCSV>();
            int failed = 0;
            int success = 0;
            string format = "dd/MM/yyyy HH:mm";
            foreach (var item in records)
            {
                try
                {
                    var account = db.Accounts.FirstOrDefault(a => a.AccountId == item.AccountId);
                    if (account == null)
                    {
                        failed++;
                        continue;
                    }

                    item.MeterReadValue = int.Parse(item.MeterReadValue).ToString("D5");

                    var existing = db.MeterReadings.FirstOrDefault(m => m.AccountId == item.AccountId);
                    if (existing is null)
                    {
                        db.MeterReadings.Add(new MeterReading
                        {
                            AccountId = item.AccountId,
                            MeterReadingDateTime = item.MeterReadingDateTime,
                            MeterReadValue = item.MeterReadValue
                        });
                        success++;
                        continue;
                    }
                    else
                    {
                        if (DateTime.TryParseExact(existing.MeterReadingDateTime, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime existingDate)
                            && DateTime.TryParseExact(item.MeterReadingDateTime, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime currentDate)
                            && currentDate > existingDate)
                        {
                            existing.MeterReadingDateTime = item.MeterReadingDateTime;
                            existing.MeterReadValue = item.MeterReadValue;
                            success++;
                            continue;
                        }
                        failed++;
                        continue;
                    }
                }
                finally
                {
                    db.SaveChanges();
                }
            }

            return Results.Ok(new { Success = success, Fails = failed });
        }
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
}).DisableAntiforgery();

app.Run();


class Database(DbContextOptions options) : DbContext(options)
{
    public DbSet<Account> Accounts { get; set; } = null!;
    public DbSet<MeterReading> MeterReadings { get; set; } = null!;
}

class Account()
{
    public int AccountId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
}

class MeterReadingCSV()
{
    public int AccountId { get; set; }
    public required string MeterReadingDateTime { get; set; }
    public required string MeterReadValue { get; set; }
}

class MeterReading() : MeterReadingCSV()
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
}
