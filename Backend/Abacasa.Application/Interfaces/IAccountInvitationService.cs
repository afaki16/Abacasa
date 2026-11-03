using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// Hesap daveti: admin'in oluşturduğu kullanıcıya şifresini belirlemesi için e-posta gönderir.
    /// Hane daveti (HouseholdInvitation) ile ilgisi yoktur; haneye üyelik açmaz.
    /// </summary>
    public interface IAccountInvitationService
    {
        /// <summary>
        /// Invalidates the user's previous reset/invitation links, creates a new one and emails it.
        /// The user sets their own password through the reset-password page.
        /// </summary>
        Task<Result> SendAsync(User user, CancellationToken cancellationToken = default);
    }
}
