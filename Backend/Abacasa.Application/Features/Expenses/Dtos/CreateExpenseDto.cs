using System;

namespace Abacasa.Application.Features.Expenses.Dtos;

public class CreateExpenseDto
{
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public int PaymentMethodId { get; set; }
    public int? OwnerPersonId { get; set; }
}
