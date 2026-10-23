using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Expenses.Dtos;

public class ExpenseListDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType PaymentMethodType { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerPersonName { get; set; }     // Boşsa harcama hanenindir
    public DateTime CreatedDate { get; set; }
}
