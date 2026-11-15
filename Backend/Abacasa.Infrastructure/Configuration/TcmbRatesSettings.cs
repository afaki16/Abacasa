namespace Abacasa.Infrastructure.Configuration
{
    // appsettings "TcmbRates" bölümü (TCMB kur işi)
    public class TcmbRatesSettings
    {
        public bool Enabled { get; set; } = true;
        public string Url { get; set; } = "https://www.tcmb.gov.tr/kurlar/today.xml";
        // Geçmiş tarih listesi: {0} tarih (yyyyMM klasörü, ddMMyyyy dosyası)
        public string ArchiveUrlFormat { get; set; } = "https://www.tcmb.gov.tr/kurlar/{0:yyyyMM}/{0:ddMMyyyy}.xml";
        public int IntervalHours { get; set; } = 3;
        public int StartupDelayMinutes { get; set; } = 1;
        public int TimeoutSeconds { get; set; } = 15;
    }
}
