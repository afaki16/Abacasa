using Abacasa.Domain.Entities;
using System.Collections.Generic;

namespace Abacasa.Domain.Entities;

    public class Tenant : BaseAuditableEntity
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string? Domain { get; set; } // kullanıcının açtığı hanelerde null
    public bool IsActive { get; set; }

    // Modül: bağış hedefleri ve emanetler (zekat/emanet). Yeni hanede kapalı; hane ayarlarından açılır
    public bool DonationExtrasEnabled { get; set; }
    public string ContactEmail { get; set; }
    public string ContactPhone { get; set; }

    // Navigation properties
    public ICollection<User> Users { get; set; }

    public Tenant()
    {
        Users = new HashSet<User>();
        IsActive = true;
        DonationExtrasEnabled = false;
    }
}
