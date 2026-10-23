using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IExpenseRepository : IRepository<Expense, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<(IEnumerable<Expense> Expenses, int TotalCount)> GetExpensesPagedAsync(
        int page, int pageSize, ExpenseFilter filter);

    Task<Expense> GetWithRelationsAsync(int id);

    Task<Expense> GetWithRelationsReadOnlyAsync(int id);

    // Özet SQL'de toplanır (GroupBy/Sum). Total yemek kartı hariç, Count tüm harcamalar.
    Task<(decimal Total, decimal MealCardTotal, int Count)> GetTotalsAsync(ExpenseFilter filter);

    // Yemek kartı hariç
    Task<List<(int CategoryId, string CategoryName, decimal Total)>> GetTotalsByCategoryAsync(ExpenseFilter filter);

    // Yemek kartı dahil
    Task<List<(int PaymentMethodId, string PaymentMethodName, PaymentMethodType Type, decimal Total)>> GetTotalsByPaymentMethodAsync(ExpenseFilter filter);

    // Yemek kartı dahil; ödeme aracı ve kişiye (OwnerPersonId) göre (Özet için)
    Task<List<SpendingTotal>> GetTotalsByPaymentMethodAndPersonAsync(ExpenseFilter filter);

    // Yıllık tablo; yemek kartı hariç (kaydın gerçek aracı). Plana bağlı kayıtlar vade ayına (RecurringPaymentMonth) göre.
    Task<List<(int RecurringPaymentId, int Month, decimal Total)>> GetPlanMonthTotalsAsync(int year);

    // Yıllık tablo; yemek kartı hariç, plana bağlı olmayanlar, kategori ve kayıt ayına göre
    Task<List<(int CategoryId, string CategoryName, int Month, decimal Total)>> GetUnplannedCategoryMonthTotalsAsync(int year);
}
