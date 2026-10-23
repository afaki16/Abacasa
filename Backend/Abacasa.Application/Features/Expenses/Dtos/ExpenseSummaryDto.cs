using Abacasa.Domain.Common.Enums;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Expenses.Dtos;

public class ExpenseSummaryDto
{
    /// Yemek kartı hariç toplam
    public decimal Total { get; set; }
    public decimal MealCardTotal { get; set; }
    public int Count { get; set; }
    /// Yemek kartı hariç
    public List<ExpenseCategoryTotalDto> ByCategory { get; set; } = new();
    /// Yemek kartı dahil
    public List<ExpensePaymentMethodTotalDto> ByPaymentMethod { get; set; } = new();
}

public class ExpenseCategoryTotalDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public decimal Total { get; set; }
}

public class ExpensePaymentMethodTotalDto
{
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType Type { get; set; }
    public decimal Total { get; set; }
}
