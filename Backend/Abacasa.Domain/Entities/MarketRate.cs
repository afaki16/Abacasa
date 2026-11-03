using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Domain.Entities;

// Piyasa kuru (TCMB döviz satış; USD ve EUR). Global: bütün haneler aynı kuru görür, hane verisi değildir
// (ITenantScoped değil; imha işi ve hane silme rutini dokunmaz). (Currency, Date) başına tek canlı kayıt.
public class MarketRate : BaseEntity
{
    public const string TcmbSource = "TCMB";

    public Currency Currency { get; set; }

    // TCMB listesinin tarihi (hafta sonu ve tatilde son iş günü)
    public DateOnly Date { get; set; }

    public decimal Rate { get; set; }

    public string Source { get; set; } = TcmbSource;

    public DateTime FetchedAt { get; set; }
}
